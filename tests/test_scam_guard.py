"""Automated pytest test suite for SME-ScamGuard-AI multi-agent defense system.

Evaluates synthetic Malaysian BEC benchmark cases, PII sanitization masks,
and edge-case false positive boundaries.
"""

import json
from pathlib import Path
from typing import Any, Dict, List
import pytest

from app.models.schema import EmailInput
from app.services.engine import MultiAgentScamGuardEngine
from app.services.pii import sanitize_text_in_memory

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "eval_cases.json"


def load_eval_cases() -> List[Dict[str, Any]]:
    """Load evaluation benchmark cases from JSON dataset."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


EVAL_CASES = load_eval_cases()


@pytest.mark.parametrize("case", EVAL_CASES, ids=[c["case_id"] for c in EVAL_CASES])
def test_individual_eval_case(case: Dict[str, Any]) -> None:
    """Evaluate individual benchmark cases against multi-agent defense rules."""
    engine = MultiAgentScamGuardEngine(risk_threshold=50.0)
    email = EmailInput(
        case_id=case["case_id"],
        sender=case["sender"],
        subject=case["subject"],
        body=case["body"],
        declared_bank_account=case.get("declared_bank_account"),
        declared_amount=case.get("declared_amount"),
    )

    report = engine.run_pipeline(email)

    # 1. Assert scam verdict matches ground truth
    assert report.is_scam == case["expected_is_scam"], (
        f"Case {case['case_id']} expected is_scam={case['expected_is_scam']}, "
        f"got {report.is_scam} (score={report.risk_score})"
    )

    # 2. For scam cases: safe_next_step is generated and all expected_cues are present
    if case["expected_is_scam"]:
        assert report.safe_next_step is not None, (
            f"Case {case['case_id']} expected HumanCallbackVoucher, but got None"
        )
        for cue in case["expected_cues"]:
            assert cue in report.primary_cues, (
                f"Case {case['case_id']} expected cue '{cue}' in primary_cues {report.primary_cues}"
            )
        assert report.risk_score >= 50.0

    # 3. For legitimate cases: risk_score must remain below 50.0
    else:
        assert report.risk_score < 50.0, (
            f"Case {case['case_id']} is legitimate but risk_score={report.risk_score} >= 50.0"
        )
        assert report.safe_next_step is None


def test_eval_cases_terminal_summary() -> None:
    """Run all 8 evaluation cases and display a formatted terminal summary report."""
    engine = MultiAgentScamGuardEngine(risk_threshold=50.0)

    header = f"{'CASE ID':<29} | {'EXP SCAM':<8} | {'ACT SCAM':<8} | {'SCORE':<6} | {'STATUS':<6} | {'PRIMARY CUES'}"
    separator = "=" * 100
    sub_separator = "-" * 100

    print("\n" + separator)
    print(" SME-SCAMGUARD-AI : MULTI-AGENT EVALUATION BENCHMARK SUMMARY")
    print(separator)
    print(header)
    print(sub_separator)

    all_passed = True
    for case in EVAL_CASES:
        email = EmailInput(
            case_id=case["case_id"],
            sender=case["sender"],
            subject=case["subject"],
            body=case["body"],
            declared_bank_account=case.get("declared_bank_account"),
            declared_amount=case.get("declared_amount"),
        )
        report = engine.run_pipeline(email)

        is_scam_match = report.is_scam == case["expected_is_scam"]
        if case["expected_is_scam"]:
            cues_match = report.safe_next_step is not None and all(
                c in report.primary_cues for c in case["expected_cues"]
            )
        else:
            cues_match = report.risk_score < 50.0

        case_passed = is_scam_match and cues_match
        if not case_passed:
            all_passed = False

        status_str = "PASS" if case_passed else "FAIL"
        cues_str = ", ".join(report.primary_cues) if report.primary_cues else "None (Verified Safe)"

        row = (
            f"{case['case_id']:<29} | "
            f"{str(case['expected_is_scam']):<8} | "
            f"{str(report.is_scam):<8} | "
            f"{report.risk_score:<6.1f} | "
            f"{status_str:<6} | "
            f"{cues_str}"
        )
        print(row)

    print(separator)
    print(f"OVERALL RESULT: {'ALL 8 BENCHMARK CASES PASSED' if all_passed else 'SOME CASES FAILED'}")
    print(separator + "\n")

    assert all_passed, "One or more synthetic evaluation cases failed benchmark validation."


def test_pii_sanitization_rules() -> None:
    """Test zero-trust in-memory PII sanitization for MyKad, Phone, and Bank accounts."""
    raw_sample = (
        "Staff IC: 901231-14-5231, Mobile: +60-12-345-6789 or 011-2899-4411. "
        "Disburse salary to Maybank 5123-4567-8901."
    )

    sanitized, logs = sanitize_text_in_memory(raw_sample, field_name="body")

    # Assert masked replacements
    assert "901231-14-5231" not in sanitized
    assert "YYMMDD-**-****" in sanitized

    assert "+60-12-345-6789" not in sanitized
    assert "011-2899-4411" not in sanitized
    assert "XXX-***-****" in sanitized

    assert "5123-4567-8901" not in sanitized
    assert "XXXX-****-****" in sanitized

    # Assert audit log entries
    rules_triggered = {log.redaction_rule for log in logs}
    assert "MYKAD_STATUTORY_MASK" in rules_triggered
    assert "PDPA_PHONE_MASK" in rules_triggered
    assert "FINANCIAL_ACCOUNT_MASK" in rules_triggered


def test_edge_case_urgent_legitimate_vendor() -> None:
    """Assert edge case rule: High urgency with verified domain & account remains SAFE (< 50.0)."""
    engine = MultiAgentScamGuardEngine(risk_threshold=50.0)
    urgent_legit_email = EmailInput(
        case_id="TC_EDGE_UNIT_TEST",
        sender="billing@fastcargo.com.my",
        subject="URGENT: Port Demurrage Payment Needed Immediately Within 24 Hours",
        body="Immediate payment of RM 4,200.00 required to avoid 5:00 PM penalty. Account: Maybank 8001-2233-4455.",
        declared_bank_account="8001-2233-4455",
        declared_amount=4200.0,
    )

    report = engine.run_pipeline(urgent_legit_email)
    assert not report.is_scam, "Verified vendor invoice flagged as scam despite matching baseline"
    assert report.risk_score < 50.0, f"Expected risk score < 50.0, got {report.risk_score}"
    assert report.safe_next_step is None
