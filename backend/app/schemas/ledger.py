from typing import Optional
from pydantic import BaseModel, Field, model_validator
import re


def normalize_account_number(acc: Optional[str]) -> str:
    if not acc:
        return ""
    return re.sub(r"[^0-9]", "", str(acc).split(".")[0].strip())


class VendorLedgerEntry(BaseModel):
    vendor_name: str = Field(..., description="Approved Malaysian vendor trade/corporate name")
    ssm_no: str = Field(..., description="SSM Corporate Registration Number")
    bank_name: str = Field(..., description="Registered financial institution name")
    account_no: str = Field(..., description="Normalized bank account number")
    official_landline: str = Field(..., description="Canonical office switchboard phone, e.g. +60 3-XXXX XXXX")
    typical_max_amount: float = Field(default=25000.0, description="Baseline maximum historical claim amount")
    last_active_date: str = Field(default="2026-08-15", description="ISO 8601 date of last approved AP transaction")
    po_prefix: str = Field(default="PO-", description="Approved Purchase Order prefix code")
    requires_grn: bool = Field(default=True, description="Whether GRN verification is required for goods delivery")

    @model_validator(mode="before")
    @classmethod
    def map_aliases_and_defaults(cls, data: dict):
        if not isinstance(data, dict):
            return data
        d = dict(data)
        # Support aliases
        if "registration_no" in d and "ssm_no" not in d:
            d["ssm_no"] = d["registration_no"]
        if "bank_account" in d and "account_no" not in d:
            d["account_no"] = d["bank_account"]
        if "bank_account_number" in d and "account_no" not in d:
            d["account_no"] = d["bank_account_number"]
        if "landline" in d and "official_landline" not in d:
            d["official_landline"] = d["landline"]

        # Normalize account_no
        if "account_no" in d:
            d["account_no"] = normalize_account_number(str(d["account_no"]))

        # Safe defaults
        if "typical_max_amount" not in d or d["typical_max_amount"] is None or str(d["typical_max_amount"]).strip() == "":
            d["typical_max_amount"] = 25000.0
        else:
            try:
                d["typical_max_amount"] = float(d["typical_max_amount"])
            except (ValueError, TypeError):
                d["typical_max_amount"] = 25000.0

        if "requires_grn" not in d or d["requires_grn"] is None:
            d["requires_grn"] = True
        elif isinstance(d["requires_grn"], str):
            d["requires_grn"] = d["requires_grn"].strip().lower() in ("true", "1", "yes", "t")

        if not d.get("last_active_date"):
            d["last_active_date"] = "2026-08-15"

        if not d.get("po_prefix"):
            d["po_prefix"] = "PO-"

        return d


class LedgerSyncResponse(BaseModel):
    status: str
    vendors_loaded: int
    source_format: str
    ledger_sha256: str
    timestamp: str
