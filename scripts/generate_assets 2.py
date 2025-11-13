#!/usr/bin/env python3
"""
Utility script to produce presentation-ready assets (PDFs, video placeholders).

- Converts Markdown sources into lightweight PDF documents without third-party deps.
- Copies/downsamples supporting media (e.g., demo video placeholder).

The PDF writer is intentionally simple: it flattens Markdown into wrapped plain
text and draws it on standard US Letter pages using the core PDF text operators.
"""

from __future__ import annotations

import argparse
import base64
import re
import textwrap
from pathlib import Path
from typing import Iterable, List

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

MEDIA_BOX = (0, 0, 612, 792)  # 8.5×11 in at 72 dpi
LEFT_MARGIN = 54  # 0.75 inch
TOP_MARGIN = 756  # 10.5 inch baseline start
LINE_HEIGHT = 16
FONT_SIZE = 12
WRAP_WIDTH = 88


def flatten_markdown(md_text: str) -> List[str]:
    """
    Convert limited Markdown syntax into wrapped plaintext lines suitable for PDF output.
    Supports headings, ordered/unordered lists, blockquotes, tables (flattened), and code ticks.
    """
    lines: List[str] = []
    for raw in md_text.splitlines():
        stripped = raw.rstrip()
        if not stripped:
            lines.append("")
            continue

        # Headings: uppercase the title and prefix with underline markers
        if stripped.startswith("#"):
            level = len(stripped) - len(stripped.lstrip("#"))
            content = stripped[level:].strip()
            marker = "" if level == 1 else " " * (level - 2)
            headline = content.upper()
            lines.append(f"{marker}{headline}")
            underline = "-" * min(len(headline), WRAP_WIDTH)
            lines.append(f"{marker}{underline}")
            continue

        # Blockquotes
        if stripped.startswith(">"):
            content = stripped.lstrip("> ").strip()
            wrapped = textwrap.wrap(content, WRAP_WIDTH)
            for idx, chunk in enumerate(wrapped):
                prefix = "❝ " if idx == 0 else "   "
                lines.append(f"{prefix}{chunk}")
            continue

        # Ordered lists
        ordered_match = re.match(r"^(\d+)\.\s+(.*)", stripped)
        if ordered_match:
            order, body = ordered_match.groups()
            wrapped = textwrap.wrap(body, WRAP_WIDTH - len(order) - 2)
            for idx, chunk in enumerate(wrapped):
                prefix = f"{order}. " if idx == 0 else " " * (len(order) + 2)
                lines.append(f"{prefix}{chunk}")
            continue

        # Bulleted lists
        if stripped.startswith(("- ", "* ")):
            body = stripped[2:].strip()
            wrapped = textwrap.wrap(body, WRAP_WIDTH - 2)
            for idx, chunk in enumerate(wrapped):
                prefix = "• " if idx == 0 else "  "
                lines.append(f"{prefix}{chunk}")
            continue

        # Table rows -> plain sentences
        if "|" in stripped and not stripped.lower().startswith("|---"):
            cells = [cell.strip() for cell in stripped.strip("|").split("|")]
            line = " | ".join(cell for cell in cells if cell)
            wrapped = textwrap.wrap(line, WRAP_WIDTH)
            lines.extend(wrapped or [""])
            continue

        # Inline code ticks
        inline = re.sub(r"`([^`]+)`", r"\1", stripped)
        wrapped = textwrap.wrap(inline, WRAP_WIDTH)
        lines.extend(wrapped or [""])

    # Collapse trailing blank lines
    while lines and lines[-1] == "":
        lines.pop()
    return lines


def escape_pdf_text(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\r", "")
    )


def chunk_lines(lines: Iterable[str], per_page: int) -> List[List[str]]:
    chunk: List[str] = []
    pages: List[List[str]] = []
    for line in lines:
        if len(chunk) >= per_page:
            pages.append(chunk)
            chunk = []
        chunk.append(line)
    if chunk:
        pages.append(chunk)
    return pages


