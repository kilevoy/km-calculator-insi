import asyncio
import json
import logging
import os
import re
import secrets
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("insi_calculator_server")

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))
UPLOAD_TOKEN = os.getenv("DRIVE_UPLOAD_TOKEN", "")
SCRIPT_PATH = Path(
    os.getenv(
        "GOOGLE_API_SCRIPT",
        "~/.hermes/skills/productivity/google-workspace/scripts/google_api.py",
    )
).expanduser()
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
FOLDER_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{10,128}$")
FILENAME_PATTERN = re.compile(r"[^0-9A-Za-zА-Яа-яЁё._ -]+")
ALLOWED_DRIVE_HOSTS = {"drive.google.com", "docs.google.com"}
DRIVE_ROOT_FOLDER_ID = os.getenv("DRIVE_ROOT_FOLDER_ID", "")
DRIVE_ROOT_FOLDER_NAME = os.getenv("DRIVE_ROOT_FOLDER_NAME", "КМ-Калькулятор")
BUSINESS_TIMEZONE = os.getenv("BUSINESS_TIMEZONE", "Asia/Yekaterinburg")
GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder"
folder_lock = asyncio.Lock()

app = FastAPI(title="INSI KM Calculator Drive Proxy", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Authorization", "Content-Type"],
)


def authorize(authorization: str | None) -> None:
    if not UPLOAD_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Drive upload is not configured.",
        )
    supplied = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not supplied or not secrets.compare_digest(supplied, UPLOAD_TOKEN):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized.")


def safe_filename(value: str | None) -> str:
    name = Path(value or "report.pdf").name
    name = FILENAME_PATTERN.sub("_", name).strip(" .")
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"
    return name[:160] or "report.pdf"


def safe_drive_url(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    parsed = urlparse(value)
    return value if parsed.scheme == "https" and parsed.hostname in ALLOWED_DRIVE_HOSTS else None


def run_google_command(arguments: list[str]) -> object:
    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), *arguments],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
        check=False,
    )
    if result.returncode != 0:
        logger.error("Google Workspace command failed with code %s", result.returncode)
        if "NOT_AUTHENTICATED" in result.stderr or "Not authenticated" in result.stderr:
            raise HTTPException(status_code=503, detail="Google Workspace authorization is required.")
        raise HTTPException(status_code=502, detail="Google Drive rejected the request.")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=502, detail="Unexpected Google Drive response.") from error


def drive_query_literal(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def find_or_create_folder(name: str, parent_id: str | None) -> str:
    clauses = [
        f"name = '{drive_query_literal(name)}'",
        f"mimeType = '{GOOGLE_FOLDER_MIME}'",
        "trashed = false",
    ]
    if parent_id:
        clauses.append(f"'{drive_query_literal(parent_id)}' in parents")
    found = run_google_command(["drive", "search", " and ".join(clauses), "--raw-query", "--max", "10"])
    if isinstance(found, list):
        exact = next(
            (
                item for item in found
                if isinstance(item, dict)
                and item.get("name") == name
                and item.get("mimeType") == GOOGLE_FOLDER_MIME
                and isinstance(item.get("id"), str)
            ),
            None,
        )
        if exact:
            return exact["id"]

    command = ["drive", "create-folder", name]
    if parent_id:
        command.extend(["--parent", parent_id])
    created = run_google_command(command)
    if not isinstance(created, dict) or not isinstance(created.get("id"), str):
        raise HTTPException(status_code=502, detail="Google Drive did not return a folder id.")
    return created["id"]


def resolve_month_folder() -> str:
    root_id = DRIVE_ROOT_FOLDER_ID or find_or_create_folder(DRIVE_ROOT_FOLDER_NAME, None)
    month_name = datetime.now(ZoneInfo(BUSINESS_TIMEZONE)).strftime("%Y-%m")
    return find_or_create_folder(month_name, root_id)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/drive/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder_id: str | None = Form(None),
    authorization: str | None = Header(None),
) -> dict[str, str | None]:
    authorize(authorization)
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Only PDF files are accepted.")
    if folder_id and not FOLDER_ID_PATTERN.fullmatch(folder_id):
        raise HTTPException(status_code=422, detail="Invalid Drive folder id.")
    if not SCRIPT_PATH.is_file():
        raise HTTPException(status_code=503, detail="Google Workspace client is unavailable.")

    filename = safe_filename(file.filename)
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the upload limit.")
    if not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="The uploaded file is not a PDF.")

    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(prefix="km_", suffix=".pdf", delete=False) as temporary:
            temporary.write(content)
            temporary_path = Path(temporary.name)

        target_folder_id = folder_id
        if not target_folder_id:
            async with folder_lock:
                target_folder_id = await asyncio.to_thread(resolve_month_folder)

        command = [
            "drive",
            "upload",
            str(temporary_path),
            "--name",
            filename,
            "--mime-type",
            "application/pdf",
        ]
        if target_folder_id:
            command.extend(["--parent", target_folder_id])

        response = await asyncio.to_thread(run_google_command, command)
        if not isinstance(response, dict):
            raise HTTPException(status_code=502, detail="Unexpected Google Drive response.")

        return {
            "status": "uploaded",
            "id": response.get("id"),
            "name": response.get("name", filename),
            "webViewLink": safe_drive_url(response.get("webViewLink")),
            "folderId": target_folder_id,
        }
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="Google Drive upload timed out.") from error
    finally:
        if temporary_path:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))
