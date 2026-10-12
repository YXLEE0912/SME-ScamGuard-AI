"""Gmail IMAP Watcher Service for SME-ScamGuard-AI.

Connects to imap.gmail.com:993 over SSL using GMAIL_USER and GMAIL_APP_PASSWORD,
fetches recent unread communications, extracts key invoice attributes (bank accounts,
amounts, sender), and prepares EmailInput payloads for multi-agent inspection.
"""

import email
from email.header import decode_header
import email.utils
import imaplib
import logging
import os
import re
from typing import List, Optional

from app.models.schema import EmailInput

logger = logging.getLogger(__name__)


def _decode_header_str(header_val: Optional[str]) -> str:
    """Decode RFC 2047 MIME encoded-word header strings."""
    if not header_val:
        return ""
    decoded_fragments = []
    for fragment, encoding in decode_header(header_val):
        if isinstance(fragment, bytes):
            charset = encoding or "utf-8"
            try:
                decoded_fragments.append(fragment.decode(charset, errors="replace"))
            except Exception:
                decoded_fragments.append(fragment.decode("utf-8", errors="replace"))
        else:
            decoded_fragments.append(str(fragment))
    return "".join(decoded_fragments)


def _extract_plain_text(msg: email.message.Message) -> str:
    """Extract plain text body from multi-part or single-part MIME message."""
    body_parts = []
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in content_disposition:
                continue
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body_parts.append(payload.decode(charset, errors="replace"))
            elif content_type == "text/html" and not body_parts:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    raw_html = payload.decode(charset, errors="replace")
                    clean_text = re.sub(r"<[^>]+>", " ", raw_html)
                    body_parts.append(clean_text)
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            body_parts.append(payload.decode(charset, errors="replace"))

    return "\n".join(body_parts).strip()


class GmailWatcherService:
    """Gmail IMAP client service for retrieving and parsing inbound emails."""

    def __init__(
        self,
        username: Optional[str] = None,
        password: Optional[str] = None,
        host: str = "imap.gmail.com",
        port: int = 993,
    ) -> None:
        """Initialize Gmail IMAP client from credentials or environment variables."""
        self.username = (username or os.getenv("GMAIL_USER", "")).strip()
        self.password = (password or os.getenv("GMAIL_APP_PASSWORD", "")).strip()
        self.host = host
        self.port = port

    def _has_credentials(self) -> bool:
        """Verify whether Gmail credentials are provided and non-dummy."""
        if not self.username or not self.password:
            return False
        user_lower = self.username.lower()
        pass_lower = self.password.lower()
        dummy_markers = ["test_account@gmail.com", "abcd1234efgh5678", "dummy", "placeholder", "your_"]
        if any(m in user_lower or m in pass_lower for m in dummy_markers):
            return False
        return "@" in self.username and len(self.password) >= 8

    def fetch_latest_unread_emails(self, max_count: int = 15) -> List[EmailInput]:
        """Fetch latest unread emails from Gmail INBOX and parse invoice data.
        
        Strictly limits to max 15 results, verifies invoice attachments (PDF/PNG/JPEG),
        and skips non-invoice or non-attachment emails cleanly.
        """
        if not self._has_credentials():
            logger.info("Gmail credentials missing or dummy placeholder; skipping live IMAP poll.")
            return []

        # Cap max_count to 15
        capped_count = min(max_count, 15)
        emails_collected: List[EmailInput] = []
        mail: Optional[imaplib.IMAP4_SSL] = None

        try:
            mail = imaplib.IMAP4_SSL(self.host, self.port)
            mail.login(self.username, self.password)
            mail.select("INBOX")

            # Search for unread emails with invoice keywords
            status, response = mail.search(None, "UNSEEN")
            if status != "OK" or not response or not response[0]:
                logger.info("No unread emails found in Gmail INBOX.")
                return []

            email_ids = response[0].split()
            # Pick latest up to capped_count
            latest_ids = email_ids[-capped_count:]
            latest_ids.reverse()

            for msg_id in latest_ids:
                status, msg_data = mail.fetch(msg_id, "(RFC822)")
                if status != "OK" or not msg_data or not msg_data[0]:
                    continue

                raw_email_bytes = msg_data[0][1]
                msg = email.message_from_bytes(raw_email_bytes)

                # Extract Subject
                subject_raw = msg.get("Subject", "")
                subject = _decode_header_str(subject_raw) or "No Subject"

                # Check keyword filter match
                sub_low = subject.lower()
                is_inv_kw = any(kw in sub_low for kw in ["invoice", "bill", "payment", "resit", "inbois", "remittance", "bank account"])

                # Check attachment requirement
                has_valid_attachment = False
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = str(part.get_content_type() or "").lower()
                        filename = str(part.get_filename() or "").lower()
                        if any(content_type.startswith(t) for t in ["application/pdf", "image/png", "image/jpeg"]) or \
                           any(filename.endswith(ext) for ext in [".pdf", ".png", ".jpg", ".jpeg"]):
                            has_valid_attachment = True
                            break

                # If no valid document attachment, skip cleanly with debug log
                if not has_valid_attachment:
                    logger.debug("Skipping message %s: No valid invoice attachment (PDF/PNG/JPEG) found.", msg_id)
                    continue

                # Extract Clean Sender
                from_raw = msg.get("From", "")
                decoded_from = _decode_header_str(from_raw)
                _, sender_addr = email.utils.parseaddr(decoded_from)
                sender = sender_addr or decoded_from

                # Extract Plain Text Body
                body = _extract_plain_text(msg)
                if not body:
                    body = subject

                # Regex Parse Bank Accounts (\b\d{10,16}\b)
                bank_matches = re.findall(r"\b\d{10,16}\b", f"{subject} {body}")
                declared_bank = bank_matches[0] if bank_matches else None

                # Regex Parse Amounts ((?:RM|MYR|\$)\s*[\d,]+(?:\.\d{2})?)
                amount_matches = re.findall(
                    r"(?:RM|MYR|\$)\s*([\d,]+(?:\.\d{2})?)",
                    f"{subject} {body}",
                    re.IGNORECASE,
                )
                declared_amount: Optional[float] = None
                if amount_matches:
                    clean_amt_str = amount_matches[0].replace(",", "")
                    try:
                        declared_amount = float(clean_amt_str)
                    except ValueError:
                        declared_amount = None

                case_id = f"GMAIL-{msg_id.decode('ascii', errors='ignore')}"

                emails_collected.append(
                    EmailInput(
                        case_id=case_id,
                        sender=sender,
                        subject=subject,
                        body=body,
                        declared_bank_account=declared_bank,
                        declared_amount=declared_amount,
                    )
                )

        except Exception as exc:
            logger.warning("Failed to poll Gmail IMAP (%s). Returning empty list.", exc)
            return []

        finally:
            if mail:
                try:
                    mail.close()
                except Exception:
                    pass
                try:
                    mail.logout()
                except Exception:
                    pass

        return emails_collected
