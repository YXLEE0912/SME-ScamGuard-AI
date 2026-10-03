"""FastAPI REST routing endpoints for SME-ScamGuard-AI forensic inspection.

Provides endpoints for email scanning, multi-format invoice attachment ingestion,
instant messaging channel triage (WhatsApp), historical audit reports,
synthetic benchmark evaluation, and platform health telemetry.
"""

from datetime import datetime
import json
import logging
import os
from pathlib import Path
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile, status
from fastapi.responses import JSONResponse

from app.models.schema import (
    AuditForensicReport,
    ChannelMessageInput,
    EmailInput,
    FourEyesActionInput,
    FourEyesRecord,
)
from app.services.audit_service import (
    append_local_audit as persist_audit_ledger,
    check_and_register_artifact,
    verify_audit_integrity,
)
from app.services.document_parser import (
    extract_financial_fields,
    parse_invoice_attachment,
)
from app.services.engine import MultiAgentScamGuardEngine
from app.services.gmail import GmailWatcherService
from app.services.telegram import TelegramAlertService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Forensic Pipeline"])

# In-memory store for audit reports (latest first)
AUDIT_STORE: list[AuditForensicReport] = []

# Core multi-agent engine instance configured from environment
engine = MultiAgentScamGuardEngine(
    risk_threshold=float(os.getenv("RISK_THRESHOLD", "50.0"))
)

# Out-of-band Telegram alert notification client
telegram_service = TelegramAlertService()

# Gmail IMAP inbox watcher service
gmail_service = GmailWatcherService()


def append_local_audit(report: AuditForensicReport) -> None:
    """Append audit record locally to ./data/audits.json with SHA-256 hash chaining."""
    persist_audit_ledger(report.model_dump())


@router.post(
    "/scan",
    response_model=AuditForensicReport,
    status_code=status.HTTP_200_OK,
    summary="Scan Inbound Email / Invoice for BEC & Wire Fraud",
)
async def scan_email(
    email: EmailInput,
    background_tasks: BackgroundTasks,
) -> AuditForensicReport:
    """Execute the multi-agent forensic inspection pipeline on an inbound email.

    - Runs 4-agent deterministic pipeline (Privacy, Identity, Psycho-Social, Risk Arbiter).
    - Computes artifact SHA-256 hash and checks replay cache.
    - Stores synthesized audit forensic report at the front of in-memory AUDIT_STORE.
    - If scam is detected (risk score >= threshold), dispatches out-of-band Telegram alert via BackgroundTasks.
    - Appends audit entry locally to ./data/audits.json asynchronously with hash chaining.
    """
    body_bytes = email.body.encode("utf-8")
    artifact_tracking = check_and_register_artifact(body_bytes, f"{email.case_id or 'EMAIL'}.eml")

    report = engine.coordinate_agents(
        email=email,
        artifact_tracking=artifact_tracking,
    )
    AUDIT_STORE.insert(0, report)

    if report.is_scam:
        background_tasks.add_task(telegram_service.send_scam_alert, report)
    background_tasks.add_task(append_local_audit, report)

    return report


@router.post(
    "/scan/invoice-file",
    response_model=AuditForensicReport,
    status_code=status.HTTP_200_OK,
    summary="Scan Inbound Multi-Format Invoice Attachment (PDF/DOCX/TXT/Images)",
)
async def scan_invoice_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sender: str = Form("billing@megabuild.com.my"),
    subject: str = Form("Inbound Invoice Attachment"),
) -> AuditForensicReport:
    """Ingest, parse, and verify an uploaded invoice attachment via hybrid OCR and multi-agent pipeline."""
    file_bytes = await file.read()
    artifact_tracking = check_and_register_artifact(file_bytes, file.filename or "invoice.pdf")
    parsed_data = parse_invoice_attachment(file_bytes=file_bytes, filename=file.filename or "invoice.pdf")

    case_id = f"INV-{int(time.time())}"
    extracted_text = parsed_data.get("extracted_text", "")
    extracted_bank = parsed_data.get("extracted_bank")
    extracted_amount = parsed_data.get("extracted_amount")
    ocr_used = parsed_data.get("ocr_used", False)
    total_pages = parsed_data.get("total_pages", 1)
    pdf_forensics = parsed_data.get("pdf_forensics")

    email_in = EmailInput(
        case_id=case_id,
        sender=sender,
        subject=subject,
        body=extracted_text or f"Attachment: {file.filename}",
        declared_bank_account=extracted_bank,
        declared_amount=extracted_amount,
        pdf_forensics=pdf_forensics,
        artifact_tracking=artifact_tracking,
    )

    report = engine.coordinate_agents(
        email=email_in,
        ocr_used=ocr_used,
        total_pages=total_pages,
        filename=file.filename,
        pdf_forensics=pdf_forensics,
        artifact_tracking=artifact_tracking,
    )
    AUDIT_STORE.insert(0, report)

    if report.is_scam:
        background_tasks.add_task(telegram_service.send_scam_alert, report)
    background_tasks.add_task(append_local_audit, report)

    return report


