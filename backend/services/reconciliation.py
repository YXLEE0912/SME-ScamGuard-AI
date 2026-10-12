import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List, Set, Tuple

from backend.services.velocity_store import record_and_check_velocity, reset_velocity_store
from backend.services.ledger_sync import get_active_ledger, load_default_ledger_file

# Default local threat intelligence: CCID SemakMule confirmed mule accounts
KNOWN_SEMAKMULE_ACCOUNTS: Set[str] = {
    "111222333444",
    "888800001111",
    "999888777666",
    "1410029000123456",
    "800944112299",
    "214488990011",
    "319900228811",
}

_CACHED_SEMAKMULE: Optional[Set[str]] = None

def load_semakmule_cache() -> Set[str]:
    """Load blacklisted mule account numbers into memory cache once."""
    global _CACHED_SEMAKMULE
    if _CACHED_SEMAKMULE is not None:
        return _CACHED_SEMAKMULE

    accounts = set(KNOWN_SEMAKMULE_ACCOUNTS)
    possible_paths = [
        Path(__file__).resolve().parent.parent / "data" / "semakmule_cache.json",
        Path("backend/data/semakmule_cache.json"),
        Path("data/semakmule_cache.json"),
    ]
    for p in possible_paths:
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                for item in data.get("blacklisted_accounts", []):
                    acc = normalize_account_number(item.get("account_no", ""))
                    if acc:
                        accounts.add(acc)
                for item in data.get("records", []):
                    acc = normalize_account_number(item.get("account_no", ""))
                    if acc:
                        accounts.add(acc)
            except Exception:
                pass
            break
    _CACHED_SEMAKMULE = accounts
    return _CACHED_SEMAKMULE

# Consumer PDF editing tools to inspect
CONSUMER_TOOLS = ["canva", "ilovepdf", "sejda", "photoshop", "pdfescape", "smallpdf", "foxit"]


def normalize_account_number(acc: Any) -> str:
    """Normalize bank account by stripping non-numeric characters, hyphens, and whitespace."""
    if acc is None:
        return ""
    s = str(acc).split(".")[0].strip()
    return re.sub(r"[^0-9]", "", s)


def extract_email_domain(email_str: str) -> str:
    """Extract domain from an email address string (e.g. 'billing@megalogistics.com.my' -> 'megalogistics.com.my')."""
    if not email_str:
        return ""
    clean = email_str.strip().lower()
    if "@" in clean:
        return clean.split("@")[-1].strip().strip(">").strip()
    return clean


def load_master_ledger() -> List[Dict[str, Any]]:
    """Load and return active in-memory Master Ledger vendors list."""
    ledger_dict = get_active_ledger()
    if not ledger_dict:
        load_default_ledger_file()
        ledger_dict = get_active_ledger()
    return list(ledger_dict.values())


def find_vendor_in_ledger(
    sender_domain: str,
    vendor_name: str,
) -> Optional[Dict[str, Any]]:
    """Identify vendor in Master Ledger by domain first, then normalized name."""
    ledger = get_active_ledger()
    if not ledger:
        load_default_ledger_file()
        ledger = get_active_ledger()

    clean_domain = sender_domain.strip().lower()
    clean_name = vendor_name.strip().lower()

    # 1. Match by vendor_key (exact name match)
    if clean_name in ledger:
        return ledger[clean_name]

    # 2. Match by authorized_domain
    if clean_domain:
        for entry in ledger.values():
            auth_domain = str(entry.get("authorized_domain", "")).strip().lower()
            if auth_domain and auth_domain == clean_domain:
                return entry

    # 3. Substring match on vendor_name
    if clean_name:
        for entry in ledger.values():
            reg_name = entry["vendor_name"].strip().lower()
            if reg_name in clean_name or clean_name in reg_name:
                return entry

    return None


def calculate_dormancy_days(last_active_date_str: str) -> int:
    """Calculate days elapsed since last active date relative to current benchmark date."""
    if not last_active_date_str:
        return 0
    try:
        active_dt = datetime.strptime(last_active_date_str[:10], "%Y-%m-%d").date()
        # Reference anchor date: October 2026
        ref_dt = datetime.now(timezone.utc).date()
        # Ensure if environment clock is in 2026, we use it, otherwise fall back to 2026-10-07
        if ref_dt.year < 2026:
            ref_dt = datetime(2026, 10, 7).date()
        return (ref_dt - active_dt).days
    except Exception:
        return 0


