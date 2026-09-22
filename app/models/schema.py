"""Pydantic v2 data models and contracts for SME-ScamGuard-AI.

Defines schemas for email inputs, forensic evidence cues, PII redaction logs,
out-of-band callback vouchers, and final audit reports.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class EmailInput(BaseModel):
    """Input payload representing an inbound email or invoice payment request."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    case_id: Optional[str] = Field(
        default="MANUAL_INPUT",
        description="Unique identifier for the evaluation or operational case.",
    )
    sender: str = Field(
        ...,
        description="Sender email address (e.g. 'finance@mega-bu1ld.com.my').",
    )
    subject: str = Field(
        ...,
        description="Email subject line containing potential urgency or topic cues.",
    )
    body: str = Field(
        ...,
        description="Raw email body text to be inspected and sanitized.",
    )
    declared_bank_account: Optional[str] = Field(
        default=None,
        description="Bank account number extracted from the email or invoice attachment.",
    )
    declared_amount: Optional[float] = Field(
        default=None,
        description="Payment amount in MYR requested in the invoice.",
    )


class PIIRedactionLog(BaseModel):
    """Audit log entry capturing an in-memory PII sanitization event."""

    model_config = ConfigDict(extra="ignore")

    field_name: str = Field(
        ...,
        description="Target field where PII was identified (e.g. 'body').",
    )
    original_snippet: str = Field(
        ...,
        description="The original unmasked sensitive data snippet.",
    )
    masked_value: str = Field(
        ...,
        description="The sanitized replacement string (e.g. 'XXXX-****-****').",
    )
    redaction_rule: str = Field(
        ...,
        description="The statutory or privacy rule applied (e.g. 'MYKAD_STATUTORY_MASK').",
    )


class EvidenceCue(BaseModel):
    """Forensic signal identified by a specialized agent during email inspection."""

    model_config = ConfigDict(extra="ignore")

    cue_code: str = Field(
        ...,
        description="Machine-readable code: 'LOOKALIKE_DOMAIN', 'UNVERIFIED_BANK_CHANGE', 'CISA_URGENCY'.",
    )
    agent_source: str = Field(
        ...,
        description="Identifier of the investigating agent that uncovered this cue.",
    )
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(
        ...,
        description="Severity classification of the identified risk cue.",
    )
    description: str = Field(
        ...,
        description="Detailed contextual narrative of the forensic finding.",
    )


class HumanCallbackVoucher(BaseModel):
    """Actionable out-of-band verification voucher required before payment release."""

    model_config = ConfigDict(extra="ignore")

    action_type: str = Field(
        default="REQUIRE_HUMAN_CALLBACK",
        description="Enforcement action directive for the finance/procurement desk.",
    )
    protocol: str = Field(
        default="OUT_OF_BAND_TELEPHONE_VERIFICATION",
        description="Mandatory verification channel protocol.",
    )
    target_vendor: str = Field(
        ...,
        description="Verified enterprise vendor entity being impersonated.",
    )
    authorized_phone_number: str = Field(
        ...,
        description="Verified internal registry phone number for verbal authorization.",
    )
    security_instructions: str = Field(
        ...,
        description="Operational directives preventing financial disbursement.",
    )
    verification_status: str = Field(
        default="PAYMENT_LOCKED_PENDING_CALL",
        description="State lock status in accounting / ERP workflow.",
    )


class AuditForensicReport(BaseModel):
    """Final synthesized multi-agent forensic evaluation report."""

    model_config = ConfigDict(extra="ignore")

    case_id: str = Field(
        ...,
        description="Evaluation case ID or transaction tracking identifier.",
    )
    is_scam: bool = Field(
        ...,
        description="Deterministic classification flag based on risk threshold.",
    )
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Composite threat score calculated across all agents (0.0 to 100.0).",
    )
    threat_level: Literal["SAFE", "SUSPICIOUS", "CRITICAL"] = Field(
        ...,
        description="Threat classification level: SAFE, SUSPICIOUS, or CRITICAL.",
    )
    primary_cues: List[str] = Field(
        default_factory=list,
        description="Key cue codes triggering the alert.",
    )
    evidence_trail: List[EvidenceCue] = Field(
        default_factory=list,
        description="Full sequential audit trail of forensic evidence cues.",
    )
    pii_redaction_trail: List[PIIRedactionLog] = Field(
        default_factory=list,
        description="Zero-trust privacy scrub logs produced before upstream inference.",
    )
    safe_next_step: Optional[HumanCallbackVoucher] = Field(
        default=None,
        description="Mandatory out-of-band callback voucher if high scam risk is flagged.",
    )
    executive_summary: str = Field(
        ...,
        description="High-level forensic executive summary for finance controllers.",
    )
