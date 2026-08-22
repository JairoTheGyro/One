"""Optional LibreOffice-backed document conversion.

Renders Odysseus documents to real Office/PDF/OpenDocument files using a
headless LibreOffice (`soffice --headless --convert-to`) instead of the
lossy client-side JS exporters. Also used as a higher-fidelity fallback for
importing uploaded Office files (docx/pptx/xlsx/odt/legacy .doc/.ppt/.xls)
when markitdown is unavailable or fails.

Optional dependency: requires the `libreoffice` package on the host/image
(the bundled Docker image installs it). When the `soffice` binary is
missing, callers should degrade gracefully — same pattern as
`src/markitdown_runtime.py` and `src/pdf_runtime.py`.

Each conversion gets its own `-env:UserInstallation` profile directory.
Headless LibreOffice locks a single shared profile by default, so two
concurrent conversions against the same profile silently queue or fail —
a real risk here since document export is a per-request web action.
"""

import asyncio
import html as _html
import logging
import os
import shutil
import subprocess
import tempfile
import uuid

logger = logging.getLogger(__name__)

LIBREOFFICE_MISSING = (
    "Office document conversion requires LibreOffice. Install it on the "
    "host (e.g. `apt install libreoffice` / `brew install libreoffice`) or "
    "use the bundled Docker image, which includes it."
)

# Formats we ask LibreOffice's Writer filter to produce from HTML input.
EXPORT_FORMATS = {
    "docx": "docx:MS Word 2007 XML",
    "odt": "odt",
    "pdf": "pdf",
}

_CONVERT_TIMEOUT_SECONDS = 90


def find_soffice() -> str | None:
    """Locate the LibreOffice CLI binary, or None if not installed."""
    return shutil.which("soffice") or shutil.which("libreoffice")


def soffice_available() -> bool:
    return find_soffice() is not None


def _wrap_html(body_html: str, title: str) -> str:
    """Wrap a content fragment in a minimal HTML5 document.

    LibreOffice's HTML import filter needs an explicit UTF-8 charset meta
    tag, or non-ASCII text can come through mangled.
    """
    return (
        "<!DOCTYPE html><html><head>"
        '<meta charset="utf-8">'
        f"<title>{_html.escape(title)}</title>"
        "</head><body>" + body_html + "</body></html>"
    )


def _run_soffice(argv: list[str], timeout: int) -> subprocess.CompletedProcess:
    return subprocess.run(
        argv,
        capture_output=True,
        text=True,
        timeout=timeout,
    )


async def convert_html_to_office(html_body: str, title: str, fmt: str) -> bytes:
    """Convert an HTML fragment to `fmt` (docx/odt/pdf) via LibreOffice.

    Returns the converted file's bytes. Raises RuntimeError with a
    user-facing message on missing binary, timeout, or conversion failure.
    """
    soffice = find_soffice()
    if not soffice:
        raise RuntimeError(LIBREOFFICE_MISSING)
    filter_spec = EXPORT_FORMATS.get(fmt)
    if not filter_spec:
        raise RuntimeError(f"Unsupported export format: {fmt}")

    work_dir = tempfile.mkdtemp(prefix="odysseus-lo-")
    profile_dir = tempfile.mkdtemp(prefix="odysseus-lo-profile-")
    input_path = os.path.join(work_dir, "input.html")
    try:
        with open(input_path, "w", encoding="utf-8") as f:
            f.write(_wrap_html(html_body, title))

        argv = [
            soffice,
            "--headless",
            "--nologo",
            "--nofirststartwizard",
            "--norestore",
            f"-env:UserInstallation=file://{profile_dir}",
            "--convert-to",
            filter_spec,
            "--outdir",
            work_dir,
            input_path,
        ]

        def _run():
            return _run_soffice(argv, _CONVERT_TIMEOUT_SECONDS)

        try:
            result = await asyncio.to_thread(_run)
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("LibreOffice conversion timed out") from exc

        if result.returncode != 0:
            logger.error(
                "soffice convert-to %s failed (rc=%s): %s",
                fmt, result.returncode, (result.stderr or "").strip()[:2000],
            )
            raise RuntimeError(f"LibreOffice conversion failed: {result.stderr.strip()[:500]}")

        out_path = os.path.join(work_dir, f"input.{fmt}")
        if not os.path.isfile(out_path):
            raise RuntimeError("LibreOffice did not produce an output file")
        with open(out_path, "rb") as f:
            return f.read()
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
        shutil.rmtree(profile_dir, ignore_errors=True)


def convert_file_to_text_sync(input_path: str) -> str | None:
    """Best-effort text extraction for any format LibreOffice can open.

    Used as a fallback import path (legacy .doc/.ppt/.xls, .odt/.ods/.odp,
    and .pptx/.xlsx when markitdown is unavailable). Returns None rather
    than raising — callers already have their own fallback chain. Synchronous
    because the existing extraction pipeline (src/document_processor.py,
    src/personal_docs.py) is itself synchronous.
    """
    soffice = find_soffice()
    if not soffice:
        return None

    work_dir = tempfile.mkdtemp(prefix="odysseus-lo-")
    profile_dir = tempfile.mkdtemp(prefix="odysseus-lo-profile-")
    try:
        argv = [
            soffice,
            "--headless",
            "--nologo",
            "--nofirststartwizard",
            "--norestore",
            f"-env:UserInstallation=file://{profile_dir}",
            "--convert-to",
            "txt:Text",
            "--outdir",
            work_dir,
            input_path,
        ]

        try:
            result = _run_soffice(argv, _CONVERT_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            logger.warning("soffice text extraction timed out for %s", input_path)
            return None

        if result.returncode != 0:
            logger.warning(
                "soffice text extraction failed for %s: %s",
                input_path, (result.stderr or "").strip()[:500],
            )
            return None

        base = os.path.splitext(os.path.basename(input_path))[0]
        out_path = os.path.join(work_dir, f"{base}.txt")
        if not os.path.isfile(out_path):
            return None
        with open(out_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read().strip()
        return text or None
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
        shutil.rmtree(profile_dir, ignore_errors=True)


async def convert_file_to_text(input_path: str) -> str | None:
    """Async wrapper around `convert_file_to_text_sync` (runs off-thread)."""
    return await asyncio.to_thread(convert_file_to_text_sync, input_path)
