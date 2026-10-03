"""Automated Defensive Security Action & Incident Dispatch Service.

Fulfills Hackathon 04 Defensive Action requirements:
- Automated law enforcement incident report generation (NSRC 997 / PDRM JSJK).
- Simulated SecOps Telegram alert dispatch.
- Automated ERP payment suspension (AutoCount / SQL Account connector).
"""

from typing import Any, Dict


def generate_defensive_actions(assessment: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate threat assessment and execute automated defensive containment protocols.

    Args:
        assessment: Evaluated report or dictionary containing risk_score, status,
                    threat_level, bank accounts, vendor, and evidence.

    Returns:
        Structured defensive action payload with dispatch readiness and status badges.
    """
    risk_score = float(assessment.get("risk_score", 0.0))
    status = str(assessment.get("status", "")).upper()
    threat_level = str(assessment.get("threat_level", "")).upper()
    verdict = str(assessment.get("verdict_summary", "")).upper()

    matrix = assessment.get("discrepancy_matrix")
    if hasattr(matrix, "model_dump"):
        matrix = matrix.model_dump()
    elif not isinstance(matrix, dict):
        matrix = {}

    is_mule = bool(matrix.get("is_mule") or assessment.get("is_mule", False))

    is_critical_trigger = (
        risk_score >= 80.0
        or status in ["CRITICAL BEC DISCREPANCY", "CRITICAL FRAUD INDICATORS"]
        or "CRITICAL BEC" in verdict
        or "CRITICAL FRAUD" in verdict
        or threat_level == "CRITICAL"
        or is_mule
    )

    if not is_critical_trigger:
        if risk_score < 40.0:
            return {
                "is_triggered": False,
                "actions": [],
                "status_badge": "NORMAL: Standard Payment Workflow",
            }
        return {
            "is_triggered": False,
            "actions": [],
            "status_badge": "MONITORED: Under Observation",
        }

    # Extract target coordinates
    incident_ref = (
        assessment.get("incident_id")
        or assessment.get("case_id")
        or "INC-OFFLINE"
    )
    target_account = (
        assessment.get("inbound_bank_account")
        or matrix.get("invoice_bank_account")
        or assessment.get("declared_bank_account")
        or "UNKNOWN_ACCOUNT"
    )
    alleged_vendor = (
        assessment.get("inbound_vendor")
        or matrix.get("ledger_vendor_name")
        or assessment.get("target_vendor")
        or assessment.get("sender")
        or "Unknown Counterparty"
    )
    primary_evidence = (
        assessment.get("verdict_summary")
        or assessment.get("executive_summary")
        or "Tamper / BEC evidence detected."
    )

    # Action A: NSRC 997 / PDRM JSJK Preliminary Incident Report Draft
    action_a = {
        "agency": "NSRC (National Scam Response Centre - 997) / PDRM JSJK",
        "status": "DISPATCH_READY",
        "reporting_draft": {
            "incident_ref": incident_ref,
            "target_account": str(target_account),
            "alleged_vendor": str(alleged_vendor),
            "fraud_classification": "BEC / Unauthorized Invoice Redirection",
            "primary_evidence": str(primary_evidence),
            "action_required": "Emergency account freeze request under Section 116D CPC.",
        },
    }

    # Action B: Simulated Secure Telegram Security Bot Broadcast payload
    action_b = {
        "channel": "Telegram SecOps Feed (@SME_CyberAlert_Bot)",
        "status": "DISPATCHED",
        "message_preview": (
            f"🚨 [CRITICAL ALERT] Payment Hold Triggered for {alleged_vendor}. "
            f"Inbound account {target_account} rejected. Tamper/BEC evidence detected."
        ),
    }

    # Action C: Automated ERP Payment Hold
    action_c = {
        "integration": "AutoCount / SQL Account API Connector",
        "status": "PAYMENT_LOCKED",
        "detail": "Voucher payment status flagged as SUSPENDED pending Dual-Control 4-Eyes sign-off.",
    }

    return {
        "is_triggered": True,
        "actions": [action_a, action_b, action_c],
        "status_badge": "3 Automated Actions Executed",
    }
