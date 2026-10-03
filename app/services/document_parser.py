"""Multi-Format Document Ingestion Service with Hybrid Vision OCR.

Supports:
- Local PDF text extraction via `pypdf` with fallback to native Google Gemini 2.5 Flash
  multimodal vision OCR for scanned/photocopied invoices (< 40 text characters).
- Microsoft Word (.docx) parsing across paragraphs and table cells via `python-docx`.
- Plaintext (.txt) decoding with UTF-8 / Latin-1 resilience.
- Image invoice formats (.png, .jpg, .jpeg) parsed via Gemini Vision.
- Deterministic extraction of financial identifiers (bank accounts, amounts).
"""

import io
import logging
import os
import re
from typing import Any, Dict, Optional

import pypdf
from docx import Document

logger = logging.getLogger(__name__)


def extract_financial_fields(text: str) -> tuple[Optional[str], Optional[float]]:
    """Deterministically extract bank account number and requested amount from text.

    Args:
        text: Ingested document or message content.

    Returns:
        Tuple of (extracted_bank, extracted_amount).
    """
    extracted_bank: Optional[str] = None
    extracted_amount: Optional[float] = None

    if not text:
        return None, None

    # 1. Bank Account Extraction (Target 9 to 16 digits, with or without hyphens)
    # Check for labeled account numbers first (e.g. Account: 9876-543-210)
    labeled_match = re.search(
        r"(?:account|acc(?:ount)?\.?|a\/c|no\.?|nombor|akaun)\s*[:#-]?\s*([0-9][0-9\-\s]{7,18}[0-9])",
        text,
        re.IGNORECASE,
    )
    if labeled_match:
        clean = re.sub(r"\D", "", labeled_match.group(1))
        if 8 <= len(clean) <= 18:
            extracted_bank = clean

    if not extracted_bank:
        # Search for standalone 9-16 digit numbers or hyphenated accounts
        digit_sequences = re.findall(r"\b(?:\d[\s\-]?){9,16}\b", text)
        for seq in digit_sequences:
            clean = re.sub(r"\D", "", seq)
            if 9 <= len(clean) <= 16:
                extracted_bank = clean
                break

    # 2. Currency Amount Extraction: Regex matching (?:RM|MYR|\$)\s*([\d,]+\.?\d{0,2})
    amt_match = re.search(r"(?:RM|MYR|\$)\s*([\d,]+\.?\d{0,2})", text, re.IGNORECASE)
    if amt_match:
        try:
            extracted_amount = float(amt_match.group(1).replace(",", "").strip())
        except (ValueError, TypeError):
            pass

    if extracted_amount is None:
        alt_match = re.search(
            r"(?:total|amount|due|remit|pay|subtotal)\s*[:=]?\s*(?:RM|MYR|\$)?\s*([\d,]+\.?\d{0,2})",
            text,
            re.IGNORECASE,
        )
        if alt_match:
            try:
                extracted_amount = float(alt_match.group(1).replace(",", "").strip())
            except (ValueError, TypeError):
                pass

    return extracted_bank, extracted_amount


