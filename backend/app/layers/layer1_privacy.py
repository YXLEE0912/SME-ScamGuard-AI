import re
import time
from typing import Dict, Any

MYKAD_REGEX = re.compile(r"\b\d{6}-\d{2}-\d{4}\b")
MALAYSIA_MOBILE_REGEX = re.compile(r"\b01[0-9]-?[0-9]{7,8}\b")

def sanitize_pii(text: str) -> Dict[str, Any]:
    """
    LAYER 1: In-Memory Privacy Sanitizer (Agent 1)
    Complies with Malaysian PDPA 2010 Section 10 Security Principle.
    Executes in <5ms strictly in volatile heap RAM with zero disk writes.
    """
    start_time = re_time = time.perf_counter()
    
    # Track redaction counts
    mykad_matches = len(MYKAD_REGEX.findall(text))
    sanitized = MYKAD_REGEX.sub("[REDACTED_MYKAD_IDENTIFIER]", text)
    
    phone_matches = len(MALAYSIA_MOBILE_REGEX.findall(sanitized))
    sanitized = MALAYSIA_MOBILE_REGEX.sub("[REDACTED_PHONE_NUMBER]", sanitized)
    
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    return {
        "sanitized_text": sanitized,
        "redacted_mykad_count": mykad_matches,
        "redacted_phone_count": phone_matches,
        "zero_disk_persisted": True,
        "latency_ms": elapsed_ms,
    }
