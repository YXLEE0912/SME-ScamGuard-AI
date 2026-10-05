import hashlib
from backend.app.layers.layer6_governance import synthesize_statutory_artifacts

def test_evidence_act_sha256_checksum():
    test_bytes = b"%PDF-1.4\nTest Inbound Invoice Content For Evidence Act Verification\n%%EOF"
    expected_hash = hashlib.sha256(test_bytes).hexdigest()
    
    case_summary = {
        "case_id": "TEST-EVIDENCE-01",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "bank_name": "CIMB Bank",
        "bank_account": "800944112299",
        "amount_myr": 98500.0,
        "s_semakmule": 0,
        "status": "LOCKED_CRITICAL",
    }
    
    artifacts = synthesize_statutory_artifacts(case_summary, raw_bytes=test_bytes)
    assert artifacts["evidence_sha256"] == expected_hash

def test_nsrc_997_dossier_content():
    case_summary = {
        "case_id": "INC-2026-NSRC-09",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "bank_name": "Public Bank",
        "bank_account": "1410029000123456",
        "amount_myr": 42000.0,
        "s_semakmule": 99,
        "pdf_producer_tool": "iLovePDF (Tampered)",
        "timestamp_desync": True,
        "status": "LOCKED_CRITICAL",
        "risk_score": 99,
    }
    
    artifacts = synthesize_statutory_artifacts(case_summary)
    dossier_md = artifacts["nsrc_997_markdown"]
    dossier_json = artifacts["nsrc_997_dossier"]
    
    # Assert statutory citations
    assert "AMLA 2001 - Section 44" in dossier_md
    assert "Section 420" in dossier_md
    assert "Evidence Act 1950" in dossier_md
    assert "PDPA Section 10" in dossier_md
    
    # Assert reporting entity SSM
    assert "SSM" in dossier_md
    assert dossier_json["reporting_entity"]["ssm"] is not None
    
    # Assert ground truth reconciliation
    assert "1410029000123456" in dossier_md
    assert dossier_json["claimed_account"] == "1410029000123456"
    assert dossier_json["semakmule_status"] == "CONFIRMED_COMMERCIAL_MULE"

def test_gmail_dispute_reply():
    case_summary = {
        "case_id": "DISPUTE-01",
        "subject": "Urgent Revision to Maybank Invoice",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "bank_name": "CIMB Bank",
        "bank_account": "800944112299",
        "amount_myr": 50000.0,
        "verified_phone": "+60 3-7722 8888",
    }
    artifacts = synthesize_statutory_artifacts(case_summary)
    reply = artifacts["gmail_dispute_reply"]
    
    assert "STATUTORY SECURITY HOLD" in reply
    assert "CIMB Bank" in reply
    assert "+60 3-7722 8888" in reply
    assert "4-Eyes dual sign-off" in reply
