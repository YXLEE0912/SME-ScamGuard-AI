import os
import tempfile
from backend.app.layers.layer1_privacy import sanitize_pii

def test_mykad_redaction():
    text = "The director's IC is 850412-14-5566 and finance manager IC is 920805-10-8899."
    result = sanitize_pii(text)
    
    assert result["redacted_mykad_count"] == 2
    assert "850412-14-5566" not in result["sanitized_text"]
    assert "920805-10-8899" not in result["sanitized_text"]
    assert "[REDACTED_MYKAD_IDENTIFIER]" in result["sanitized_text"]

def test_malaysian_mobile_redaction():
    text = "Please reach out to mobile 012-3456789 or backup line 0198765432 for remittance."
    result = sanitize_pii(text)
    
    assert result["redacted_phone_count"] == 2
    assert "012-3456789" not in result["sanitized_text"]
    assert "0198765432" not in result["sanitized_text"]
    assert "[REDACTED_PHONE_NUMBER]" in result["sanitized_text"]

def test_zero_disk_persistence():
    # Record directory state before sanitization
    temp_dir = tempfile.gettempdir()
    before_files = set(os.listdir(temp_dir))
    
    payload = "Strict confidential payment: MyKad 790101-01-1122, Mobile 017-2233445."
    result = sanitize_pii(payload)
    
    after_files = set(os.listdir(temp_dir))
    # Confirm no new files were created in temp
    new_files = after_files - before_files
    assert len(new_files) == 0, f"Unexpected files written to disk: {new_files}"
    assert result["zero_disk_persisted"] is True

def test_privacy_latency_sla():
    payload = "Director MyKad 900101-10-1234, call 012-9988776. Standard remittance invoice claim."
    result = sanitize_pii(payload)
    assert result["latency_ms"] < 10.0  # Well within the <5ms SLA
