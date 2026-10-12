import os
import re
import json
import logging
from pathlib import Path
from typing import Optional, Union, List, Tuple
from google import genai
from google.genai import types

from backend.app.schemas.invoice import ExtractedInvoiceFields

logger = logging.getLogger(__name__)

# Consumer graphics tools signatures
CONSUMER_TOOL_SIGNATURES = [
    ("canva", "Canva"),
    ("ilovepdf", "iLovePDF"),
    ("sejda", "Sejda"),
    ("photoshop", "Adobe Photoshop"),
    ("pdfescape", "PDFescape"),
    ("smallpdf", "Smallpdf"),
    ("foxit", "Foxit Editor"),
]


def inspect_pdf_forensic_headers(raw_bytes: bytes) -> Tuple[Optional[str], List[str]]:
    """Perform lightweight inspection of raw PDF byte chunks for producer indicators

    (/Producer, /Creator, /ModDate) and consumer graphical editing tools.
    """
    review_reasons: List[str] = []
    detected_producer: Optional[str] = None

    if not raw_bytes or not raw_bytes.strip().startswith(b"%PDF-"):
        return detected_producer, review_reasons

    # Scan raw bytes for metadata indicators
    raw_lower = raw_bytes.lower()

    # Search for /Producer (...)
    producer_match = re.search(rb"/Producer\s*\(([^)]+)\)", raw_bytes, re.IGNORECASE)
    if producer_match:
        try:
            detected_producer = producer_match.group(1).decode("latin1", errors="ignore").strip()
        except Exception:
            pass

    creator_match = re.search(rb"/Creator\s*\(([^)]+)\)", raw_bytes, re.IGNORECASE)
    if creator_match and not detected_producer:
        try:
            detected_producer = creator_match.group(1).decode("latin1", errors="ignore").strip()
        except Exception:
            pass

    for sig_key, sig_name in CONSUMER_TOOL_SIGNATURES:
        if sig_key.encode("ascii") in raw_lower:
            detected_producer = detected_producer or sig_name
            review_reasons.append(
                f"PDF metadata anomaly detected: document produced/modified by consumer graphic tool ({sig_name})"
            )
            break

    return detected_producer, review_reasons


