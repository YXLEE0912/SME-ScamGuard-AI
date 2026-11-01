"""
Agent 5: Declarative Policy Arbiter & Fail-Closed Safety Net (Governance Layer)
================================================================================
Evaluates the totality of deterministic signals, cognitive scores, temporal markers,
and velocity metrics through an immutable mathematical risk formula, transitioning
the invoice through an explicit finite state machine.

Formal Risk Formula:
R = max(S_SemakMule, min(100, w1*I_Ledger + w2*I_Tool + w3*I_Urgency + w4*I_Auth + w5*I_Context))

Weight Configurations:
- w1 = 75 -> I_Ledger (Discrepancy between PDF claim and Master Ledger)
- w2 = 20 -> I_Tool (High-risk PDF editing tool or incremental splicing anomaly)
- w3 = 15 -> I_Urgency (Cognitive urgency score > 70)
- w4 = 25 -> I_Auth (Missing PO, missing GRN, or discrepancy in authorized PO prefix)
- w5 = 20 -> I_Context (Temporal anomaly, 7-day spend velocity breach, or vendor dormancy > 180 days)
- S_SemakMule = 99 -> Confirmed PDRM CCID commercial mule account match

Disposition Thresholds:
- VERIFIED (R < 50): Straight-through voucher preparation permitted.
- NEEDS_REVIEW (50 <= R < 80): Payment voucher paused; mandatory 4-Eyes dual sign-off required.
- LOCKED_CRITICAL (R >= 80 or Mandatory Failure / SemakMule / AI_COGNITIVE_UNAVAILABLE):
  Immediate payment freeze; voucher locked in ERP; incident response dossier synthesized.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from backend.models.schema import PipelineDispositionPayload

WEIGHT_W1_LEDGER: int = 75
WEIGHT_W2_TOOL: int = 20
WEIGHT_W3_URGENCY: int = 15
WEIGHT_W4_AUTH: int = 25
WEIGHT_W5_CONTEXT: int = 20
SCORE_SEMAKMULE_HIT: int = 99

THRESHOLD_VERIFIED_MAX: int = 50
THRESHOLD_LOCKED_MIN: int = 80


def calculate_mathematical_risk(
    i_ledger: int = 0,
    i_tool: int = 0,
    i_urgency: int = 0,
    i_auth: int = 0,
    i_context: int = 0,
    s_semakmule: int = 0,
) -> int:
    """
    Computes formal proposal risk score R:
    R = max(S_SemakMule, min(100, w1*I_Ledger + w2*I_Tool + w3*I_Urgency + w4*I_Auth + w5*I_Context))
    """
    weighted_sum = (
        WEIGHT_W1_LEDGER * i_ledger
        + WEIGHT_W2_TOOL * i_tool
        + WEIGHT_W3_URGENCY * i_urgency
        + WEIGHT_W4_AUTH * i_auth
        + WEIGHT_W5_CONTEXT * i_context
    )
    bounded_r = min(100, max(0, weighted_sum))
    return max(s_semakmule, bounded_r)


def arbitrate_invoice_policy(
    case_id: str,
    i_ledger: int,
    i_tool: int,
    urgency_score: float,
    i_auth: int = 0,
    i_context: int = 0,
    s_semakmule: int = 0,
    cognitive_error: Optional[str] = None,
    evidence_cues: Optional[List[str]] = None,
    callback_voucher: Optional[Dict[str, Any]] = None,
    audit_event_hash: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
) -> PipelineDispositionPayload:
    """
    Evaluates risk signals and transitions invoice through finite state machine.
    Returns typed PipelineDispositionPayload.
    """
    cues = list(evidence_cues or [])

    # Flag normalization
    i_urgency = 1 if urgency_score > 70.0 else 0
    if i_urgency and "COERCIVE_PRESSURE_DETECTED" not in cues:
        cues.append("COERCIVE_PRESSURE_DETECTED")

    if i_ledger and "UNAUTHORIZED_BANK_CHANGE" not in cues:
        cues.append("UNAUTHORIZED_BANK_CHANGE")

    if i_tool and "PDF_BINARY_ANOMALY" not in cues:
        cues.append("PDF_BINARY_ANOMALY")

    if s_semakmule > 0 and "SEMAKMULE_BLACKLIST_HIT" not in cues:
        cues.append("SEMAKMULE_BLACKLIST_HIT")

    if i_auth and "MISSING_OR_INVALID_PURCHASE_ORDER" not in cues:
        cues.append("MISSING_OR_INVALID_PURCHASE_ORDER")

    if i_context and "CONTEXT_VELOCITY_OR_DORMANCY_BREACH" not in cues:
        cues.append("CONTEXT_VELOCITY_OR_DORMANCY_BREACH")

    # Fail-Closed Cognitive Invariant:
    # If AI model timed out, failed validation, or dropped connection
    if cognitive_error == "AI_COGNITIVE_UNAVAILABLE":
        if "AI_COGNITIVE_UNAVAILABLE" not in cues:
            cues.append("AI_COGNITIVE_UNAVAILABLE")
        computed_r = max(85, calculate_mathematical_risk(
            i_ledger=i_ledger,
            i_tool=i_tool,
            i_urgency=1,
            i_auth=i_auth,
            i_context=i_context,
            s_semakmule=s_semakmule,
        ))
        disposition = "LOCKED_CRITICAL"
        return PipelineDispositionPayload(
            case_id=case_id,
            risk_score=computed_r,
            disposition=disposition,
            evidence_cues=cues,
            callback_voucher=callback_voucher,
            audit_event_hash=audit_event_hash,
            timestamp_utc=datetime.now(timezone.utc).isoformat(),
        )

    # Standard Mathematical Evaluation
    risk_score = calculate_mathematical_risk(
        i_ledger=i_ledger,
        i_tool=i_tool,
        i_urgency=i_urgency,
        i_auth=i_auth,
        i_context=i_context,
        s_semakmule=s_semakmule,
    )

    # State Machine Disposition Assignment
    if s_semakmule >= SCORE_SEMAKMULE_HIT or risk_score >= THRESHOLD_LOCKED_MIN or i_ledger == 1:
        disposition = "LOCKED_CRITICAL"
    elif risk_score >= THRESHOLD_VERIFIED_MAX:
        disposition = "NEEDS_REVIEW"
    else:
        disposition = "VERIFIED"

    if disposition == "VERIFIED" and not cues:
        cues.append("LEDGER_PARITY_VERIFIED")

    return PipelineDispositionPayload(
        case_id=case_id,
        risk_score=risk_score,
        disposition=disposition,
        evidence_cues=cues,
        callback_voucher=callback_voucher,
        audit_event_hash=audit_event_hash,
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
    )