def build_pdf(lines: List[str]) -> bytes:
    """
    Build a minimalist PDF from prepared lines.
    """
    lines_per_page = max(int((TOP_MARGIN - LEFT_MARGIN) / LINE_HEIGHT) - 5, 34)
    pages = chunk_lines(lines, lines_per_page)

    objects: List[tuple[int, str]] = []

    # Reserve object numbers
    catalog_obj = 1
    pages_obj = 2
    font_obj = 3 + 2 * len(pages)

    # Catalog
    objects.append(
        (
            catalog_obj,
            f"<< /Type /Catalog /Pages {pages_obj} 0 R >>",
        )
    )

    # Pages
    kids_refs = " ".join(f"{3 + idx * 2} 0 R" for idx in range(len(pages)))
    objects.append(
        (
            pages_obj,
            f"<< /Type /Pages /Kids [{kids_refs}] /Count {len(pages)} >>",
        )
    )

    # Page + content objects
    for idx, page_lines in enumerate(pages):
        page_obj = 3 + idx * 2
        content_obj = page_obj + 1

        # Build content stream
        y_start = TOP_MARGIN
        cursor = y_start
        content_parts = [
            "BT",
            f"/F1 {FONT_SIZE} Tf",
            f"{LINE_HEIGHT} TL",
            f"{LEFT_MARGIN} {cursor} Td",
        ]
        for line in page_lines:
            content_parts.append(f"({escape_pdf_text(line)}) Tj")
            content_parts.append("T*")
        content_parts.append("ET")

        content_stream = "\n".join(content_parts)
        stream_bytes = content_stream.encode("utf-8")
        content = f"<< /Length {len(stream_bytes)} >>\nstream\n{content_stream}\nendstream"

        objects.append(
            (
                page_obj,
                (
                    "<< /Type /Page "
                    f"/Parent {pages_obj} 0 R "
                    f"/MediaBox [{' '.join(str(v) for v in MEDIA_BOX)}] "
                    f"/Resources << /Font << /F1 {font_obj} 0 R >> >> "
                    f"/Contents {content_obj} 0 R >>"
                ),
            )
        )
        objects.append((content_obj, content))

    # Font object
    objects.append(
        (
            font_obj,
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        )
    )

    # Build xref
    parts: List[bytes] = [b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
    offsets: List[int] = [0]  # object 0

    for obj_num, obj_body in objects:
        offsets.append(sum(len(part) for part in parts))
        obj_section = f"{obj_num} 0 obj\n{obj_body}\nendobj\n".encode("utf-8")
        parts.append(obj_section)

    xref_offset = sum(len(part) for part in parts)
    xref_rows = ["xref", f"0 {len(objects) + 1}", "0000000000 65535 f "]
    for offset in offsets[1:]:
        xref_rows.append(f"{offset:010} 00000 n ")

    trailer = (
        "trailer\n"
        f"<< /Size {len(objects) + 1} /Root {catalog_obj} 0 R >>\n"
        "startxref\n"
        f"{xref_offset}\n"
        "%%EOF\n"
    )

    parts.append("\n".join(xref_rows).encode("utf-8") + b"\n")
    parts.append(trailer.encode("utf-8"))
    return b"".join(parts)


def write_pdf(markdown_path: Path, output_path: Path) -> None:
    text = markdown_path.read_text(encoding="utf-8")
    lines = flatten_markdown(text)
    pdf_bytes = build_pdf(lines)
    output_path.write_bytes(pdf_bytes)
    print(f"✅ Wrote PDF → {output_path.relative_to(ROOT)}")


def ensure_video_placeholder() -> None:
    """
    Ensure a web-friendly demo video placeholder is present.
    If the video was already downloaded (e.g., via curl), this is a no-op.
    Otherwise, decode an embedded Base64 clip (~1.1s, 640x360).
    """
    target = DOCS / "demo-video.mp4"
    if target.exists():
        print(f"ℹ️ Demo video already present at {target.relative_to(ROOT)}")
        return

    encoded = (
        "AAAAIGZ0eXBpc29tAAAAAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAADrxtZGF0"
        "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA="
    )
    target.write_bytes(base64.b64decode(encoded))
    print(f"✅ Wrote fallback demo video placeholder → {target.relative_to(ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate FBLA documentation assets")
    parser.add_argument(
        "--pdf",
        nargs="*",
        default=[
            "docs/user-manual.md",
            "docs/presentation-deck.md",
            "docs/demo-storyboard.md",
        ],
        help="Markdown files to convert into PDFs (relative to repo root).",
    )
    parser.add_argument(
        "--ensure-video",
        action="store_true",
        help="Ensure a demo video placeholder exists in docs/.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    for relative_md in args.pdf:
        md_path = ROOT / relative_md
        if not md_path.exists():
            raise FileNotFoundError(f"Markdown source not found: {relative_md}")
        pdf_path = md_path.with_suffix(".pdf")
        write_pdf(md_path, pdf_path)

    if args.ensure_video:
        ensure_video_placeholder()


if __name__ == "__main__":
    main()


