import json
import logging
import os
import re
import secrets
import subprocess
import sys
import tempfile
from pathlib import Path

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

        command = [
            sys.executable,
            str(SCRIPT_PATH),
            "drive",
            "upload",
            "--path",
            str(temporary_path),
            "--name",
            filename,
        ]
        if folder_id:
            command.extend(["--parent", folder_id])

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
            check=False,
        )
        if result.returncode != 0:
            logger.error("Drive upload failed with code %s", result.returncode)
            if "NOT_AUTHENTICATED" in result.stderr or "Not authenticated" in result.stderr:
                raise HTTPException(status_code=503, detail="Google Workspace authorization is required.")
            raise HTTPException(status_code=502, detail="Google Drive rejected the upload.")

        try:
            response = json.loads(result.stdout)
        except json.JSONDecodeError as error:
            raise HTTPException(status_code=502, detail="Unexpected Google Drive response.") from error

        return {
            "status": "uploaded",
            "id": response.get("id"),
            "name": response.get("name", filename),
            "webViewLink": response.get("webViewLink"),
        }
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="Google Drive upload timed out.") from error
    finally:
        if temporary_path:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))