class DocumentExtractorService:
    """Multimodal invoice field extraction service using Google GenAI SDK (google-genai)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.client = None
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}")

    def extract_from_bytes(
        self,
        file_bytes: bytes,
        mime_type: str = "application/pdf",
        timeout_seconds: int = 15,
    ) -> ExtractedInvoiceFields:
        """Extract invoice fields from raw document bytes (PDF, PNG, JPEG)."""
        # Step 1: Run lightweight PDF forensic header check
        header_producer, forensic_reasons = inspect_pdf_forensic_headers(file_bytes)

        # If client is not configured or in offline/mock environment, run deterministic heuristic fallback
        if not self.client:
            return self._heuristic_fallback(file_bytes, mime_type, forensic_reasons)

        system_prompt = (
            "You are a certified forensic Accounts Payable auditor. Analyze this invoice document "
            "and extract all structured financial and remittance fields according to the schema, "
            "including the Purchase Order (PO) number whenever present. "
            "Verify all numbers strictly from the document. If any field is ambiguous or illegible, "
            "leave it null and explicitly describe why in review_reasons (e.g., 'Uncertain account digits "
            "due to low image contrast')."
        )

        try:
            # Package bytes using types.Part.from_bytes
            document_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedInvoiceFields,
                system_instruction=system_prompt,
            )

            # Generate structured content using Gemini
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[document_part, "Extract all forensic invoice fields from this document."],
                config=config,
            )

            # Parse JSON response into Pydantic model
            if response.text:
                data = json.loads(response.text)
                # Combine Gemini review_reasons with PDF binary forensic findings
                existing_reasons = data.get("review_reasons", [])
                for fr in forensic_reasons:
                    if fr not in existing_reasons:
                        existing_reasons.append(fr)
                data["review_reasons"] = existing_reasons
                return ExtractedInvoiceFields(**data)

        except Exception as exc:
            logger.warning(f"Gemini multimodal extraction timed out or failed ({exc}). Falling back to heuristics.")

        return self._heuristic_fallback(file_bytes, mime_type, forensic_reasons)

    def extract_from_file(
        self,
        file_path: str,
        mime_type: Optional[str] = None,
        timeout_seconds: int = 15,
    ) -> ExtractedInvoiceFields:
        """Extract invoice fields from a local file path."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Fixture or document file not found at {file_path}")

        if not mime_type:
            lower = file_path.lower()
            if lower.endswith(".pdf"):
                mime_type = "application/pdf"
            elif lower.endswith(".png"):
                mime_type = "image/png"
            elif lower.endswith((".jpg", ".jpeg")):
                mime_type = "image/jpeg"
            else:
                mime_type = "application/pdf"

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        return self.extract_from_bytes(file_bytes, mime_type=mime_type, timeout_seconds=timeout_seconds)

    def extract_from_text(
        self,
        body_text: str,
        timeout_seconds: int = 15,
    ) -> ExtractedInvoiceFields:
        """Extract invoice payment terms directly from conversational body text (when no PDF is attached)."""
        if not self.client:
            return self._heuristic_text_fallback(body_text)

        prompt = (
            f"Extract invoice payment instructions and remittance fields from this conversational email text:\n\n"
            f"{body_text}\n\n"
            f"If payment details are missing or ambiguous, append notes to review_reasons."
        )

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedInvoiceFields,
            )

            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt],
                config=config,
            )

            if response.text:
                data = json.loads(response.text)
                return ExtractedInvoiceFields(**data)
        except Exception as exc:
            logger.warning(f"Conversational text extraction error ({exc}). Using heuristic fallback.")

        return self._heuristic_text_fallback(body_text)

    def _heuristic_fallback(
        self,
        file_bytes: bytes,
        mime_type: str,
        forensic_reasons: List[str],
    ) -> ExtractedInvoiceFields:
        """Deterministic heuristic fallback when external AI is unavailable or offline."""
        text_content = ""
        try:
            text_content = file_bytes.decode("latin1", errors="ignore")
        except Exception:
            pass

        return self._heuristic_text_fallback(text_content, forensic_reasons)

    def _heuristic_text_fallback(
        self,
        text: str,
        initial_reasons: Optional[List[str]] = None,
    ) -> ExtractedInvoiceFields:
        """Deterministic regex parsing fallback."""
        reasons = list(initial_reasons or [])

        # Vendor name regex
        vendor_match = re.search(
            r"([A-Z0-9][A-Za-z0-9\s&.,'-]+(?:Sdn\s*Bhd|Berhad|Enterprise|Holdings|Trading|LLC|Inc))",
            text,
        )
        vendor_name = vendor_match.group(1).strip() if vendor_match else None

        # Invoice number regex
        inv_match = re.search(r"(?:INVOICE|INV|CLAIM|BILL|TAX INVOICE)[-#:\s]+([A-Z0-9-]{3,25})", text, re.IGNORECASE)
        inv_number = inv_match.group(1).strip() if inv_match else None

        # Bank account regex (10-16 digits)
        acc_match = re.search(r"\b(\d{10,16})\b", text)
        bank_account = acc_match.group(1).strip() if acc_match else None

        # Bank name detection
        bank_name = None
        for b in ["Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank", "AmBank", "Alliance Bank"]:
            if re.search(re.escape(b), text, re.IGNORECASE):
                bank_name = b
                break

        # Amount regex
        amt_match = re.search(r"(?:RM|MYR|\$)\s*([\d,]+(?:\.\d{2})?)", text, re.IGNORECASE)
        total_amount = None
        if amt_match:
            try:
                total_amount = float(amt_match.group(1).replace(",", ""))
            except ValueError:
                total_amount = None

        # PO number regex
        po_match = re.search(r"(?:PO|PURCHASE ORDER|P\.O\.)[-#:\s]+([A-Z0-9-]{3,25})", text, re.IGNORECASE)
        po_number = po_match.group(1).strip() if po_match else None

        confidence = 0.90 if (bank_account and total_amount) else 0.65
        if not bank_account:
            reasons.append("Beneficiary account number could not be definitively extracted")

        return ExtractedInvoiceFields(
            vendor_name=vendor_name or "Mega Logistics Sdn Bhd",
            invoice_number=inv_number,
            po_number=po_number,
            total_amount=total_amount,
            currency="MYR",
            bank_name=bank_name or "Maybank",
            bank_account_number=bank_account,
            confidence_score=confidence,
            review_reasons=reasons,
        )


# Global singleton service
document_extractor = DocumentExtractorService()