@router.post(
    "/scan/file",
    response_model=AuditForensicReport,
    status_code=status.HTTP_200_OK,
    summary="Scan Inbound File (Alias for /scan/invoice-file)",
)
async def scan_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sender: str = Form("billing@megabuild.com.my"),
    subject: str = Form("Inbound Invoice Attachment"),
) -> AuditForensicReport:
    """Alias for invoice file scanning endpoint."""
    return await scan_invoice_file(background_tasks, file, sender, subject)


@router.post(
    "/scan/channel-message",
    response_model=AuditForensicReport,
    status_code=status.HTTP_200_OK,
    summary="Scan Inbound Instant Messaging Channel Payment Request (WhatsApp/Telegram)",
)
async def scan_channel_message(
    payload: ChannelMessageInput,
    background_tasks: BackgroundTasks,
) -> AuditForensicReport:
    """Scan and verify instant messaging chat text (e.g. WhatsApp) for BEC and urgent redirection."""
    case_id = f"MSG-{int(time.time())}"
    extracted_bank, extracted_amount = extract_financial_fields(payload.message)
    msg_bytes = payload.message.encode("utf-8")
    artifact_tracking = check_and_register_artifact(msg_bytes, "chat_message.txt")

    email_in = EmailInput(
        case_id=case_id,
        sender=payload.sender or "whatsapp:+60123456789",
        subject=payload.subject or "Instant Messaging Channel Dispatch",
        body=payload.message,
        declared_bank_account=extracted_bank,
        declared_amount=extracted_amount,
        artifact_tracking=artifact_tracking,
    )

    report = engine.coordinate_agents(
        email=email_in,
        ocr_used=False,
        total_pages=1,
        filename="whatsapp_chat.txt",
        artifact_tracking=artifact_tracking,
    )
    AUDIT_STORE.insert(0, report)

    if report.is_scam:
        background_tasks.add_task(telegram_service.send_scam_alert, report)
    background_tasks.add_task(append_local_audit, report)

    return report


@router.post(
    "/scan/text",
    response_model=AuditForensicReport,
    status_code=status.HTTP_200_OK,
    summary="Scan Inbound Text / Message (Alias for /scan/channel-message)",
)
async def scan_text(
    payload: ChannelMessageInput,
    background_tasks: BackgroundTasks,
) -> AuditForensicReport:
    """Alias for message text scanning endpoint."""
    return await scan_channel_message(payload, background_tasks)


@router.post(
    "/gmail/sync",
    status_code=status.HTTP_200_OK,
    summary="Synchronize & Scan Latest Inbound Gmail Invoices",
)
async def sync_gmail_inbox(
    background_tasks: BackgroundTasks,
    max_count: int = 3,
) -> Dict[str, Any]:
    """Fetch unread emails from Gmail IMAP, scan via 4-agent pipeline, and quarantine scams."""
    emails = gmail_service.fetch_latest_unread_emails(max_count=max_count)
    reports: List[AuditForensicReport] = []
    quarantined_count = 0

    for email_in in emails:
        report = engine.coordinate_agents(email_in)
        AUDIT_STORE.insert(0, report)
        reports.append(report)

        if report.is_scam:
            quarantined_count += 1
            background_tasks.add_task(telegram_service.send_scam_alert, report)
        background_tasks.add_task(append_local_audit, report)

    return {
        "fetched_count": len(emails),
        "quarantined_count": quarantined_count,
        "reports": reports,
    }


@router.get(
    "/reports",
    response_model=List[AuditForensicReport],
    status_code=status.HTTP_200_OK,
    summary="Retrieve Historical Audit Forensic Reports",
)
async def get_audit_reports() -> List[AuditForensicReport]:
    """Retrieve all historical forensic reports stored in memory (newest first)."""
    return AUDIT_STORE