def _ocr_scanned_bytes_with_gemini(file_bytes: bytes, mime_type: str = "application/pdf") -> str:
    """Fallback OCR using Google Gemini 2.5 Flash native multimodal vision."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or any(d in api_key.lower() for d in ["dummy", "placeholder", "test"]):
        logger.info("Gemini API key unavailable for OCR fallback. Proceeding with empty OCR text.")
        return ""

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        prompt = (
            "Extract all text, company names, bank accounts, and invoice amounts from this "
            "scanned document exactly as written."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[part, prompt],
        )
        return response.text or ""
    except Exception as exc:
        logger.warning("Gemini Vision OCR extraction failed (%s). Falling back gracefully.", exc)
        return ""


def parse_invoice_attachment(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse invoice attachment across PDF, DOCX, TXT, or images.

    Args:
        file_bytes: Raw binary content of the uploaded document.
        filename: Original filename with extension.

    Returns:
        Dictionary containing extracted text, pages, OCR status, and financial fields.
    """
    filename_lower = filename.lower()
    total_pages = 1
    ocr_used = False
    extracted_text = ""

    pdf_forensics = {
        "producer": "N/A",
        "creator": "N/A",
        "creation_date": "N/A",
        "mod_date": "N/A",
        "is_tampered": False,
        "evidence": "Non-PDF format; document metadata check bypassed.",
    }

    # PDF Ingestion
    if filename_lower.endswith(".pdf"):
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            total_pages = len(reader.pages)
            pages_text = []
            for page in reader.pages:
                text = page.extract_text() or ""
                pages_text.append(text)
            extracted_text = "\n".join(pages_text).strip()

            # PDF Document Metadata & Digital Forensics
            raw_meta = reader.metadata or {}

            def _get_meta_field(key: str) -> str:
                val = None
                if hasattr(raw_meta, "get"):
                    val = raw_meta.get(f"/{key}") or raw_meta.get(key)
                if not val and hasattr(raw_meta, key.lower()):
                    val = getattr(raw_meta, key.lower(), None)
                return str(val or "").strip()

            producer = _get_meta_field("Producer")
            creator = _get_meta_field("Creator")
            creation_date = _get_meta_field("CreationDate")
            mod_date = _get_meta_field("ModDate")

            FLAGGED_EDITORS = [
                "canva",
                "ilovepdf",
                "sejda",
                "photoshop",
                "acrobat",
                "nitro",
                "foxit",
                "smallpdf",
                "pdfescape",
            ]
            ERP_PRODUCERS = [
                "sap",
                "oracle",
                "netsuite",
                "quickbooks",
                "xero",
                "autocount",
                "sql account",
                "dynamics",
                "sage",
                "odoo",
                "microsoft reporting",
                "crystal reports",
                "reportlab",
            ]

            prod_lower = producer.lower()
            creator_lower = creator.lower()

            flagged_tool_detected = any(
                editor in prod_lower or editor in creator_lower for editor in FLAGGED_EDITORS
            )

            # Timestamp desync check:
            # Check if both creation_date and mod_date are present and their values differ (excluding trivial sub-second formatting)
            desynced_timestamps = False
            if creation_date and mod_date:
                # Normalize by extracting digit sequences (e.g. YYYYMMDDHHMMSS)
                c_digits = re.sub(r"\D", "", creation_date)
                m_digits = re.sub(r"\D", "", mod_date)
                if c_digits and m_digits:
                    # Compare up to the minute (12 digits) or seconds (14 digits)
                    c_core = c_digits[:12]
                    m_core = m_digits[:12]
                    if c_core != m_core:
                        desynced_timestamps = True
                elif creation_date != mod_date:
                    desynced_timestamps = True

            is_erp = any(erp in prod_lower for erp in ERP_PRODUCERS)

            if flagged_tool_detected or (desynced_timestamps and not is_erp):
                is_tampered = True
                evidence = f"Altered via consumer editing suite (Producer: {producer or 'Unknown'}, Creator: {creator or 'Unknown'})"
            else:
                is_tampered = False
                evidence = "Clean ERP/Accounting export signature (No post-issuance tampering detected)"

            pdf_forensics = {
                "producer": producer or "Unknown",
                "creator": creator or "Unknown",
                "creation_date": creation_date or "Unknown",
                "mod_date": mod_date or "Unknown",
                "is_tampered": is_tampered,
                "evidence": evidence,
            }
        except Exception as exc:
            logger.warning("Error reading PDF %s with pypdf: %s", filename, exc)
            extracted_text = ""
            pdf_forensics = {
                "producer": "Corrupted/Unreadable",
                "creator": "Corrupted/Unreadable",
                "creation_date": "N/A",
                "mod_date": "N/A",
                "is_tampered": True,
                "evidence": f"PDF metadata stream malformed or unreadable: {exc}",
            }

        # Check for scanned image / photocopy (< 40 non-whitespace characters)
        non_ws_count = len(re.sub(r"\s+", "", extracted_text))
        if non_ws_count < 40:
            gemini_ocr_text = _ocr_scanned_bytes_with_gemini(file_bytes, mime_type="application/pdf")
            if gemini_ocr_text:
                extracted_text = gemini_ocr_text.strip()
                ocr_used = True

    # Word Document (.docx) Ingestion
    elif filename_lower.endswith(".docx"):
        total_pages = 1
        ocr_used = False
        try:
            doc = Document(io.BytesIO(file_bytes))
            doc_lines = []
            # Extract paragraphs
            for p in doc.paragraphs:
                if p.text.strip():
                    doc_lines.append(p.text.strip())
            # Extract table cells
            for table in doc.tables:
                for row in table.rows:
                    row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_texts:
                        doc_lines.append(" | ".join(row_texts))
            extracted_text = "\n".join(doc_lines).strip()
        except Exception as exc:
            logger.warning("Error reading DOCX %s: %s", filename, exc)
            extracted_text = ""

    # Plain text (.txt) Ingestion
    elif filename_lower.endswith(".txt"):
        total_pages = 1
        ocr_used = False
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1", errors="ignore")
        extracted_text = extracted_text.strip()

    # Image files (.png, .jpg, .jpeg)
    elif any(filename_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg"]):
        total_pages = 1
        mime_type = "image/png" if filename_lower.endswith(".png") else "image/jpeg"
        gemini_ocr_text = _ocr_scanned_bytes_with_gemini(file_bytes, mime_type=mime_type)
        if gemini_ocr_text:
            extracted_text = gemini_ocr_text.strip()
            ocr_used = True

    else:
        # Fallback raw text attempt
        try:
            extracted_text = file_bytes.decode("utf-8")
        except Exception:
            extracted_text = file_bytes.decode("latin-1", errors="ignore")

    extracted_bank, extracted_amount = extract_financial_fields(extracted_text)

    return {
        "filename": filename,
        "total_pages": total_pages,
        "ocr_used": ocr_used,
        "extracted_text": extracted_text,
        "extracted_bank": extracted_bank,
        "extracted_amount": extracted_amount,
        "pdf_forensics": pdf_forensics,
    }
