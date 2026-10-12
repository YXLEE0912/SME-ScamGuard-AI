import csv
import hashlib
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional

from fastapi import HTTPException, status
from backend.app.schemas.ledger import VendorLedgerEntry, LedgerSyncResponse, normalize_account_number

# Active in-memory vendor registry: vendor_key -> VendorLedgerEntry
MASTER_LEDGER: Dict[str, Dict[str, Any]] = {}
# Index by normalized account number: account_no -> Dict[str, Any]
MASTER_LEDGER_ACCOUNT_INDEX: Dict[str, Dict[str, Any]] = {}
# Index by domain/email lookup: domain -> Dict[str, Any]
MASTER_LEDGER_DOMAIN_INDEX: Dict[str, Dict[str, Any]] = {}

CURRENT_LEDGER_SHA256: str = ""
LAST_SYNC_TIMESTAMP: str = ""


def get_active_ledger() -> Dict[str, Dict[str, Any]]:
    global MASTER_LEDGER
    if not MASTER_LEDGER:
        load_default_ledger_file()
    return MASTER_LEDGER


def load_default_ledger_file() -> int:
    """Load default 40-vendor CSV from disk into volatile memory."""
    possible_paths = [
        Path(__file__).resolve().parent.parent / "data" / "vendor_ledger.csv",
        Path("backend/data/vendor_ledger.csv"),
        Path("data/vendor_ledger.csv"),
        Path(__file__).resolve().parent.parent.parent / "data" / "vendor_ledger.csv",
    ]
    for p in possible_paths:
        if p.exists():
            content = p.read_text(encoding="utf-8")
            res = sync_ledger_from_csv(content, source_format="System_Default_CSV")
            return res.vendors_loaded
    return 0


def sync_ledger_from_csv(
    csv_text_or_bytes: str | bytes,
    source_format: str = "AutoCount_CSV",
) -> LedgerSyncResponse:
    """
    Parses CSV stream in volatile memory using csv.DictReader and io.StringIO.
    Validates mandatory Malaysian accounting headers and replaces MASTER_LEDGER atomically.
    Zero-disk runtime.
    """
    global MASTER_LEDGER, MASTER_LEDGER_ACCOUNT_INDEX, MASTER_LEDGER_DOMAIN_INDEX, CURRENT_LEDGER_SHA256, LAST_SYNC_TIMESTAMP

    if isinstance(csv_text_or_bytes, bytes):
        raw_bytes = csv_text_or_bytes
        csv_text = raw_bytes.decode("utf-8-sig", errors="replace")
    else:
        csv_text = csv_text_or_bytes
        raw_bytes = csv_text.encode("utf-8")

    ledger_hash = hashlib.sha256(raw_bytes).hexdigest()
    reader = csv.DictReader(io.StringIO(csv_text))

    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Malformed CSV: missing header row.",
        )

    # Normalize header fieldnames
    headers = [h.strip().lower() for h in reader.fieldnames if h]

    # Check for vendor name field
    has_vendor = any(h in headers for h in ["vendor_name", "vendor", "supplier_name", "company_name"])
    # Check for account number field
    has_account = any(h in headers for h in ["account_no", "bank_account", "bank_account_number", "acc_no"])
    # Check for bank name
    has_bank = any(h in headers for h in ["bank_name", "bank", "financial_institution"])

    if not (has_vendor and has_account and has_bank):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Malformed CSV structure: Missing required columns. "
                "Expected vendor_name, bank_name, and account_no (or Malaysian accounting equivalents)."
            ),
        )

    temp_ledger: Dict[str, Dict[str, Any]] = {}
    temp_acc_index: Dict[str, Dict[str, Any]] = {}
    temp_dom_index: Dict[str, Dict[str, Any]] = {}

    row_count = 0
    for idx, row in enumerate(reader, start=2):
        if not any(v.strip() for v in row.values() if v):
            continue  # empty line

        # Map row keys to lowercase
        norm_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}

        # Resolve aliases
        v_name = norm_row.get("vendor_name") or norm_row.get("supplier_name") or norm_row.get("company_name") or ""
        v_bank = norm_row.get("bank_name") or norm_row.get("bank") or ""
        v_acc = norm_row.get("account_no") or norm_row.get("bank_account") or norm_row.get("bank_account_number") or ""
        v_ssm = norm_row.get("ssm_no") or norm_row.get("registration_no") or norm_row.get("roc_no") or ""
        v_phone = norm_row.get("official_landline") or norm_row.get("landline") or norm_row.get("phone") or "+60 3-0000 0000"
        v_date = norm_row.get("last_active_date") or norm_row.get("last_active") or "2026-08-15"
        v_po = norm_row.get("po_prefix") or norm_row.get("po_code") or "PO-"
        v_grn = norm_row.get("requires_grn", "True")

        try:
            v_max = float(norm_row.get("typical_max_amount") or 25000.0)
        except (ValueError, TypeError):
            v_max = 25000.0

        if not v_name or not v_acc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Line {idx}: Missing vendor name or bank account number.",
            )

        entry = VendorLedgerEntry(
            vendor_name=v_name,
            ssm_no=v_ssm,
            bank_name=v_bank,
            account_no=v_acc,
            official_landline=v_phone,
            typical_max_amount=v_max,
            last_active_date=v_date,
            po_prefix=v_po,
            requires_grn=v_grn,
        ).model_dump()

        # Add domain alias helper (e.g. from vendor name or authorized_domain if provided)
        auth_domain = norm_row.get("authorized_domain") or ""
        if auth_domain:
            entry["authorized_domain"] = auth_domain.lower()
            temp_dom_index[auth_domain.lower()] = entry

        # Keying
        v_key = v_name.strip().lower()
        temp_ledger[v_key] = entry
        temp_acc_index[entry["account_no"]] = entry
        row_count += 1

    # Atomic swap
    MASTER_LEDGER = temp_ledger
    MASTER_LEDGER_ACCOUNT_INDEX = temp_acc_index
    MASTER_LEDGER_DOMAIN_INDEX = temp_dom_index
    CURRENT_LEDGER_SHA256 = ledger_hash
    LAST_SYNC_TIMESTAMP = datetime.now(timezone.utc).isoformat()

    return LedgerSyncResponse(
        status="success",
        vendors_loaded=row_count,
        source_format=source_format,
        ledger_sha256=ledger_hash,
        timestamp=LAST_SYNC_TIMESTAMP,
    )
