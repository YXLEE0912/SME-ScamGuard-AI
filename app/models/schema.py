"""Pydantic v2 data models and contracts for SME-ScamGuard-AI.

Defines schemas for email/invoice inputs, forensic evidence cues, PII redaction logs,
out-of-band callback vouchers, two-way discrepancy matrices, audit gap checklists,
DAG pipeline telemetry, activity timelines, and final audit reports.
"""

from typing import Any, Dict, List, Literal, Optional
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
    pdf_forensics: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Extracted PDF document metadata & anti-tamper forensics.",
    )
    artifact_tracking: Optional[Dict[str, Any]] = Field(
        default=None,
        description="SHA-256 artifact hash and duplicate replay status.",
    )


class ChannelMessageInput(BaseModel):
    """Input payload representing an inbound chat/messaging payment request (WhatsApp/Telegram)."""

    model_config = ConfigDict(extra="ignore")

    message: str = Field(
        ...,
        description="Raw message text received via messaging channel.",
    )
    sender: Optional[str] = Field(
        default="whatsapp:+60123456789",
        description="Channel sender handle or phone number.",
    )
    subject: Optional[str] = Field(
        default="Instant Messaging Channel Dispatch",
        description="Contextual header or topic for the conversation.",
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


class DiscrepancyMatrix(BaseModel):
    """Two-way cross-verification matrix comparing inbound fields against immutable master ledger."""

    model_config = ConfigDict(extra="ignore")

    ledger_vendor_name: Optional[str] = Field(
        default=None,
        description="Master procurement ledger registered company name.",
    )
    ledger_bank_account: Optional[str] = Field(
        default=None,
        description="Master procurement ledger verified bank account.",
    )
    invoice_bank_account: str = Field(
        default="UNSPECIFIED",
        description="Extracted inbound invoice bank account.",
    )
    account_match: bool = Field(
        default=False,
        description="True if inbound account matches registered procurement accounts.",
    )
    is_mule: bool = Field(
        default=False,
        description="True if account flagged in PDRM SemakMule / JSJK CCID blacklist.",
    )
    status: Literal["MATCH", "DISCREPANCY_DETECTED", "CRITICAL_MULE_DETECTED"] = Field(
        default="MATCH",
        description="Discrepancy classification status.",
    )


class AuditChecklistItem(BaseModel):
    """Itemized gap analysis forensic checklist item."""

    model_config = ConfigDict(extra="ignore")

    check: str = Field(
        ...,
        description="Name of security checkpoint (e.g. 'Vendor Identity', 'Bank Account Ledger').",
    )
    status: Literal["PASS", "FAIL"] = Field(
        ...,
        description="PASS or FAIL status for checkpoint.",
    )
    detail: str = Field(
        ...,
        description="Forensic detail explaining outcome.",
    )


class PipelineStageTelemetry(BaseModel):
    """Execution status and microsecond/millisecond latency metrics for a DAG agent node."""

    model_config = ConfigDict(extra="ignore")

    status: str = Field(default="SUCCESS", description="Execution status: SUCCESS or SKIPPED.")
    latency_ms: int = Field(default=0, description="Stage latency in milliseconds.")


class PipelineTelemetry(BaseModel):
    """End-to-end execution DAG telemetry across all pipeline stages."""

    model_config = ConfigDict(extra="ignore")

    stage_0_pii_scrub: PipelineStageTelemetry = Field(default_factory=PipelineStageTelemetry)
    stage_1_ledger_match: PipelineStageTelemetry = Field(default_factory=PipelineStageTelemetry)
    stage_2_cognitive_gemini: PipelineStageTelemetry = Field(default_factory=PipelineStageTelemetry)
    stage_3_risk_arbiter: PipelineStageTelemetry = Field(default_factory=PipelineStageTelemetry)
    total_pipeline_ms: int = Field(default=0, description="Total pipeline latency in milliseconds.")


class TimelineEvent(BaseModel):
    """Forensic activity timeline event with wall-clock timestamp and operational phase."""

    model_config = ConfigDict(extra="ignore")

    time: str = Field(..., description="Timestamp HH:MM:SS.")
    stage: str = Field(..., description="Pipeline execution stage.")
    detail: str = Field(..., description="Forensic audit action performed.")


class PdfForensics(BaseModel):
    """Forensic metadata extracted from PDF document internal dictionary."""

    model_config = ConfigDict(extra="ignore")

    producer: str = Field(default="N/A", description="PDF producer metadata string.")
    creator: str = Field(default="N/A", description="PDF creator tool metadata string.")
    creation_date: str = Field(default="N/A", description="Internal creation date string.")
    mod_date: str = Field(default="N/A", description="Internal modification date string.")
    is_tampered: bool = Field(default=False, description="Whether document exhibits third-party tampering.")
    evidence: str = Field(
        default="Non-PDF format; document metadata check bypassed.",
        description="Forensic evidentiary summary.",
    )


class ArtifactTracking(BaseModel):
    """SHA-256 artifact hashing and replay / duplicate submission tracking."""

    model_config = ConfigDict(extra="ignore")

    artifact_hash: str = Field(default="", description="Hexadecimal SHA-256 fingerprint.")
    is_duplicate: bool = Field(default=False, description="True if identical artifact was previously registered.")
    first_seen_timestamp: Optional[str] = Field(default=None, description="ISO timestamp of first submission.")
    original_filename: str = Field(default="", description="Filename of original submission.")
    status_badge: str = Field(
        default="PASS: UNIQUE ARTIFACT (NEW)",
        description="Verification badge text.",
    )


class DefensiveActions(BaseModel):
    """Automated incident response and defensive containment action dispatch."""

    model_config = ConfigDict(extra="ignore")

    is_triggered: bool = Field(default=False, description="Whether automated containment actions triggered.")
    actions: List[Dict[str, Any]] = Field(default_factory=list, description="Executed containment actions.")
    status_badge: Optional[str] = Field(default=None, description="Status summary badge.")


class AuditForensicReport(BaseModel):
    """Final synthesized multi-agent forensic evaluation report."""

    model_config = ConfigDict(extra="ignore")

    case_id: str = Field(
        ...,
        description="Evaluation case ID or transaction tracking identifier.",
    )
    status: Literal["PROCESSED", "QUARANTINED"] = Field(
        default="PROCESSED",
        description="Firewall quarantine state: PROCESSED or QUARANTINED.",
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
    verdict_summary: str = Field(
        default="",
        description="Single-sentence primary verdict for executive controller.",
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
        default="",
        description="High-level forensic executive summary for finance controllers.",
    )
    discrepancy_matrix: Optional[DiscrepancyMatrix] = Field(
        default=None,
        description="Two-way cross-verification matrix against procurement ledger.",
    )
    audit_checklist: List[AuditChecklistItem] = Field(
        default_factory=list,
        description="Itemized forensic audit gap analysis checklist.",
    )
    pipeline_telemetry: Optional[PipelineTelemetry] = Field(
        default=None,
        description="Execution DAG latency telemetry.",
    )
    timeline_events: List[TimelineEvent] = Field(
        default_factory=list,
        description="Timestamped forensic activity timeline.",
    )
    ocr_used: bool = Field(
        default=False,
        description="Whether hybrid multimodal vision OCR was executed.",
    )
    total_pages: int = Field(
        default=1,
        description="Total pages ingested from document.",
    )
    filename: Optional[str] = Field(
        default=None,
        description="Name of the ingested file attachment.",
    )
    pdf_forensics: Optional[PdfForensics] = Field(
        default=None,
        description="PDF document metadata & anti-tamper forensics.",
    )
    artifact_tracking: Optional[ArtifactTracking] = Field(
        default=None,
        description="SHA-256 artifact hashing and replay tracking.",
    )
    defensive_actions: Optional[DefensiveActions] = Field(
        default=None,
        description="Automated defensive containment actions and incident dispatch.",
    )
