import json
from pathlib import Path
from backend.app.orchestrator import run_scamguard_pipeline
from backend.app.layers.layer6_governance import validate_dual_authorization

def load_case(case_id: str):
    p = Path(__file__).resolve().parent.parent / "data" / "eval_cases.json"
    with open(p, "r", encoding="utf-8") as f:
        cases = json.load(f)
    for c in cases:
        if c["case_id"] == case_id:
            return c
    raise ValueError(f"Case {case_id} not found in eval_cases.json")

def test_pipeline_qat01_legitimate():
    case = load_case("QAT-01")
    result = run_scamguard_pipeline(case, mock_ai=True)
    
    assert result["status"] == "SAFE_VERIFIED"
    assert result["risk_score"] == 0
    assert result["voucher_status"] == "SAFE_RELEASED"
    assert result["reconciliation_matrix"]["account"]["parity"] == "MATCH"

def test_pipeline_qat02_bec_block():
    case = load_case("QAT-02")
    result = run_scamguard_pipeline(case, mock_ai=True)
    
    assert result["status"] == "LOCKED_CRITICAL"
    assert result["risk_score"] >= 80
    assert result["voucher_status"] == "PAYMENT_LOCKED"
    assert "MASTER_LEDGER_MISMATCH" in result["forensic_digest"]["review_codes"]

def test_pipeline_qat03_mule_hit():
    case = load_case("QAT-03")
    result = run_scamguard_pipeline(case, mock_ai=True)
    
    assert result["status"] == "LOCKED_CRITICAL"
    assert result["risk_score"] == 99
    assert result["forensic_digest"]["s_semakmule"] == 99
    assert "SEMAKMULE_HIT" in result["forensic_digest"]["review_codes"]

def test_pipeline_qat04_pdf_tamper():
    case = load_case("QAT-04")
    result = run_scamguard_pipeline(case, mock_ai=True)
    
    assert result["status"] == "LOCKED_CRITICAL"
    assert result["risk_score"] == 100
    assert result["forensic_digest"]["i_tamper"] == 1
    assert "PRODUCER_TOOL_TAMPER" in result["forensic_digest"]["review_codes"]

def test_pipeline_qat07_fail_closed_recovery():
    case = load_case("QAT-07")
    result = run_scamguard_pipeline(case, mock_ai=True, simulate_ai_error=True)
    
    assert result["status"] == "LOCKED_CRITICAL"
    assert result["risk_score"] >= 85
    assert result["policy_evaluation"]["fail_closed_reason"] is not None
    assert "AI_COGNITIVE_UNAVAILABLE" in result["forensic_digest"]["review_codes"]

def test_layer6_dual_authorization_enforcement():
    # Attempt override WITHOUT clerk callback
    denied = validate_dual_authorization(
        clerk_callback_logged=False,
        manager_override_token="MGR_SECURE_TOKEN_XYZ99"
    )
    assert denied["authorized"] is False
    assert denied["status"] == "BLOCKED_PENDING_CLERK_CALLBACK"
    
    # Authorized WITH clerk callback
    approved = validate_dual_authorization(
        clerk_callback_logged=True,
        manager_override_token="MGR_SECURE_TOKEN_XYZ99"
    )
    assert approved["authorized"] is True
    assert approved["status"] == "OVERRIDDEN_RELEASED"
