def evaluate_security_policy(
    ledger_match: bool,
    semakmule_hit: bool,
    pdf_tampered: bool,
    ai_online: bool = True
) -> dict:
    review_codes = []
    
    if not ledger_match:
        review_codes.append("MASTER_LEDGER_MISMATCH")
    if pdf_tampered:
        review_codes.append("PRODUCER_TOOL_TAMPER")
    if semakmule_hit:
        review_codes.append("SEMAKMULE_HIT")
        
    # Fail-Closed Recovery Path
    if not ai_online:
        review_codes.append("AI_COGNITIVE_UNAVAILABLE")
        return {
            "risk_score": 85,
            "status": "PENDING_MANUAL_REVIEW",
            "review_codes": review_codes,
            "fail_closed_reason": "AI_COGNITIVE_TIMEOUT (Deterministic Tri-Factor Engaged)"
        }
        
    # Standard Decision Matrix
    if semakmule_hit or (not ledger_match and pdf_tampered):
        return {
            "risk_score": 99,
            "status": "LOCKED_CRITICAL",
            "review_codes": review_codes,
            "fail_closed_reason": None
        }
    elif not ledger_match:
        return {
            "risk_score": 75,
            "status": "PENDING_MANUAL_REVIEW",
            "review_codes": review_codes,
            "fail_closed_reason": None
        }
    else:
        return {
            "risk_score": 0,
            "status": "VERIFIED",
            "review_codes": ["ALL_CHECKS_PASSED"],
            "fail_closed_reason": None
        }
