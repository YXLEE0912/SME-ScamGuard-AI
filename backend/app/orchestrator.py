import time
import base64
import uuid
from typing import Dict, Any, Optional
from backend.app.layers.layer1_privacy import sanitize_pii
from backend.app.layers.layer2_forensics import inspect_pdf_bytes
from backend.app.layers.layer3_knowledge_base import verify_vendor_remittance
from backend.app.layers.layer4_cognitive import build_quarantined_prompt, analyze_behavior_with_gemini
from backend.app.layers.layer5_policy import evaluate_risk_policy
from backend.app.layers.layer6_governance import synthesize_statutory_artifacts

def run_scamguard_pipeline(
    payload: Dict[str, Any],
    raw_pdf_bytes: Optional[bytes] = None,
    mock_ai: bool = False,
    simulate_ai_error: bool = False,
) -> Dict[str, Any]:
    """
    End-to-End Orchestrator for the 7-Agent SME-ScamGuard-AI Architecture
    (Agents 1-6 AP Interdiction Pipeline + Agent 7 OSINT Threat Intel Ingestion).
    """
    start_total = time.perf_counter()
    
    case_id = payload.get("case_id") or f"INC-{uuid.uuid4().hex[:8].upper()}"
    vendor_name = payload.get("vendor_name", "Mega Logistics Sdn Bhd")
    claimed_account = str(payload.get("bank_account", "")).strip()
    claimed_bank = payload.get("bank_name", "Unknown Bank")
    amount_myr = float(payload.get("amount_myr", 0.0))
    body_text = payload.get("body", "")
    
    # -------------------------------------------------------------
    # LAYER 1: In-Memory Privacy Sanitizer (Agent 1, <5ms)
    # -------------------------------------------------------------
    l1_res = sanitize_pii(body_text)
    sanitized_body = l1_res["sanitized_text"]
    
    # -------------------------------------------------------------
    # LAYER 2: Deterministic Binary Forensics (Agent 2, <35ms)
    # -------------------------------------------------------------
    pdf_override = None
    if payload.get("producer_tool") or payload.get("pdf_producer_tool") or "timestamp_desync" in payload:
        pdf_override = {
            "producer": payload.get("pdf_producer_tool") or payload.get("producer_tool", "Unknown"),
            "timestamp_desync": payload.get("timestamp_desync", False),
        }
    
    # If raw_pdf_bytes is provided or passed as base64 in payload
    if not raw_pdf_bytes and payload.get("raw_pdf_bytes_b64"):
        try:
            raw_pdf_bytes = base64.b64decode(payload["raw_pdf_bytes_b64"])
        except Exception:
            raw_pdf_bytes = None
            
    # Default synthetic valid PDF header/trailer if no raw bytes provided
    if not raw_pdf_bytes:
        raw_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Producer (ERP Generator) >>\nendobj\n%%EOF"
        
    l2_res = inspect_pdf_bytes(raw_pdf_bytes, metadata_override=pdf_override)
    i_tamper = l2_res["i_tamper"]
    
    # -------------------------------------------------------------
    # LAYER 3: Ground-Truth Registry & Threat Cache (Agent 3, <2ms)
    # -------------------------------------------------------------
    l3_res = verify_vendor_remittance(vendor_name, claimed_account, claimed_bank)
    i_ledger = l3_res["i_ledger"]
    s_semakmule = l3_res["s_semakmule"]
    
    # -------------------------------------------------------------
    # BRIDGE: Compiled Forensic Digest & Prompt Injection Shield
    # -------------------------------------------------------------
    kb_digest = {
        "vendor": vendor_name,
        "ledger_status": l3_res["status"],
        "bank_mismatch": not l3_res["ledger_match"],
        "s_semakmule": s_semakmule,
        "binary_tamper": i_tamper == 1,
        "verified_phone": l3_res["verified_phone"],
        "approved_bank": l3_res["approved_bank"],
        "approved_account": l3_res["approved_account"],
    }
    
    quarantined_prompt = build_quarantined_prompt(kb_digest, sanitized_body)
    
    # -------------------------------------------------------------
    # LAYER 4: Cognitive Behavioral Investigator (Agent 4)
    # -------------------------------------------------------------
    ai_error_triggered = simulate_ai_error or bool(payload.get("simulate_ai_error", False))
    cognitive_res: Dict[str, Any] = {}
    
    if ai_error_triggered:
        cognitive_res = {
            "urgency_score": 0,
            "coercion_detected": False,
            "adversarial_injection_detected": False,
            "reasoning": "AI Cognitive API Timeout / Connection Drop. Layer 5B fail-closed engaged.",
            "ai_online": False,
            "fail_closed_engaged": True,
            "latency_ms": 0.0,
        }
    else:
        try:
            cognitive_res = analyze_behavior_with_gemini(
                quarantined_prompt,
                mock=mock_ai,
                simulate_error=False
            )
        except Exception:
            ai_error_triggered = True
            cognitive_res = {
                "urgency_score": 0,
                "coercion_detected": False,
                "adversarial_injection_detected": False,
                "reasoning": "AI Cognitive API Exception. Fail-closed safety net engaged.",
                "ai_online": False,
                "fail_closed_engaged": True,
                "latency_ms": 0.0,
            }
            
    # -------------------------------------------------------------
    # LAYER 5: Declarative Policy Arbiter & Fail-Closed Safety Net
    # -------------------------------------------------------------
    urgency_val = cognitive_res.get("urgency_score", 0)
    injection_val = cognitive_res.get("adversarial_injection_detected", False)
    
    l5_res = evaluate_risk_policy(
        i_ledger=i_ledger,
        i_tamper=i_tamper,
        urgency_score=urgency_val,
        s_semakmule=s_semakmule,
        ai_error=ai_error_triggered,
        adversarial_injection=injection_val,
    )
    
    # -------------------------------------------------------------
    # LAYER 6: Containment & Statutory Artifact Synthesis (Agent 6)
    # -------------------------------------------------------------
    case_summary = {
        "case_id": case_id,
        "vendor_name": vendor_name,
        "bank_name": claimed_bank,
        "bank_account": claimed_account,
        "amount_myr": amount_myr,
        "sender": payload.get("sender", "Unknown"),
        "subject": payload.get("subject", "Unknown"),
        "approved_bank": l3_res["approved_bank"],
        "approved_account": l3_res["approved_account"],
        "verified_phone": l3_res["verified_phone"],
        "s_semakmule": s_semakmule,
        "pdf_producer_tool": l2_res["producer_string"],
        "timestamp_desync": l2_res["timestamp_desync"],
        "risk_score": l5_res["risk_score"],
        "status": l5_res["status"],
    }
    
    statutory_artifacts = synthesize_statutory_artifacts(case_summary, raw_bytes=raw_pdf_bytes)
    
    total_elapsed_ms = (time.perf_counter() - start_total) * 1000.0
    
    # Side-by-side reconciliation matrix
    recon_matrix = {
        "vendor": {
            "inbound_claim": vendor_name,
            "master_ledger": vendor_name if l3_res["vendor_found"] else "Not Registered",
            "parity": "MATCH" if l3_res["vendor_found"] else "MISMATCH",
        },
        "bank": {
            "inbound_claim": claimed_bank,
            "master_ledger": l3_res["approved_bank"] or "N/A",
            "parity": "MATCH" if (l3_res["approved_bank"] == claimed_bank) else "MISMATCH",
        },
        "account": {
            "inbound_claim": claimed_account,
            "master_ledger": l3_res["approved_account"] or "N/A",
            "parity": "MATCH" if l3_res["ledger_match"] else "CRITICAL_MISMATCH",
            "semakmule_flag": "SEMAKMULE_HIT" if s_semakmule > 0 else "CLEAN",
        },
        "phone": {
            "inbound_claim": "[Redacted / Mobile Dial]",
            "master_ledger": l3_res["verified_phone"],
            "parity": "REJECTED_CALL_BACK",
        },
        "binary_metadata": {
            "inbound_claim": l2_res["producer_string"],
            "master_ledger": "Official ERP / SAP NetWeaver",
            "parity": "TAMPERED" if i_tamper == 1 else "CLEAN",
        },
    }
    
    return {
        "case_id": case_id,
        "status": l5_res["status"],
        "risk_score": l5_res["risk_score"],
        "voucher_id": f"VOUCHER-{case_id}",
        "voucher_status": "PAYMENT_LOCKED" if l5_res["status"] == "LOCKED_CRITICAL" else "SAFE_RELEASED",
        "reconciliation_matrix": recon_matrix,
        "forensic_digest": {
            "i_ledger": i_ledger,
            "i_tamper": i_tamper,
            "s_semakmule": s_semakmule,
            "review_codes": l5_res["review_codes"],
            "producer_tool": l2_res["producer_string"],
            "timestamp_desync": l2_res["timestamp_desync"],
            "cognitive_reasoning": cognitive_res.get("reasoning", ""),
            "adversarial_injection_detected": cognitive_res.get("adversarial_injection_detected", False),
        },
        "policy_evaluation": l5_res,
        "statutory_artifacts": statutory_artifacts,
        "execution_telemetry": {
            "layer1_privacy_ms": l1_res["latency_ms"],
            "layer2_forensics_ms": l2_res["latency_ms"],
            "layer3_knowledge_base_ms": l3_res["latency_ms"],
            "layer4_cognitive_ms": cognitive_res.get("latency_ms", 0.0),
            "total_pipeline_ms": total_elapsed_ms,
        },
    }
