from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ScanRequest(BaseModel):
    case_id: Optional[str] = "CUSTOM_SCAN"
    vendor_name: str = "Mega Logistics Sdn Bhd"
    sender: str
    recipient: Optional[str] = "ap@sme-enterprise.com.my"
    subject: str
    body: str
    bank_account: str
    bank_name: Optional[str] = "Unknown Bank"
    amount_myr: float
    pdf_producer_tool: Optional[str] = "Unknown"
    timestamp_desync: Optional[bool] = False
    raw_pdf_bytes_b64: Optional[str] = None
    simulate_ai_error: Optional[bool] = False

class PrivacySanitizationResult(BaseModel):
    sanitized_text: str
    redacted_mykad_count: int
    redacted_phone_count: int
    zero_disk_persisted: bool = True
    latency_ms: float

class ForensicScanResult(BaseModel):
    is_valid_pdf_structure: bool
    consumer_tool_detected: bool
    timestamp_desync: bool
    i_tamper: int
    producer_string: str
    page_count: int
    latency_ms: float

class KnowledgeBaseResult(BaseModel):
    vendor_found: bool
    ledger_match: bool
    i_ledger: int
    s_semakmule: int
    mule_hit: bool
    status: str
    verified_phone: str
    approved_bank: Optional[str] = None
    approved_account: Optional[str] = None
    latency_ms: float

class CognitiveAnalysisResult(BaseModel):
    urgency_score: int
    coercion_detected: bool
    adversarial_injection_detected: bool
    reasoning: str
    ai_online: bool = True
    fail_closed_engaged: bool = False
    latency_ms: float

class RiskPolicyResult(BaseModel):
    risk_score: int
    status: str
    i_ledger: int
    i_tamper: int
    s_semakmule: int
    urgency_score: int
    review_codes: List[str]
    fail_closed_reason: Optional[str] = None

class DualAuthVoucher(BaseModel):
    voucher_id: str
    status: str  # PAYMENT_LOCKED, CLERK_VERIFIED, OVERRIDDEN_RELEASED
    amount_myr: float
    beneficiary_account: str
    clerk_callback_logged: bool = False
    clerk_callback_timestamp: Optional[str] = None
    clerk_notes: Optional[str] = None
    manager_override_logged: bool = False
    manager_override_timestamp: Optional[str] = None
    manager_override_token: Optional[str] = None

class CallbackVerificationRequest(BaseModel):
    clerk_id: str = "AP_CLERK_01"
    phone_dialed: str = "+60 3-7722 8888"
    verification_notes: str = "Verified verbal authority via official switchboard"

class OverrideRequest(BaseModel):
    manager_id: str = "FIN_MGR_09"
    corporate_key_token: str
    override_reason: str

class StatutoryArtifacts(BaseModel):
    evidence_sha256: str
    nsrc_997_dossier: Dict[str, Any]
    nsrc_997_markdown: str
    gmail_dispute_reply: str
    print_verification_record: Dict[str, Any]

class PipelineResponse(BaseModel):
    case_id: str
    status: str
    risk_score: int
    voucher_id: str
    reconciliation_matrix: Dict[str, Any]
    forensic_digest: Dict[str, Any]
    policy_evaluation: RiskPolicyResult
    statutory_artifacts: StatutoryArtifacts
    execution_telemetry: Dict[str, float]
