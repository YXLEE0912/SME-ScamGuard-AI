import time
import re
from typing import Dict, Any, Optional
from backend.app.config import APPROVED_VENDOR_LEDGER, KNOWN_SEMAKMULE_ACCOUNTS

def clean_account(acc: str) -> str:
    """Normalize account number by removing hyphens and whitespace."""
    if not acc:
        return ""
    return re.sub(r"[-\s]", "", str(acc)).strip()

def verify_vendor_remittance(
    vendor_name: str,
    claimed_account: str,
    claimed_bank: Optional[str] = None
) -> Dict[str, Any]:
    """
    LAYER 3: Ground-Truth Registry & Threat Cache (Agent 3)
    Verifies claimed remittance details against Master Procurement Ledger
    and PDRM CCID SemakMule cache (<2ms SLA).
    """
    start_time = time.perf_counter()
    normalized_claimed_acc = clean_account(claimed_account)
    
    # 1. PDRM CCID SemakMule Registry Lookup
    mule_hit = normalized_claimed_acc in KNOWN_SEMAKMULE_ACCOUNTS
    s_semakmule = 99 if mule_hit else 0
    
    # 2. Master Procurement Ledger Ground Truth Lookup
    ledger_entry = APPROVED_VENDOR_LEDGER.get(vendor_name)
    vendor_found = ledger_entry is not None
    
    if vendor_found:
        approved_acc = clean_account(ledger_entry["account"])
        approved_bank = ledger_entry.get("bank", "Maybank")
        verified_phone = ledger_entry.get("phone", "+60 3-7722 8888")
        
        if normalized_claimed_acc == approved_acc:
            ledger_match = True
            i_ledger = 0
            status = "VERIFIED_MATCH"
        else:
            ledger_match = False
            i_ledger = 1
            status = "BANK_MISMATCH"
    else:
        # Vendor not in approved master procurement ledger
        approved_acc = None
        approved_bank = None
        verified_phone = "+60 3-7722 8888"  # Corporate internal switchboard fallback
        ledger_match = False
        i_ledger = 1
        status = "UNKNOWN_VENDOR"
        
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    return {
        "vendor_found": vendor_found,
        "ledger_match": ledger_match,
        "i_ledger": i_ledger,
        "s_semakmule": s_semakmule,
        "mule_hit": mule_hit,
        "status": status,
        "verified_phone": verified_phone,
        "approved_bank": approved_bank,
        "approved_account": approved_acc,
        "latency_ms": elapsed_ms,
    }
