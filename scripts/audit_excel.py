from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from posixpath import dirname, join, normpath
from typing import Any
from xml.etree import ElementTree as ET


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
VML_NS = "urn:schemas-microsoft-com:vml"
EXCEL_NS = "urn:schemas-microsoft-com:office:excel"
XDR_NS = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
NS = {
    "m": MAIN_NS,
    "r": REL_NS,
    "p": PKG_REL_NS,
    "xdr": XDR_NS,
    "a": DRAWING_NS,
}
CELL_REF_RE = re.compile(r"^([A-Z]+)(\d+)$")


def qname(namespace: str, local: str) -> str:
    return f"{{{namespace}}}{local}"


def read_xml(archive: zipfile.ZipFile, name: str) -> ET.Element:
    return ET.fromstring(archive.read(name))


def text_content(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return "".join(element.itertext())


def column_number(cell_ref: str) -> int:
    match = CELL_REF_RE.match(cell_ref)
    if not match:
        return 0
    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - 64
    return value


def row_number(cell_ref: str) -> int:
    match = CELL_REF_RE.match(cell_ref)
    return int(match.group(2)) if match else 0


@dataclass(frozen=True)
class CellStyle:
    locked: bool
    hidden: bool
    fill_id: int
    num_fmt_id: int


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = read_xml(archive, "xl/sharedStrings.xml")
    return [text_content(si) for si in root.findall("m:si", NS)]


def load_styles(archive: zipfile.ZipFile) -> list[CellStyle]:
    root = read_xml(archive, "xl/styles.xml")
    styles: list[CellStyle] = []
    cell_xfs = root.find("m:cellXfs", NS)
    if cell_xfs is None:
        return styles

    for xf in cell_xfs.findall("m:xf", NS):
        protection = xf.find("m:protection", NS)
        locked = True
        hidden = False
        if protection is not None:
            locked = protection.get("locked", "1") != "0"
            hidden = protection.get("hidden", "0") == "1"
        styles.append(
            CellStyle(
                locked=locked,
                hidden=hidden,
                fill_id=int(xf.get("fillId", "0")),
                num_fmt_id=int(xf.get("numFmtId", "0")),
            )
        )
    return styles


def load_sheet_map(archive: zipfile.ZipFile) -> list[dict[str, str]]:
    workbook = read_xml(archive, "xl/workbook.xml")
    relationships = read_xml(archive, "xl/_rels/workbook.xml.rels")
    targets = {
        rel.get("Id", ""): rel.get("Target", "")
        for rel in relationships.findall("p:Relationship", NS)
    }

    sheets: list[dict[str, str]] = []
    for sheet in workbook.findall("m:sheets/m:sheet", NS):
        rel_id = sheet.get(qname(REL_NS, "id"), "")
        target = targets.get(rel_id, "")
        if not target.startswith("/"):
            target = f"xl/{target.lstrip('/')}"
        else:
            target = target.lstrip("/")
        sheets.append(
            {
                "name": sheet.get("name", ""),
                "state": sheet.get("state", "visible"),
                "path": target,
            }
        )
    return sheets


def related_part(
    archive: zipfile.ZipFile,
    source_part: str,
    relationship_suffix: str,
) -> str | None:
    source = Path(source_part)
    rels_path = str(source.parent / "_rels" / f"{source.name}.rels").replace("\\", "/")
    if rels_path not in archive.namelist():
        return None
    relationships = read_xml(archive, rels_path)
    for relationship in relationships.findall("p:Relationship", NS):
        if relationship.get("Type", "").endswith(relationship_suffix):
            target = relationship.get("Target", "")
            return normpath(join(dirname(source_part), target))
    return None


def relationship_targets(
    archive: zipfile.ZipFile,
    source_part: str,
) -> dict[str, str]:
    source = Path(source_part)
    rels_path = str(source.parent / "_rels" / f"{source.name}.rels").replace("\\", "/")
    if rels_path not in archive.namelist():
        return {}
    relationships = read_xml(archive, rels_path)
    return {
        relationship.get("Id", ""): normpath(
            join(dirname(source_part), relationship.get("Target", ""))
        )
        for relationship in relationships.findall("p:Relationship", NS)
    }


def load_drawing_labels(
    archive: zipfile.ZipFile,
    sheet_part: str,
) -> dict[str, dict[str, Any]]:
    drawing_part = related_part(archive, sheet_part, "/drawing")
    if not drawing_part or drawing_part not in archive.namelist():
        return {}
    root = read_xml(archive, drawing_part)
    labels: dict[str, dict[str, Any]] = {}
    anchors = list(root.findall(".//xdr:twoCellAnchor", NS)) + list(
        root.findall(".//xdr:oneCellAnchor", NS)
    )
    for anchor in anchors:
        properties = anchor.find(".//xdr:cNvPr", NS)
        if properties is None:
            continue
        name = properties.get("name", "")
        text = " ".join(
            node.text.strip()
            for node in anchor.findall(".//a:t", NS)
            if node.text and node.text.strip()
        )
        start = anchor.find("xdr:from", NS)
        labels[name] = {
            "text": text,
            "anchor": {
                "column": int(text_content(start.find("xdr:col", NS)) or 0) + 1
                if start is not None
                else None,
                "row": int(text_content(start.find("xdr:row", NS)) or 0) + 1
                if start is not None
                else None,
            },
        }
    return labels


def load_form_controls(
    archive: zipfile.ZipFile,
    sheet_part: str,
) -> list[dict[str, Any]]:
    sheet_root = read_xml(archive, sheet_part)
    relationships = relationship_targets(archive, sheet_part)
    labels = load_drawing_labels(archive, sheet_part)
    controls: list[dict[str, Any]] = []
    for control in sheet_root.findall(".//m:control", NS):
        rel_id = control.get(qname(REL_NS, "id"), "")
        prop_part = relationships.get(rel_id)
        properties: dict[str, Any] = {}
        if prop_part and prop_part in archive.namelist():
            prop_root = read_xml(archive, prop_part)
            properties = dict(prop_root.attrib)
        name = control.get("name", "")
        label = labels.get(name, {})
        controls.append(
            {
                "id": control.get("shapeId"),
                "name": name,
                "type": properties.get("objectType"),
                "text": label.get("text", ""),
                "formulaLink": properties.get("fmlaLink"),
                "formulaRange": properties.get("fmlaRange"),
                "checked": properties.get("checked"),
                "selection": properties.get("sel"),
                "minimum": properties.get("min"),
                "maximum": properties.get("max"),
                "increment": properties.get("inc"),
                "anchor": label.get("anchor"),
                "visible": True,
            }
        )
    if controls:
        return controls

    vml_part = related_part(archive, sheet_part, "/vmlDrawing")
    if not vml_part or vml_part not in archive.namelist():
        return []

    raw_vml = archive.read(vml_part)
    try:
        root = ET.fromstring(raw_vml)
    except ET.ParseError:
        from lxml import etree

        root = etree.fromstring(raw_vml, parser=etree.XMLParser(recover=True))
    controls = []
    for shape in root.findall(qname(VML_NS, "shape")):
        client_data = shape.find(qname(EXCEL_NS, "ClientData"))
        if client_data is None:
            continue
        textbox = shape.find(qname(VML_NS, "textbox"))
        text = " ".join(text_content(textbox).split())
        anchor = text_content(client_data.find(qname(EXCEL_NS, "Anchor"))).strip()
        formula_link = text_content(client_data.find(qname(EXCEL_NS, "FmlaLink"))).strip()
        checked = text_content(client_data.find(qname(EXCEL_NS, "Checked"))).strip()
        controls.append(
            {
                "id": shape.get("id"),
                "type": client_data.get("ObjectType"),
                "text": text,
                "formulaLink": formula_link or None,
                "checked": int(checked) if checked.isdigit() else None,
                "anchor": anchor or None,
                "visible": "visibility:hidden" not in shape.get("style", ""),
            }
        )
    return controls


def decode_cell_value(
    cell: ET.Element,
    shared_strings: list[str],
) -> Any:
    cell_type = cell.get("t")
    value = cell.find("m:v", NS)
    inline = cell.find("m:is", NS)
    raw = value.text if value is not None else None

    if cell_type == "s" and raw is not None:
        index = int(raw)
        return shared_strings[index] if 0 <= index < len(shared_strings) else raw
    if cell_type == "inlineStr":
        return text_content(inline)
    if cell_type == "b" and raw is not None:
        return raw == "1"
    if cell_type in {"str", "e"}:
        return raw
    if raw is None:
        return None

    try:
        number = float(raw)
        return int(number) if number.is_integer() else number
    except ValueError:
        return raw


def nearby_labels(cells_by_position: dict[tuple[int, int], dict[str, Any]], ref: str) -> list[str]:
    row = row_number(ref)
    col = column_number(ref)
    labels: list[str] = []
    for delta_col in range(1, 6):
        candidate = cells_by_position.get((row, col - delta_col))
        if candidate and isinstance(candidate.get("value"), str):
            value = candidate["value"].strip()
            if value and value not in labels:
                labels.append(value)
    for delta_row in range(1, 4):
        candidate = cells_by_position.get((row - delta_row, col))
        if candidate and isinstance(candidate.get("value"), str):
            value = candidate["value"].strip()
            if value and value not in labels:
                labels.append(value)
    return labels[:4]


def audit_sheet(
    archive: zipfile.ZipFile,
    sheet_info: dict[str, str],
    shared_strings: list[str],
    styles: list[CellStyle],
) -> dict[str, Any]:
    root = read_xml(archive, sheet_info["path"])
    rows_hidden = {
        int(row.get("r", "0"))
        for row in root.findall("m:sheetData/m:row", NS)
        if row.get("hidden") == "1"
    }
    hidden_columns: list[dict[str, int]] = []
    for col in root.findall("m:cols/m:col", NS):
        if col.get("hidden") == "1":
            hidden_columns.append(
                {"min": int(col.get("min", "0")), "max": int(col.get("max", "0"))}
            )

    cells: list[dict[str, Any]] = []
    cells_by_position: dict[tuple[int, int], dict[str, Any]] = {}
    formula_count = 0
    error_cells: list[str] = []

    for cell in root.findall("m:sheetData/m:row/m:c", NS):
        ref = cell.get("r", "")
        style_id = int(cell.get("s", "0"))
        style = styles[style_id] if style_id < len(styles) else CellStyle(True, False, 0, 0)
        formula_node = cell.find("m:f", NS)
        formula = formula_node.text if formula_node is not None else None
        value = decode_cell_value(cell, shared_strings)
        if formula:
            formula_count += 1
        if cell.get("t") == "e":
            error_cells.append(ref)
        record = {
            "ref": ref,
            "row": row_number(ref),
            "column": column_number(ref),
            "value": value,
            "formula": formula,
            "styleId": style_id,
            "locked": style.locked,
            "formulaHidden": style.hidden,
            "fillId": style.fill_id,
            "numberFormatId": style.num_fmt_id,
            "rowHidden": row_number(ref) in rows_hidden,
        }
        cells.append(record)
        cells_by_position[(record["row"], record["column"])] = record

    validations: list[dict[str, Any]] = []
    for validation in root.findall("m:dataValidations/m:dataValidation", NS):
        validations.append(
            {
                "ranges": validation.get("sqref", "").split(),
                "type": validation.get("type"),
                "operator": validation.get("operator"),
                "allowBlank": validation.get("allowBlank") == "1",
                "showErrorMessage": validation.get("showErrorMessage") == "1",
                "errorTitle": validation.get("errorTitle"),
                "error": validation.get("error"),
                "formula1": text_content(validation.find("m:formula1", NS)),
                "formula2": text_content(validation.find("m:formula2", NS)),
            }
        )

    validation_refs = {
        ref
        for validation in validations
        for range_ref in validation["ranges"]
        for ref in [range_ref]
        if ":" not in ref
    }
    input_candidates: list[dict[str, Any]] = []
    for cell in cells:
        if cell["formula"]:
            continue
        if not cell["locked"] or cell["ref"] in validation_refs:
            input_candidates.append(
                {
                    **cell,
                    "labels": nearby_labels(cells_by_position, cell["ref"]),
                    "reason": "unlocked" if not cell["locked"] else "validation",
                }
            )

    merged_ranges = [
        merge.get("ref", "")
        for merge in root.findall("m:mergeCells/m:mergeCell", NS)
    ]
    dimension = root.find("m:dimension", NS)
    protection = root.find("m:sheetProtection", NS)
    form_controls = load_form_controls(archive, sheet_info["path"])

    return {
        **sheet_info,
        "dimension": dimension.get("ref") if dimension is not None else None,
        "sheetProtected": protection is not None,
        "cellCount": len(cells),
        "formulaCount": formula_count,
        "errorCells": error_cells,
        "hiddenRows": sorted(rows_hidden),
        "hiddenColumns": hidden_columns,
        "mergedRanges": merged_ranges,
        "validations": validations,
        "formControls": form_controls,
        "inputCandidates": input_candidates,
        "cells": cells,
    }


def make_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Аудит Excel-модели КМ R2.0.1",
        "",
        f"- Файл: `{report['source']}`",
        f"- SHA-256: `{report['sha256']}`",
        f"- Размер: {report['sizeBytes']} байт",
        f"- Листов: {len(report['sheets'])}",
        "",
        "## Листы",
        "",
        "| Лист | Диапазон | Ячеек | Формул | Кандидатов входа | Проверок данных |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
    ]
    for sheet in report["sheets"]:
        lines.append(
            f"| {sheet['name']} | {sheet['dimension']} | {sheet['cellCount']} | "
            f"{sheet['formulaCount']} | {len(sheet['inputCandidates'])} | "
            f"{len(sheet['validations'])} |"
        )

    for sheet in report["sheets"]:
        lines.extend(["", f"## {sheet['name']}", ""])
        if sheet["inputCandidates"]:
            lines.extend(
                [
                    "### Кандидаты пользовательских входов",
                    "",
                    "| Ячейка | Значение | Подписи рядом | Причина |",
                    "| --- | --- | --- | --- |",
                ]
            )
            for cell in sheet["inputCandidates"]:
                value = json.dumps(cell["value"], ensure_ascii=False)
                labels = " / ".join(cell["labels"]).replace("|", "\\|")
                lines.append(
                    f"| {cell['ref']} | `{value}` | {labels} | {cell['reason']} |"
                )
        else:
            lines.extend(["### Кандидаты пользовательских входов", "", "Не найдены."])

        if sheet["validations"]:
            lines.extend(
                [
                    "",
                    "### Проверки данных",
                    "",
                    "| Диапазон | Тип | Формула 1 | Формула 2 |",
                    "| --- | --- | --- | --- |",
                ]
            )
            for validation in sheet["validations"]:
                ranges = ", ".join(validation["ranges"])
                lines.append(
                    f"| {ranges} | {validation['type'] or ''} | "
                    f"`{validation['formula1']}` | `{validation['formula2']}` |"
                )

        if sheet["formControls"]:
            lines.extend(
                [
                    "",
                    "### Элементы формы",
                    "",
                    "| Тип | Текст | Связанная ячейка | Выбран | Якорь |",
                    "| --- | --- | --- | ---: | --- |",
                ]
            )
            for control in sheet["formControls"]:
                text = control["text"].replace("|", "\\|")
                lines.append(
                    f"| {control['type'] or ''} | {text} | "
                    f"`{control['formulaLink'] or ''}` | "
                    f"{'' if control['checked'] is None else control['checked']} | "
                    f"`{control['anchor'] or ''}` |"
                )

        lines.extend(
            [
                "",
                f"- Скрытые строки: {len(sheet['hiddenRows'])}",
                f"- Скрытые диапазоны столбцов: {len(sheet['hiddenColumns'])}",
                f"- Объединённые диапазоны: {len(sheet['mergedRanges'])}",
                f"- Кэшированные ошибки формул: {len(sheet['errorCells'])}",
            ]
        )

    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument(
        "--json-output",
        type=Path,
        default=Path("docs/excel-audit.json"),
    )
    parser.add_argument(
        "--markdown-output",
        type=Path,
        default=Path("docs/excel-model.md"),
    )
    args = parser.parse_args()

    source = args.source.resolve()
    data = source.read_bytes()
    with zipfile.ZipFile(source) as archive:
        shared_strings = load_shared_strings(archive)
        styles = load_styles(archive)
        sheets = [
            audit_sheet(archive, sheet, shared_strings, styles)
            for sheet in load_sheet_map(archive)
        ]

    report = {
        "source": str(source),
        "sizeBytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "sheets": sheets,
    }

    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    args.markdown_output.write_text(make_markdown(report), encoding="utf-8")
    print(
        json.dumps(
            {
                "source": report["source"],
                "sha256": report["sha256"],
                "sheets": [
                    {
                        "name": sheet["name"],
                        "dimension": sheet["dimension"],
                        "cells": sheet["cellCount"],
                        "formulas": sheet["formulaCount"],
                        "inputCandidates": len(sheet["inputCandidates"]),
                        "validations": len(sheet["validations"]),
                        "formControls": len(sheet["formControls"]),
                    }
                    for sheet in sheets
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
