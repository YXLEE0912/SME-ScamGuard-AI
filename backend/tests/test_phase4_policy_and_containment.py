"""
Phase 4: Policy Arbiter, Cryptographic Audit & Containment Verification Tests
==============================================================================
Validates:
1. Agent 5: Formal Mathematical Risk Scoring R & Finite State Machine.
   - VERIFIED: R < 50
   - NEEDS_REVIEW: 50 <= R < 80
   - LOCKED_CRITICAL: R >= 80, S_SemakMule = 99, or AI_COGNITIVE_UNAVAILABLE
2. Agent 6: Cryptographic Chained Audit Trail & Tamper-Evidence.
   - Recursive SHA-256 chain verification.
   - Tamper detection on modified historical blocks.
   - Anti-replay invoice registration.
3. Agent 6: Incident Response & Statutory Synthesis.
   - NSRC 997 police referral dossier.
   - ERP voucher payment hold request.
   - Out-of-band switchboard shield & 4-Eyes dual sign-off protocol.
"""

import copy
import hashlib
import json
import pytest

from backend.services.policy_arbiter import (
    calculate_mathematical_risk,
    arbitrate_invoice_policy,
)
from backend.services.audit_service import (
    GENESIS_HASH,
    SEEN_ARTIFACT_HASHES,
    record_audit_event,
    verify_audit_integrity,
    check_and_register_artifact,
    canonicalize_event,
    compute_chained_hash,
)
from backend.services.incident_response import (
    generate_callback_voucher,
    validate_dual_authorization,
    synthesize_nsrc_997_dossier,
    generate_vendor_dispute_draft,
    generate_erp_hold_payload,
)


# ==============================================================================
# 1. POLICY ARBITER & FORMAL RISK FORMULA
# ==============================================================================

def test_risk_formula_clean_invoice():
    # Zero anomalies -> R = 0 -> VERIFIED
    score = calculate_mathematical_risk(i_ledger=0, i_tool=0, i_urgency=0, i_auth=0, i_context=0, s_semakmule=0)
    assert score == 0

    payload = arbitrate_invoice_policy(case_id="CASE-01", i_ledger=0, i_tool=0, urgency_score=15.0)
    assert payload.risk_score == 0
    assert payload.disposition == "VERIFIED"


def test_risk_formula_needs_review_threshold():
    # Mild urgency (15) + Missing PO (25) + Temporal context (20) = 60 -> NEEDS_REVIEW
    score = calculate_mathematical_risk(i_ledger=0, i_tool=0, i_urgency=1, i_auth=1, i_context=1, s_semakmule=0)
    assert score == 60  # 15 + 25 + 20

    payload = arbitrate_invoice_policy(
        case_id="CASE-02",
        i_ledger=0,
        i_tool=0,
        urgency_score=75.0,  # >70 -> i_urgency=1 (15)
        i_auth=1,            # 25
        i_context=1,         # 20
    )
    assert payload.risk_score == 60
    assert payload.disposition == "NEEDS_REVIEW"


def test_risk_formula_ledger_mismatch_locked():
    # Ledger mismatch alone (w1=75) + tool anomaly (w2=20) = 95 -> LOCKED_CRITICAL
    payload = arbitrate_invoice_policy(case_id="CASE-03", i_ledger=1, i_tool=1, urgency_score=10.0)
    assert payload.risk_score == 95
    assert payload.disposition == "LOCKED_CRITICAL"


def test_risk_formula_semakmule_override():
    # SemakMule hit overrides bounded sum: max(99, sum) = 99 -> LOCKED_CRITICAL
    payload = arbitrate_invoice_policy(case_id="CASE-04", i_ledger=0, i_tool=0, urgency_score=10.0, s_semakmule=99)
    assert payload.risk_score == 99
    assert payload.disposition == "LOCKED_CRITICAL"
    assert "SEMAKMULE_BLACKLIST_HIT" in payload.evidence_cues


def test_fail_closed_cognitive_timeout_policy():
    # If AI Cognitive is unavailable, pipeline forces LOCKED_CRITICAL
    payload = arbitrate_invoice_policy(
        case_id="CASE-05",
        i_ledger=0,
        i_tool=0,
        urgency_score=0.0,
        cognitive_error="AI_COGNITIVE_UNAVAILABLE",
    )
    assert payload.disposition == "LOCKED_CRITICAL"
    assert payload.risk_score >= 85
    assert "AI_COGNITIVE_UNAVAILABLE" in payload.evidence_cues


# ==============================================================================
# 2. CRYPTOGRAPHIC CHAINED AUDIT TRAIL
# ==============================================================================

