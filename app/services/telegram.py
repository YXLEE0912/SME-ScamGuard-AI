"""Out-of-band asynchronous Telegram alert service for SME-ScamGuard-AI.

Dispatches instant security alerts and payment quarantine notifications
to corporate finance controllers when critical BEC or invoice fraud is detected.
"""

import logging
import os
from typing import Optional

import httpx

from app.models.schema import AuditForensicReport

logger = logging.getLogger(__name__)


class TelegramAlertService:
    """Asynchronous notification client for Agent 3 Out-of-Band alert channel."""

    def __init__(
        self,
        bot_token: Optional[str] = None,
        chat_id: Optional[str] = None,
    ) -> None:
        """Initialize the Telegram alert client from environment or explicit arguments.

        Args:
            bot_token: Optional Telegram Bot API token. Defaults to TELEGRAM_BOT_TOKEN env.
            chat_id: Optional Telegram target chat ID. Defaults to TELEGRAM_CHAT_ID env.
        """
        self.bot_token: str = (bot_token or os.getenv("TELEGRAM_BOT_TOKEN", "")).strip()
        self.chat_id: str = (chat_id or os.getenv("TELEGRAM_CHAT_ID", "")).strip()

    def _is_dummy_token(self) -> bool:
        """Check whether credentials are dummy, missing, or development placeholders.

        Returns:
            True if tokens are absent or represent dev placeholders, False otherwise.
        """
        if not self.bot_token or not self.chat_id:
            return True

        token_lower = self.bot_token.lower()
        chat_lower = self.chat_id.lower()

        dummy_indicators = [
            "dummy_token_for_dev",
            "dummy_chat_id",
            "dummy",
            "placeholder",
            "example",
            "none",
            "null",
        ]

        if any(ind in token_lower for ind in dummy_indicators):
            return True

        if any(ind in chat_lower for ind in dummy_indicators):
            return True

        if "your_" in token_lower or "your_" in chat_lower:
            return True

        return False

    async def send_scam_alert(self, report: AuditForensicReport) -> bool:
        """Send an out-of-band Markdown alert message to the configured Telegram channel.

        Args:
            report: The final synthesized forensic audit report triggering the alert.

        Returns:
            True if successfully dispatched (or gracefully handled in mock mode),
            False if an exception or HTTP error occurs.
        """
        if self._is_dummy_token():
            print(
                f"[TELEGRAM MOCK] Alert dispatched for Case {report.case_id} | "
                f"Score: {report.risk_score:.1f} | Level: {report.threat_level}"
            )
            logger.info(
                "[TELEGRAM MOCK] Alert dispatched for Case %s | Score: %.1f | Level: %s",
                report.case_id,
                report.risk_score,
                report.threat_level,
            )
            return True

        vendor_name = (
            (report.safe_next_step.target_vendor if report.safe_next_step else None)
            or (report.discrepancy_matrix.ledger_vendor_name if report.discrepancy_matrix else None)
            or "Unknown Counterparty"
        )
        inbound_acc = (
            report.discrepancy_matrix.invoice_bank_account
            if report.discrepancy_matrix
            else "Unverified Account"
        )
        ledger_acc = (
            report.discrepancy_matrix.ledger_bank_account
            if report.discrepancy_matrix and report.discrepancy_matrix.ledger_bank_account
            else "None Registered"
        )
        mule_status = (
            "Flagged Mule (PDRM SemakMule)"
            if (report.discrepancy_matrix and report.discrepancy_matrix.is_mule)
            else "Clean"
        )

        lines = [
            "🚨 *SME-ScamGuard Alert: BEC Wire Fraud Intercepted* (CRITICAL SCAM DETECTED)",
            f"*Case ID:* `{report.case_id}`",
            f"*Vendor:* `{vendor_name}`",
            f"*Risk Score:* `{int(report.risk_score)}/100` ({report.threat_level})",
            f"*Discrepancy:* Inbound [{inbound_acc}] does not match ledger [{ledger_acc}]",
            f"*SemakMule Status:* [{mule_status}]",
            "*Action:* Wire transfer frozen. Verification voucher issued.",
        ]

        if report.safe_next_step:
            lines.extend(
                [
                    f"*Target Vendor:* `{report.safe_next_step.target_vendor}`",
                    f"*Authorized Verification Call:* `{report.safe_next_step.authorized_phone_number}`",
                    f"*Protocol:* `{report.safe_next_step.protocol}`",
                ]
            )

        text_payload = "\n".join(lines)
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": text_payload,
            "parse_mode": "Markdown",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                if not response.is_success:
                    logger.error(
                        "Telegram API returned error status %d: %s",
                        response.status_code,
                        response.text,
                    )
                    return False
                return True
        except Exception as exc:
            logger.error("Failed to dispatch Telegram scam alert for case %s: %s", report.case_id, exc)
            print(f"[TELEGRAM ERROR] Failed to send alert for Case {report.case_id}: {exc}")
            return False