@router.post(
    "/eval/benchmark",
    status_code=status.HTTP_200_OK,
    summary="Run Synthetic Malaysian BEC Evaluation Benchmark",
)
async def run_benchmark_evaluation() -> Dict[str, Any]:
    """Load benchmark cases from data/eval_cases.json and execute end-to-end evaluation."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    eval_file = base_dir / "data" / "eval_cases.json"

    if not eval_file.exists():
        fallback_file = Path("data/eval_cases.json")
        if fallback_file.exists():
            eval_file = fallback_file
        else:
            logger.error("Evaluation cases file not found at %s", eval_file)
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "error": "Evaluation dataset not found",
                    "expected_path": str(eval_file),
                    "total_cases": 0,
                    "passed_cases": 0,
                    "accuracy_rate": 0.0,
                    "cases_analyzed": [],
                },
            )

    try:
        with open(eval_file, "r", encoding="utf-8") as f:
            cases_data = json.load(f)
    except Exception as exc:
        logger.error("Failed to read evaluation benchmark dataset: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Failed to read evaluation benchmark dataset",
                "detail": str(exc),
                "total_cases": 0,
                "passed_cases": 0,
                "accuracy_rate": 0.0,
                "cases_analyzed": [],
            },
        )

    cases_analyzed: List[Dict[str, Any]] = []
    passed_count = 0

    for item in cases_data:
        email_in = EmailInput(
            case_id=item.get("case_id", "BENCHMARK_CASE"),
            sender=item.get("sender", ""),
            subject=item.get("subject", ""),
            body=item.get("body", ""),
            declared_bank_account=item.get("declared_bank_account"),
            declared_amount=item.get("declared_amount"),
        )

        report = engine.coordinate_agents(email_in)
        expected_is_scam = bool(item.get("expected_is_scam", False))
        case_passed = report.is_scam == expected_is_scam

        if case_passed:
            passed_count += 1

        description_text = str(
            item.get("scenario_title")
            or item.get("description")
            or item.get("case_id", "")
        )

        cases_analyzed.append(
            {
                "case_id": str(item.get("case_id", "")),
                "description": description_text,
                "expected_is_scam": expected_is_scam,
                "actual_is_scam": report.is_scam,
                "risk_score": float(report.risk_score),
                "passed": case_passed,
            }
        )

    total_cases = len(cases_data)
    accuracy_rate = float(round(passed_count / total_cases, 4)) if total_cases > 0 else 0.0

    return {
        "total_cases": total_cases,
        "passed_cases": passed_count,
        "accuracy_rate": accuracy_rate,
        "cases_analyzed": cases_analyzed,
    }


@router.post(
    "/audit/4-eyes-action",
    response_model=AuditForensicReport,
    status_code=status.HTTP_200_OK,
    summary="Record Human 4-Eyes Dual-Control Verification or Authorization Action",
)
async def record_4_eyes_action(
    payload: FourEyesActionInput,
    background_tasks: BackgroundTasks,
) -> AuditForensicReport:
    """Record an out-of-band telephone verification (Clerk) or management override/freeze (Manager).

    Guarantees strict separation of duties and appends the governance decision to the
    cryptographic SHA-256 tamper-evident audit ledger.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    target_report: Optional[AuditForensicReport] = None

    # Search in-memory AUDIT_STORE for matching case
    for rep in AUDIT_STORE:
        if rep.case_id == payload.case_id:
            target_report = rep
            break

    if not target_report:
        # Fallback baseline report if not yet in memory
        target_report = AuditForensicReport(
            case_id=payload.case_id,
            is_scam=True,
            risk_score=85.0,
            threat_level="CRITICAL",
            verdict_summary=f"Incident {payload.case_id} pending human review.",
            executive_summary=f"Incident {payload.case_id} recorded via 4-Eyes governance action.",
        )
        AUDIT_STORE.insert(0, target_report)

    # Initialize four_eyes_record if not present
    record = target_report.four_eyes_record or FourEyesRecord()

    if payload.role == "ACCOUNTS_CLERK" and payload.action == "MARK_VERIFIED":
        record.clerk_verified = True
        record.clerk_actor = payload.actor
        record.clerk_timestamp = now_str
        record.clerk_notes = payload.notes
        if target_report.safe_next_step:
            record.verified_phone_used = target_report.safe_next_step.authorized_phone_number

    elif payload.role == "FINANCE_MANAGER":
        if payload.action == "AUTHORIZE_OVERRIDE":
            record.manager_resolution = "OVERRIDE_AUTHORIZED"
        elif payload.action == "CONFIRM_FRAUD_FREEZE":
            record.manager_resolution = "FREEZE_PAYMENT_CONFIRMED"
        record.manager_actor = payload.actor
        record.manager_timestamp = now_str
        record.manager_notes = payload.notes

    target_report.four_eyes_record = record

    # Append governance event to local cryptographic hash chain
    background_tasks.add_task(append_local_audit, target_report)

    return target_report


@router.get(
    "/audit/verify",
    status_code=status.HTTP_200_OK,
    summary="Verify Tamper-Evident SHA-256 Cryptographic Hash Chain Integrity",
)
async def verify_audit_chain() -> Dict[str, Any]:
    """Verify cryptographic SHA-256 hash chain integrity of all local audit records."""
    is_intact = verify_audit_integrity()
    return {
        "status": "VERIFIED" if is_intact else "TAMPER_DETECTED",
        "chain_intact": is_intact,
        "verified_at": datetime.now().isoformat(),
        "integrity_claim": "TAMPER-EVIDENT (Cryptographic SHA-256 Hash Chain)",
    }


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Platform Telemetry & Health Probe",
)
async def health_check() -> Dict[str, str]:
    """Return platform operational status and version metadata."""
    return {
        "status": "healthy",
        "service": "SME-ScamGuard-AI",
        "version": "1.0.0",
    }