def test_audit_event_chaining_and_integrity():
    # Create an isolated chain in memory
    custom_chain = []
    prior = GENESIS_HASH

    for i in range(3):
        evt = {
            "event_id": f"EVT-{i:03d}",
            "timestamp_utc": f"2026-10-31T14:0{i}:00Z",
            "case_id": f"CASE-{i:03d}",
            "action": "PAYMENT_LOCKED",
            "disposition": "LOCKED_CRITICAL",
            "risk_score": 85,
            "operator_id": "POLICY_ARBITER",
            "evidence_hashes": ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
            "details": {"step": i},
            "prior_hash": prior,
        }
        canonical = canonicalize_event(evt)
        h = compute_chained_hash(canonical, prior)
        evt["event_hash"] = h
        custom_chain.append(evt)
        prior = h

    # 1. Unmodified chain must pass integrity check
    valid, msg = verify_audit_integrity(custom_chain)
    assert valid is True
    assert "intact" in msg.lower()

    # 2. Tampering with an earlier record must be detected
    tampered_chain = copy.deepcopy(custom_chain)
    tampered_chain[0]["risk_score"] = 10  # Adversarial alteration
    tampered_valid, tamper_msg = verify_audit_integrity(tampered_chain)
    assert tampered_valid is False
    assert "tamper detected" in tamper_msg.lower() or "broken link" in tamper_msg.lower()


def test_anti_replay_invoice_guard():
    SEEN_ARTIFACT_HASHES.clear()
    invoice_payload = b"%PDF-1.4 invoice payment for RM 50,000"

    # First ingestion -> not duplicate
    is_dup1, h1 = check_and_register_artifact(invoice_payload)
    assert is_dup1 is False

    # Second ingestion of identical byte stream -> duplicate detected
    is_dup2, h2 = check_and_register_artifact(invoice_payload)
    assert is_dup2 is True
    assert h1 == h2


# ==============================================================================
# 3. INCIDENT RESPONSE & 4-EYES GOVERNANCE
# ==============================================================================

def test_switchboard_shield_suppression():
    voucher = generate_callback_voucher(
        case_id="VCH-001",
        vendor_name="Mega Logistics Sdn Bhd",
        approved_landline="+60 3-7722 8888",
        untrusted_phone_detected="019-9988771",  # Fraudulent mobile printed on invoice
    )
    assert voucher["official_switchboard"] == "+60 3-7722 8888"
    assert voucher["suppressed_untrusted_contact"] == "019-9988771"
    assert voucher["callback_completed"] is False


def test_dual_authorization_segregation_of_duties():
    # 1. Manager attempts sign-off before clerk callback -> strictly blocked
    auth1, status1, detail1 = validate_dual_authorization(
        clerk_callback_logged=False,
        manager_override_token="CORP_SECRET_KEY_8899",
    )
    assert auth1 is False
    assert status1 == "BLOCKED_PENDING_CLERK_CALLBACK"
    assert "cannot be executed before" in detail1["error"]

    # 2. Clerk records telephone callback, then Manager applies token -> authorized
    auth2, status2, detail2 = validate_dual_authorization(
        clerk_callback_logged=True,
        manager_override_token="CORP_SECRET_KEY_8899",
        override_reason="Director Special Exemption",
    )
    assert auth2 is True
    assert status2 == "OVERRIDDEN_RELEASED"
    assert detail2["authorized"] is True


def test_nsrc_997_dossier_synthesis():
    dossier = synthesize_nsrc_997_dossier(
        case_id="INC-BEC-404",
        vendor_name="Alpha Tech Sdn Bhd",
        claimed_bank="Maybank",
        claimed_account="999888777666",
        amount_myr=38000.0,
        approved_bank="Maybank",
        approved_account="800122334455",
        evidence_hashes=["3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
        reconciliation_flags=["UNAUTHORIZED_BANK_CHANGE", "SEMAKMULE_BLACKLIST_HIT"],
    )
    assert "json_dossier" in dossier
    assert "markdown_dossier" in dossier

    json_doc = dossier["json_dossier"]
    assert json_doc["target_supplier"]["vendor_name"] == "Alpha Tech Sdn Bhd"
    assert json_doc["fraudulent_transaction_details"]["fraudulent_account_number"] == "999888777666"
    assert "Section 90A, Evidence Act 1950" in json_doc["forensic_evidence_manifest"]["statutory_certificate_section_90a"]


def test_erp_hold_payload():
    hold = generate_erp_hold_payload(case_id="INV-9921", amount_myr=45000.0, reason="SemakMule blacklist hit")
    assert hold["instruction_type"] == "ERP_PAYMENT_VOUCHER_FREEZE"
    assert hold["status"] == "PAYMENT_LOCKED"
    assert hold["held_amount_myr"] == 45000.0


def test_vendor_dispute_draft():
    draft = generate_vendor_dispute_draft(
        vendor_name="Mega Logistics Sdn Bhd",
        invoice_ref="INV-2026-8801",
        claimed_account="514012998877",
        approved_landline="+60 3-7722 8888",
    )
    assert "Dear Accounts Receivable Team (Mega Logistics Sdn Bhd)" in draft
    assert "+60 3-7722 8888" in draft
    assert "INV-2026-8801" in draft

