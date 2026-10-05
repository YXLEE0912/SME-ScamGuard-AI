from typing import Dict, Any, List, Optional

def evaluate_risk_policy(
    i_ledger: int,
    i_tamper: int,
    urgency_score: int,
    s_semakmule: int,
    ai_error: bool = False,
    adversarial_injection: bool = False,
) -> Dict[str, Any]:
    """
    LAYER 5A & 5B: Declarative Policy Arbiter & Fail-Closed Safety Net (Agent 5)
    Evaluates pure deterministic risk formula:
    R = min(100, 80 * i_ledger + 20 * i_tamper + 15 * (1 if urgency_score > 60 else 0))
    If s_semakmule > 0: R = max(s_semakmule, R)
    """
    review_codes: List[str] = []
    
    if i_ledger == 1:
        review_codes.append("MASTER_LEDGER_MISMATCH")
    if i_tamper == 1:
        review_codes.append("PRODUCER_TOOL_TAMPER")
    if s_semakmule > 0:
        review_codes.append("SEMAKMULE_HIT")
    if urgency_score > 60:
        review_codes.append("COERCIVE_PRESSURE_DETECTED")
    if adversarial_injection:
        review_codes.append("ADVERSARIAL_PROMPT_INJECTION_DEFLECTED")
        
    # Layer 5B: Fail-Closed Safety Net Triggered
    if ai_error:
        review_codes.append("AI_COGNITIVE_UNAVAILABLE")
        deterministic_base = min(100, 80 * i_ledger + 20 * i_tamper)
        if s_semakmule > 0:
            deterministic_base = max(s_semakmule, deterministic_base)
        final_score = max(85, deterministic_base)
        return {
            "risk_score": final_score,
            "status": "LOCKED_CRITICAL",
            "i_ledger": i_ledger,
            "i_tamper": i_tamper,
            "s_semakmule": s_semakmule,
            "urgency_score": urgency_score,
            "review_codes": review_codes,
            "fail_closed_reason": "AI_COGNITIVE_TIMEOUT (Deterministic Tri-Factor Engaged)",
        }
        
    # Layer 5A: Standard Policy Evaluation Formula
    urgency_boost = 15 if urgency_score > 60 else 0
    calculated_r = min(100, 80 * i_ledger + 20 * i_tamper + urgency_boost)
    
    if s_semakmule > 0:
        calculated_r = max(s_semakmule, calculated_r)
        
    status = "LOCKED_CRITICAL" if calculated_r >= 80 else "SAFE_VERIFIED"
    if status == "SAFE_VERIFIED" and not review_codes:
        review_codes.append("ALL_CHECKS_PASSED")
        
    return {
        "risk_score": calculated_r,
        "status": status,
        "i_ledger": i_ledger,
        "i_tamper": i_tamper,
        "s_semakmule": s_semakmule,
        "urgency_score": urgency_score,
        "review_codes": review_codes,
        "fail_closed_reason": None,
    }