def reconcile_invoice(
    extracted_invoice: Dict[str, Any],
    email_metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute deterministic multi-layered forensic reconciliation:
    - Check A: In-Transit BEC Diversion (email body bank vs PDF bank)
    - Check B: Master Ledger Verification (PDF bank vs Master Ledger)
    - Check C: PDRM CCID SemakMule Cache
    - Check D: Dormancy Recency (>180 days)
    - Check E: PO & Ghost Goods Verification (po_number vs po_prefix)
    - Check F: Rolling Velocity Engine (record_and_check_velocity)
    - Dual-Factor Consumer Tool Exception: Canva/iLovePDF benign if bank matches ledger.
    """
    semakmule_blacklist = load_semakmule_cache()

    # 1. Helper Normalization
    pdf_bank_acc = normalize_account_number(
        extracted_invoice.get("bank_account")
        or extracted_invoice.get("bank_account_number")
        or extracted_invoice.get("claimed_account")
        or ""
    )
    email_body_bank_acc = normalize_account_number(
        email_metadata.get("email_body_bank_account")
        or email_metadata.get("declared_bank_account")
        or ""
    )
    sender_email = str(email_metadata.get("sender_email") or email_metadata.get("sender") or "").strip()
    sender_domain = extract_email_domain(sender_email)
    raw_vendor_name = str(extracted_invoice.get("vendor_name") or "").strip()
    invoice_amount = float(
        extracted_invoice.get("amount")
        or extracted_invoice.get("total_amount")
        or extracted_invoice.get("amount_myr")
        or 0.0
    )
    pdf_producer = str(extracted_invoice.get("pdf_producer") or extracted_invoice.get("producer_tool") or "").strip()
    po_number = str(extracted_invoice.get("po_number") or extracted_invoice.get("po") or "").strip()

    flags: List[str] = []
    checks = {
        "domain_match": False,
        "bank_account_match": False,
        "email_pdf_consistent": True,
        "semak_mule_clear": True,
        "amount_within_threshold": True,
        "dormancy_clear": True,
        "po_verified": True,
        "velocity_clear": True,
    }

    # 2. Check C: PDRM CCID SemakMule Cache
    is_mule_hit = False
    if pdf_bank_acc in semakmule_blacklist or (email_body_bank_acc and email_body_bank_acc in semakmule_blacklist):
        is_mule_hit = True
        checks["semak_mule_clear"] = False
        flags.append("SEMAKMULE_BLACKLIST_HIT")

    # 3. Vendor Identification
    matched_vendor = find_vendor_in_ledger(sender_domain, raw_vendor_name)

    # 4. Check A: In-Transit BEC Diversion (email body bank != PDF bank)
    email_pdf_consistent = True
    if email_body_bank_acc and pdf_bank_acc:
        if email_body_bank_acc != pdf_bank_acc:
            email_pdf_consistent = False
            checks["email_pdf_consistent"] = False
            flags.append("BEC_IN_TRANSIT_DIVERSION")

    # If vendor is unregistered in Master Ledger
    if not matched_vendor:
        checks["domain_match"] = False
        checks["bank_account_match"] = False
        flags.append("UNREGISTERED_VENDOR")

        if is_mule_hit:
            verdict = "LOCKED_CRITICAL"
            risk_score = 99
            recommendation = "CRITICAL: Beneficiary account is blacklisted in PDRM CCID SemakMule. Block payment immediately."
        elif not email_pdf_consistent:
            verdict = "LOCKED_CRITICAL"
            risk_score = 92
            recommendation = "CRITICAL: In-transit payment diversion detected. Email body bank account contradicts attached PDF."
        else:
            verdict = "NEEDS_REVIEW"
            risk_score = 50
            recommendation = "ADVISORY: Vendor is not registered in Master Procurement Ledger. Escalate to procurement clerk for manual registration verification."

        return {
            "verdict": verdict,
            "status": verdict,
            "risk_score": risk_score,
            "matched_vendor": None,
            "flags": flags,
            "checks": checks,
            "recommendation": recommendation,
            "enforced_landline": None,
            "evidence_matrix": _build_evidence_matrix(email_metadata, extracted_invoice, None),
            "reconciliation_verdicts": {
                "email_matches_pdf": email_pdf_consistent,
                "pdf_matches_ledger": False,
                "semak_mule_clear": not is_mule_hit,
                "metadata_authentic": True,
            },
        }

    # Vendor IS identified in Master Ledger
    ledger_vendor_name = matched_vendor["vendor_name"]
    ledger_account = normalize_account_number(matched_vendor.get("account_no") or matched_vendor.get("bank_account_number"))
    ledger_bank = matched_vendor.get("bank_name")
    official_landline = matched_vendor.get("official_landline", "+60 3-0000 0000")
    typical_max = float(matched_vendor.get("typical_max_amount") or 25000.0)
    last_active_date = matched_vendor.get("last_active_date", "2026-08-15")
    po_prefix = matched_vendor.get("po_prefix", "PO-")
    requires_grn = bool(matched_vendor.get("requires_grn", False))

    auth_domain = str(matched_vendor.get("authorized_domain", "")).strip().lower()
    checks["domain_match"] = (not auth_domain) or (sender_domain == auth_domain)

    # 5. Check B: Master Ledger Verification (PDF bank vs Master Ledger)
    bank_matches_ledger = (pdf_bank_acc == ledger_account)
    checks["bank_account_match"] = bank_matches_ledger
    if not bank_matches_ledger:
        flags.append("UNAUTHORIZED_BANK_CHANGE")

    # 6. Consumer PDF Tooling Heuristic (Canva / iLovePDF)
    producer_lower = pdf_producer.lower()
    is_consumer_tool = any(tool in producer_lower for tool in CONSUMER_TOOLS)
    if is_consumer_tool:
        if bank_matches_ledger:
            # Dual-Factor Consumer Tool Exception: 0 risk penalty!
            flags.append("CONSUMER_PDF_TOOL_BENIGN")
        else:
            flags.append("PDF_METADATA_SUSPICIOUS")

    # 7. Check D: Dormancy Recency (>180 days since last activity)
    dormancy_days = calculate_dormancy_days(last_active_date)
    is_dormant = dormancy_days > 180
    if is_dormant:
        checks["dormancy_clear"] = False
        flags.append("DORMANT_VENDOR_ACTIVITY_DETECTED")

    # 8. Check E: PO & Ghost Goods Verification
    po_valid = True
    if requires_grn:
        if not po_number or not po_number.startswith(po_prefix):
            po_valid = False
            checks["po_verified"] = False
            flags.append("MISSING_OR_INVALID_PURCHASE_ORDER")

    # 9. Check F: Rolling Velocity Engine
    vendor_key = ledger_vendor_name.strip().lower()
    weekly_cap = typical_max * 1.5
    is_velocity_breach, breach_msg = record_and_check_velocity(
        vendor_key=vendor_key,
        amount=invoice_amount,
        max_weekly_cap=weekly_cap,
    )
    if is_velocity_breach:
        checks["velocity_clear"] = False
        flags.append("VELOCITY_THRESHOLD_BREACH")

    # Check baseline amount
    if invoice_amount > typical_max and typical_max > 0:
        checks["amount_within_threshold"] = False
        if "VELOCITY_THRESHOLD_BREACH" not in flags:
            flags.append("AMOUNT_EXCEEDS_BASELINE")

    # -------------------------------------------------------------
    # DECISION ARBITRATION HIERARCHY
    # -------------------------------------------------------------
    verdict = "VERIFIED"
    risk_score = 0
    recommendation = "VERIFIED: 3-Way reconciliation passed. Remittance bank details match Master Procurement Ledger."
    enforced_landline = official_landline

    # High-Priority Attacks (LOCKED_CRITICAL)
    if is_mule_hit:
        # Check C: Hard override risk_score = 99, LOCKED_CRITICAL
        verdict = "LOCKED_CRITICAL"
        risk_score = 99
        recommendation = (
            f"CRITICAL: Beneficiary bank account ({pdf_bank_acc or email_body_bank_acc}) is confirmed on PDRM CCID "
            f"SemakMule blacklist. Payment blocked immediately. Printed phone suppressed; contact verified landline {official_landline}."
        )
    elif not email_pdf_consistent:
        # Check A: In-transit BEC Diversion (risk_score >= 85, LOCKED_CRITICAL)
        verdict = "LOCKED_CRITICAL"
        risk_score = 92
        recommendation = (
            f"CRITICAL: BEC in-transit payment diversion trap. Email body requests payment to {email_body_bank_acc}, "
            f"while attached PDF displays registered account {pdf_bank_acc}. Payment disbursement blocked."
        )
    elif not bank_matches_ledger:
        # Check B: Unauthorized Bank Change (risk_score >= 90, LOCKED_CRITICAL)
        verdict = "LOCKED_CRITICAL"
        risk_score = 95
        recommendation = (
            f"CRITICAL: Invoice draft bank account ({pdf_bank_acc}) contradicts Master Procurement Ledger "
            f"({ledger_account}). Payment blocked pending out-of-band switchboard authorization."
        )
    # Review Anomalies (NEEDS_REVIEW)
    elif "VELOCITY_THRESHOLD_BREACH" in flags:
        # Check F: Velocity breach -> risk_score >= 75
        verdict = "NEEDS_REVIEW"
        risk_score = 75
        recommendation = (
            f"ADVISORY: Weekly procurement velocity cap exceeded for {ledger_vendor_name}. "
            f"Requires secondary management authorization before release."
        )
    elif "MISSING_OR_INVALID_PURCHASE_ORDER" in flags:
        # Check E: PO verification failed -> risk_score >= 70
        verdict = "NEEDS_REVIEW"
        risk_score = 70
        recommendation = (
            f"ADVISORY: Physical goods invoice requires GRN matching but lacks valid PO starting with '{po_prefix}'. "
            f"Holding voucher until Goods Received Note is attached."
        )
    elif "DORMANT_VENDOR_ACTIVITY_DETECTED" in flags:
        # Check D: Dormant vendor (>180 days) -> risk_score >= 65
        verdict = "NEEDS_REVIEW"
        risk_score = 65
        recommendation = (
            f"ADVISORY: Supplier account inactive for {dormancy_days} days (>180 days threshold). "
            f"Requires dual AP clerk callback to official switchboard {official_landline}."
        )
    elif not checks["amount_within_threshold"]:
        verdict = "NEEDS_REVIEW"
        risk_score = 40
        recommendation = f"ADVISORY: Invoice amount (RM {invoice_amount:,.2f}) exceeds typical max baseline (RM {typical_max:,.2f})."
    else:
        # Clean or benign consumer tool
        verdict = "VERIFIED"
        risk_score = 0

    return {
        "verdict": verdict,
        "status": verdict,
        "risk_score": risk_score,
        "matched_vendor": ledger_vendor_name,
        "flags": flags,
        "checks": checks,
        "recommendation": recommendation,
        "enforced_landline": enforced_landline,
        "evidence_matrix": _build_evidence_matrix(email_metadata, extracted_invoice, matched_vendor),
        "reconciliation_verdicts": {
            "email_matches_pdf": email_pdf_consistent,
            "pdf_matches_ledger": bank_matches_ledger,
            "semak_mule_clear": not is_mule_hit,
            "metadata_authentic": not ("PDF_METADATA_SUSPICIOUS" in flags),
        },
    }


def reconcile_case(case_data: Dict[str, Any]) -> Dict[str, Any]:
    """Helper entrypoint for executing reconciliation directly on case data dictionaries."""
    extracted = {
        "vendor_name": case_data.get("vendor_name", ""),
        "bank_name": case_data.get("bank_name") or case_data.get("claimed_bank", "Unknown Bank"),
        "bank_account": case_data.get("bank_account") or case_data.get("claimed_account", ""),
        "amount": case_data.get("amount") or case_data.get("amount_myr", 0.0),
        "pdf_producer": case_data.get("pdf_producer") or case_data.get("producer_tool", ""),
        "po_number": case_data.get("po_number"),
    }
    email_meta = {
        "sender_email": case_data.get("sender_email") or case_data.get("sender", ""),
        "email_body_bank_account": case_data.get("email_body_bank_account") or case_data.get("declared_bank_account"),
        "subject": case_data.get("subject", ""),
    }
    return reconcile_invoice(extracted, email_meta)


def _build_evidence_matrix(
    email_metadata: Dict[str, Any],
    extracted_invoice: Dict[str, Any],
    ledger: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Build structured 3-way evidence matrix according to Section 4 deterministic contract."""
    email_acc = email_metadata.get("email_body_bank_account") or email_metadata.get("declared_bank_account")
    return {
        "source_1_email_body": {
            "bank_name": email_metadata.get("email_body_bank_name"),
            "account_number": normalize_account_number(email_acc) if email_acc else None,
            "amount": float(extracted_invoice.get("amount") or extracted_invoice.get("total_amount") or 0.0),
        },
        "source_2_invoice_pdf": {
            "bank_name": extracted_invoice.get("bank_name"),
            "account_number": normalize_account_number(extracted_invoice.get("bank_account") or extracted_invoice.get("bank_account_number")),
            "amount": float(extracted_invoice.get("amount") or extracted_invoice.get("total_amount") or 0.0),
            "metadata_producer": extracted_invoice.get("pdf_producer") or extracted_invoice.get("producer_tool"),
        },
        "source_3_master_ledger": {
            "bank_name": ledger.get("bank_name") if ledger else None,
            "account_number": normalize_account_number(ledger.get("account_no") or ledger.get("bank_account_number")) if ledger else None,
            "baseline_range": [0.0, float(ledger.get("typical_max_amount", 0.0))] if ledger else [0.0, 0.0],
            "is_registered": ledger is not None,
            "official_landline": ledger.get("official_landline") if ledger else None,
            "last_active_date": ledger.get("last_active_date") if ledger else None,
        },
    }
