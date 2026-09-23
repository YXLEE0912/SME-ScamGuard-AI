"""FastAPI REST routing endpoints for SME-ScamGuard-AI forensic inspection.

Provides endpoints for email scanning, historical audit report retrieval,
synthetic benchmark evaluation, and platform health telemetry.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, status
from fastapi.responses import JSONResponse

from app.models.schema import AuditForensicReport, EmailInput
from app.services.engine import MultiAgentScamGuardEngine
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
    - Stores synthesized audit forensic report at the front of in-memory AUDIT_STORE.
    - If scam is detected (risk score >= threshold), dispatches out-of-band Telegram alert via BackgroundTasks.
    """
    report = engine.run_pipeline(email)
    AUDIT_STORE.insert(0, report)

    if report.is_scam:
        background_tasks.add_task(telegram_service.send_scam_alert, report)

    return report


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
    """Load benchmark cases from data/eval_cases.json and execute end-to-end evaluation.

    Returns structured evaluation performance metrics including total cases,
    passed cases, accuracy rate, and per-case forensic breakdowns.
    """
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

        report = engine.run_pipeline(email_in)
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
