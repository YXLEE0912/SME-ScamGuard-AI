import base64
import logging
import os
import re
from typing import Dict, Any, List, Optional
try:
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
except ImportError:
    build = None
    Credentials = None

from backend.app.schemas.invoice import ExtractedInvoiceFields
from backend.app.services.document_extractor import document_extractor
from backend.services.reconciliation import reconcile_invoice

logger = logging.getLogger(__name__)

# Strict Gmail search query to eliminate irrelevant/personal communications
GMAIL_INVOICE_FILTER_QUERY = (
    'has:attachment (filename:pdf OR filename:png OR filename:jpg) '
    '(subject:invoice OR subject:bill OR subject:payment OR subject:resit OR '
    'subject:inbois OR "bank account" OR "remittance") '
    '-in:spam -in:trash'
)

SUPPORTED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
}


class GmailIngestionService:
    """Enterprise Gmail API Ingestion Service for SME-ScamGuard-AI."""

    def __init__(self, credentials: Optional[Credentials] = None):
        self.credentials = credentials
        self.service = None
        if self.credentials:
            try:
                self.service = build("gmail", "v1", credentials=self.credentials)
            except Exception as e:
                logger.error(f"Failed to initialize Gmail API client: {e}")

    @staticmethod
    def empty_response() -> Dict[str, Any]:
        """Return clean empty response contract."""
        return {"status": "success", "count": 0, "messages": []}

    def fetch_inbound_invoices(
        self,
        service: Optional[Any] = None,
        max_results: int = 15,
        user_id: str = "me",
    ) -> Dict[str, Any]:
        """Fetch inbound invoice emails strictly applying search query filtering

        and verifying attachments before downstream forensic pipeline processing.
        """
        active_service = service or self.service
        if not active_service:
            logger.info("No active Gmail API service client. Returning clean empty response.")
            return {"status": "success", "count": 0, "messages": []}

        # Cap maxResults to 15
        capped_limit = min(max_results, 15)

        try:
            # 1. Strict Query Filtering: q parameter + maxResults cap
            list_response = (
                active_service.users()
                .messages()
                .list(userId=user_id, q=GMAIL_INVOICE_FILTER_QUERY, maxResults=capped_limit)
                .execute()
            )
        except Exception as exc:
            logger.error(f"Gmail API users.messages.list failed: {exc}")
            return {
                "status": "error",
                "count": 0,
                "messages": [],
                "detail": str(exc),
            }

        messages_meta = list_response.get("messages", [])
        if not messages_meta:
            logger.info("Gmail query returned 0 matching invoice messages.")
            return {"status": "success", "count": 0, "messages": []}

        ingested_messages: List[Dict[str, Any]] = []

        for item in messages_meta:
            msg_id = item.get("id")
            try:
                msg_data = (
                    active_service.users()
                    .messages()
                    .get(userId=user_id, id=msg_id, format="full")
                    .execute()
                )
            except Exception as exc:
                logger.warning(f"Failed to fetch message {msg_id}: {exc}")
                continue

            payload = msg_data.get("payload", {})
            headers = payload.get("headers", [])

            # Header extraction
            subject = ""
            sender = ""
            date_str = ""
            for h in headers:
                name_lower = h.get("name", "").lower()
                if name_lower == "subject":
                    subject = h.get("value", "")
                elif name_lower == "from":
                    sender = h.get("value", "")
                elif name_lower == "date":
                    date_str = h.get("value", "")

            # Extract body text
            body_text = self._extract_body(payload)

            # MIME & Attachment Verification: Walk parts to find valid invoice files
            valid_attachment_found = False
            attachment_bytes: Optional[bytes] = None
            attachment_filename: Optional[str] = None
            attachment_mime: str = "application/pdf"

            parts = self._flatten_parts(payload)
            for part in parts:
                filename = part.get("filename", "")
                mime_type = part.get("mimeType", "").lower()
                body_info = part.get("body", {})

                # Check if supported invoice attachment
                is_supported_mime = mime_type in SUPPORTED_MIME_TYPES
                is_supported_ext = any(filename.lower().endswith(ext) for ext in [".pdf", ".png", ".jpg", ".jpeg"])

                if (is_supported_mime or is_supported_ext) and filename:
                    att_id = body_info.get("attachmentId")
                    if att_id:
                        try:
                            # Download attachment payload bytes in-memory
                            att_resp = (
                                active_service.users()
                                .messages()
                                .attachments()
                                .get(userId=user_id, messageId=msg_id, id=att_id)
                                .execute()
                            )
                            raw_data = att_resp.get("data", "")
                            attachment_bytes = base64.urlsafe_b64decode(raw_data.encode("UTF-8"))
                            valid_attachment_found = True
                            attachment_filename = filename
                            attachment_mime = mime_type if is_supported_mime else "application/pdf"
                            break
                        except Exception as e:
                            logger.debug(f"Could not retrieve attachment {att_id} in msg {msg_id}: {e}")
                    elif body_info.get("data"):
                        try:
                            attachment_bytes = base64.urlsafe_b64decode(body_info["data"].encode("UTF-8"))
                            valid_attachment_found = True
                            attachment_filename = filename
                            attachment_mime = mime_type if is_supported_mime else "application/pdf"
                            break
                        except Exception as e:
                            logger.debug(f"Failed decoding inline attachment: {e}")

            # 3. MIME Verification requirement:
            # If an email matches keyword query but has no valid document attachment,
            # skip it cleanly with a debug log rather than throwing an unhandled exception.
            if not valid_attachment_found or not attachment_bytes:
                logger.debug(f"Skipping msg {msg_id}: Matches search keyword query but lacks valid PDF/PNG/JPEG attachment.")
                continue

            # Stage 4: Run Multimodal Extraction
            extracted_fields: ExtractedInvoiceFields = document_extractor.extract_from_bytes(
                file_bytes=attachment_bytes,
                mime_type=attachment_mime,
            )

            # Downstream 3-Way Reconciliation
            email_meta = {
                "sender_email": sender,
                "email_body_bank_account": self._regex_extract_account(body_text),
                "subject": subject,
            }
            reconciled = reconcile_invoice(extracted_fields.model_dump(), email_meta)

            ingested_messages.append(
                {
                    "message_id": msg_id,
                    "subject": subject,
                    "sender": sender,
                    "date": date_str,
                    "attachment_filename": attachment_filename,
                    "extracted_fields": extracted_fields.model_dump(),
                    "reconciliation": reconciled,
                }
            )

        return {
            "status": "success",
            "count": len(ingested_messages),
            "messages": ingested_messages,
        }

    def _extract_body(self, payload: Dict[str, Any]) -> str:
        """Extract plain text message body."""
        body_parts = []
        parts = self._flatten_parts(payload)
        for part in parts:
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    try:
                        decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
                        body_parts.append(decoded)
                    except Exception:
                        pass
        if not body_parts:
            # Check root body
            data = payload.get("body", {}).get("data")
            if data:
                try:
                    return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
                except Exception:
                    pass
        return "\n".join(body_parts).strip()

    def _flatten_parts(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Flatten nested MIME multipart trees."""
        parts_list: List[Dict[str, Any]] = []
        if "parts" in payload:
            for p in payload["parts"]:
                parts_list.append(p)
                parts_list.extend(self._flatten_parts(p))
        return parts_list

    def _regex_extract_account(self, text: str) -> Optional[str]:
        """Extract bank account candidate from email body."""
        matches = re.findall(r"\b\d{10,16}\b", text)
        return matches[0] if matches else None


# Global singleton
gmail_ingestion = GmailIngestionService()
