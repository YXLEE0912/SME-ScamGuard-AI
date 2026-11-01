"""
SME-ScamGuard-AI Data Contracts (Phase 1.2)
===========================================
Defines Pydantic v2 strict models for pipeline execution across all defense tiers:
- Tier 1: Deterministic Engine (Privacy, Binary Forensics, Relational Reconciliation)
- Tier 2: Cognitive Perception Sandbox (Gemini 2.5 Flash)
- Tier 3: Declarative Policy Arbiter & Incident Dossier
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, model_validator
import re


def normalize_account_number(acc: Optional[Any]) -> str:
    """Normalize bank account by stripping non-numeric characters, hyphens, and whitespace."""
    if acc is None:
        return ""
    s = str(acc).split(".")[0].strip()
    return re.sub(r"[^0-9]", "", s)


class VendorLedgerEntry(BaseModel):
    """Authoritative ground-truth vendor profile from the Master Procurement Ledger."""
    vendor_name: str = Field(..., description="Approved Malaysian vendor trade/corporate entity name")
    ssm_no: str = Field(..., description="SSM Corporate Registration Number (e.g. 201801023456 (1285475-A))")
    bank_name: str = Field(..., description="Approved financial institution name")
    account_no: str = Field(..., description="Normalized bank account number")
    official_landline: str = Field(..., description="Registered corporate landline phone, e.g. +60 3-XXXX XXXX")
    authorized_domain: Optional[str] = Field(None, description="Allowlisted sender email domain")
    typical_max_amount: float = Field(default=25000.0, description="Baseline maximum historical claim amount")
    last_active_date: str = Field(default="2026-08-15", description="ISO 8601 date of last approved AP transaction")
    po_prefix: str = Field(default="PO-", description="Approved Purchase Order prefix code")
    requires_grn: bool = Field(default=True, description="Whether GRN verification is required for goods delivery")

    @model_validator(mode="before")
    @classmethod
    def map_aliases_and_defaults(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        d = dict(data)
        if "registration_no" in d and "ssm_no" not in d:
            d["ssm_no"] = d["registration_no"]
        if "bank_account" in d and "account_no" not in d:
            d["account_no"] = d["bank_account"]
        if "bank_account_number" in d and "account_no" not in d:
            d["account_no"] = d["bank_account_number"]
        if "landline" in d and "official_landline" not in d:
            d["official_landline"] = d["landline"]
        if "account_no" in d:
            d["account_no"] = normalize_account_number(d["account_no"])
        return d


class InboundInvoiceClaim(BaseModel):
    """Raw or parsed payment claims extracted from inbound email or PDF invoice payload."""
    claimed_vendor: Optional[str] = Field(None, description="Claimed vendor or trade entity name")
    claimed_bank: Optional[str] = Field(None, description="Claimed beneficiary bank name")
    claimed_account: Optional[str] = Field(None, description="Claimed remittance account digits")
    amount: float = Field(default=0.0, description="Total claim amount in MYR")
    po_number: Optional[str] = Field(None, description="Claimed Purchase Order identifier")
    invoice_ref: Optional[str] = Field(None, description="Invoice reference code or number")
    sender_email: Optional[str] = Field(None, description="Sender RFC 5322 email address")
    subject: Optional[str] = Field(None, description="Email subject line")
    body: Optional[str] = Field(None, description="Raw inbound email body text")


class BinaryForensicResult(BaseModel):
    """Forensic telemetry from ISO 32000-1 deterministic PDF byte-level inspection."""
    producer: str = Field(..., description="PDF /Producer or /Creator software string")
    creation_date: Optional[str] = Field(None, description="Creation timestamp from PDF metadata")
    mod_date: Optional[str] = Field(None, description="Modification timestamp from PDF metadata")
    delta_seconds: Optional[float] = Field(None, description="Elapsed delta |ModDate - CreationDate| in seconds")
    eof_count: int = Field(default=1, description="Count of %%EOF markers in raw byte stream")
    is_spliced: bool = Field(default=False, description="Whether incremental updates or multiple trailers detected")
    i_tamper: int = Field(default=0, description="Tampering indicator (1 if suspicious, 0 if authentic)")
    tool_tag: str = Field(default="AUTHENTIC_ERP_SIGNATURE", description="Tooling classification tag")


class CognitiveExtractionResult(BaseModel):
    """Perception output schema returned by the sandboxed Gemini 2.5 Flash agent."""
    claimed_vendor: Optional[str] = Field(None, description="Extracted vendor title")
    claimed_bank: Optional[str] = Field(None, description="Extracted remittance bank name")
    claimed_account: Optional[str] = Field(None, description="Extracted beneficiary account digits")
    invoice_amount: Optional[float] = Field(None, description="Extracted invoice total in MYR")
    urgency_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Measured psychological urgency score (0-100)")
    coercion_detected: bool = Field(default=False, description="Flag indicating executive impersonation or pressure tactics")
    procedural_bypass_requested: bool = Field(default=False, description="Flag indicating requests to skip standard controls")
    extraction_confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Cognitive extraction confidence (0.0 - 1.0)")
    error: Optional[str] = Field(None, description="Diagnostic error state (e.g. AI_COGNITIVE_UNAVAILABLE)")


class PipelineDispositionPayload(BaseModel):
    """Authoritative output emitted by Tier 3 Policy Arbiter after all checks complete."""
    case_id: str = Field(..., description="Unique case or voucher tracking identifier")
    risk_score: int = Field(..., ge=0, le=100, description="Computed formal risk score R (0-100)")
    disposition: Literal["VERIFIED", "NEEDS_REVIEW", "LOCKED_CRITICAL"] = Field(
        ..., description="Final disposition state computed by deterministic finite state machine"
    )
    evidence_cues: List[str] = Field(default_factory=list, description="Forensic and behavioral discrepancy flags")
    callback_voucher: Optional[Dict[str, Any]] = Field(None, description="Out-of-band landline callback voucher details")
    audit_event_hash: str = Field(..., description="Cryptographically chained SHA-256 audit digest")
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp of decision arbitration")

