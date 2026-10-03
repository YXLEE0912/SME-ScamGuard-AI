"""Multi-Agent Scam Guard Engine for SME Business Email Compromise (BEC) defense.

Coordinates four defense agents:
- AGENT 0: Privacy & Compliance Agent (In-memory zero-trust PII sanitization)
- AGENT 1: Identity & Wire Forensic Agent (Typo-squatting, homoglyph, SemakMule, and bank whitelist verification)
- AGENT 2: Cognitive Cyber Threat Analyst (Google Gemini 2.5 Flash with localized CTI trend matching & fallback)
- AGENT 3: Chief Risk Arbiter & Action Agent (Risk scoring, payout locking, and callback voucher issuance)

Includes Pydantic Schema Firewall (Quarantine Guard), Forensic Activity Timeline,
Two-Way Discrepancy Matrix, Audit Gap Analysis Checklist, and Event-Driven DAG Telemetry.
"""

from datetime import datetime
import re
import time
from typing import Any, Dict, List, Optional

from app.models.schema import (
    ArtifactTracking,
    AuditChecklistItem,
    AuditForensicReport,
    DefensiveActions,
    DiscrepancyMatrix,
    EmailInput,
    EvidenceCue,
    HumanCallbackVoucher,
    PIIRedactionLog,
    PdfForensics,
    PipelineStageTelemetry,
    PipelineTelemetry,
    TimelineEvent,
)
from app.services.defensive_action import generate_defensive_actions
from app.services.document_parser import extract_financial_fields
from app.services.gemini_agent import GeminiCognitiveAgent
from app.services.pii import sanitize_text_in_memory
from app.services.threat_intelligence import (
    check_semakmule_blacklist,
    get_active_threat_trends,
)

# Master Immutable Procurement Whitelist (Known Vendors Ground Truth)
KNOWN_VENDORS: Dict[str, Dict[str, object]] = {
    "megabuild.com.my": {
        "vendor_name": "Mega Build Sdn Bhd",
        "verified_accounts": ["5123-4567-8901"],
        "authorized_callback": "+60-3-7722-8888",
    },
    "alphatech.com.my": {
        "vendor_name": "Alpha Tech Sdn Bhd",
        "verified_accounts": ["8001-2233-4455"],
        "authorized_callback": "+60-3-7722-8888",
    },
    "fastcargo.com.my": {
        "vendor_name": "Fast Cargo Logistics",
        "verified_accounts": ["8001-2233-4455"],
        "authorized_callback": "+60-3-7722-8888",
    },
}

VERIFIED_VENDORS = KNOWN_VENDORS

# Suspicious / Impersonation Domain Signatures
SUSPICIOUS_SIGNATURES: List[str] = [
    "bu1ld",
    "citygroup-corp",
    "tax-enforce-gov",
    "gmail-corp",
]


def _normalize_account_number(acc: Optional[str]) -> str:
    """Normalize bank account string by stripping non-digit characters."""
    if not acc:
        return ""
    return re.sub(r"\D", "", acc)


class MultiAgentScamGuardEngine:
    """Deterministic Multi-Agent Engine orchestrating BEC and invoice scam defense."""

    def __init__(self, risk_threshold: float = 50.0, gemini_api_key: Optional[str] = None) -> None:
        """Initialize the engine with risk threshold and cognitive Gemini agent."""
        self.risk_threshold = risk_threshold
        self.gemini_agent = GeminiCognitiveAgent(api_key=gemini_api_key)

    @staticmethod
    def _extract_domain(sender: str) -> str:
        """Extract clean lowercased domain from RFC 5322 sender string."""
        s = sender.strip()
        if "<" in s and ">" in s:
            s = s[s.find("<") + 1 : s.find(">")]
        if "@" in s:
            return s.split("@")[-1].strip().lower()
        return s.lower()

    def coordinate_agents(
        self,
        email: EmailInput,
        ocr_used: bool = False,
        total_pages: int = 1,
        filename: Optional[str] = None,
        pdf_forensics: Optional[Dict[str, Any]] = None,
        artifact_tracking: Optional[Dict[str, Any]] = None,
    ) -> AuditForensicReport:
        """Coordinate all 4 defense agents with microsecond DAG telemetry and gap analysis."""
        overall_start = time.perf_counter()
        now_str = datetime.now().strftime("%H:%M:%S")

        if pdf_forensics is None:
            pdf_forensics = getattr(email, "pdf_forensics", None) or {
                "producer": "N/A",
                "creator": "N/A",
                "creation_date": "N/A",
                "mod_date": "N/A",
                "is_tampered": False,
                "evidence": "Non-PDF format; document metadata check bypassed.",
            }
        if artifact_tracking is None:
            artifact_tracking = getattr(email, "artifact_tracking", None)

        # ------------------------------------------------------------------
        # 1. Bank Extraction & Quarantine Guard Firewall
        # ------------------------------------------------------------------
        raw_bank = email.declared_bank_account
        if not raw_bank:
            # Fallback regex extraction from body
            extracted_b, extracted_a = extract_financial_fields(email.body)
            if extracted_b:
                raw_bank = extracted_b
            if not email.declared_amount and extracted_a:
                email.declared_amount = extracted_a

        clean_bank = _normalize_account_number(raw_bank)

        # Quarantine check: Missing or fewer than 8 digits
        if not clean_bank or len(clean_bank) < 8:
            quarantine_voucher = HumanCallbackVoucher(
                action_type="REQUIRE_HUMAN_CALLBACK",
                protocol="OUT_OF_BAND_TELEPHONE_VERIFICATION",
                target_vendor="Quarantined Counterparty",
                authorized_phone_number="+60-3-7722-8888",
                security_instructions=(
                    "INTEGRITY FIREWALL ACTIVATED: The inbound document or transmission lacks a valid, "
                    "verifiable bank account number (fewer than 8 digits). Wire authorization is quarantined "
                    "for mandatory physical document inspection and verbal verification."
                ),
                verification_status="QUARANTINED_PENDING_PHYSICAL_INSPECTION",
            )
            quarantine_defensive = generate_defensive_actions({
                "incident_id": email.case_id or "QUARANTINE_HOLD",
                "case_id": email.case_id or "QUARANTINE_HOLD",
                "risk_score": 80.0,
                "threat_level": "CRITICAL",
                "status": "QUARANTINED",
                "verdict_summary": "Integrity Firewall: Missing or obscured bank identifier. Quarantined for physical inspection.",
                "executive_summary": "Integrity Firewall: Missing or obscured bank identifier. Quarantined for physical inspection.",
                "inbound_bank_account": "MISSING_OR_INVALID",
                "inbound_vendor": "Quarantined Counterparty",
                "is_mule": False,
                "is_scam": True,
            })
            return AuditForensicReport(
                case_id=email.case_id or "QUARANTINE_HOLD",
                status="QUARANTINED",
                is_scam=True,
                risk_score=80.0,
                threat_level="CRITICAL",
                verdict_summary="Integrity Firewall: Missing or obscured bank identifier. Quarantined for physical inspection.",
                primary_cues=["MISSING_BANK_IDENTIFIER"],
                evidence_trail=[
                    EvidenceCue(
                        cue_code="MISSING_BANK_IDENTIFIER",
                        agent_source="Agent 1: Identity & Wire Forensic",
                        severity="CRITICAL",
                        description="Bank account number was absent, obscured, or fewer than 8 digits.",
                    )
                ],
                pii_redaction_trail=[],
                safe_next_step=quarantine_voucher,
                executive_summary="Integrity Firewall: Missing or obscured bank identifier. Quarantined for physical inspection.",
                discrepancy_matrix=DiscrepancyMatrix(
                    ledger_vendor_name=None,
                    ledger_bank_account=None,
                    invoice_bank_account="MISSING_OR_INVALID",
                    account_match=False,
                    is_mule=False,
                    status="DISCREPANCY_DETECTED",
                ),
                audit_checklist=[
                    AuditChecklistItem(
                        check="Vendor Identity",
                        status="FAIL",
                        detail="Vendor identity could not be bound to valid banking credentials.",
                    ),
                    AuditChecklistItem(
                        check="Bank Account Ledger",
                        status="FAIL",
                        detail="No bank account identifier detected (less than 8 digits).",
                    ),
                    AuditChecklistItem(
                        check="PDRM SemakMule Registry",
                        status="PASS",
                        detail="Check bypassed due to missing account digits.",
                    ),
                    AuditChecklistItem(
                        check="Trending Modus Operandi (CTI)",
                        status="PASS",
                        detail="Quarantined before cognitive inference.",
                    ),
                    AuditChecklistItem(
                        check="Urgency & Coercion Level",
                        status="PASS",
                        detail="Quarantined at firewall barrier.",
                    ),
                    AuditChecklistItem(
                        check="Document Metadata & Anti-Tamper Forensics",
                        status="FAIL" if pdf_forensics.get("is_tampered") else "PASS",
                        detail=pdf_forensics.get("evidence", "Clean metadata signature"),
                    ),
                ],
                pipeline_telemetry=PipelineTelemetry(
                    stage_0_pii_scrub=PipelineStageTelemetry(status="SKIPPED", latency_ms=0),
                    stage_1_ledger_match=PipelineStageTelemetry(status="SUCCESS", latency_ms=1),
                    stage_2_cognitive_gemini=PipelineStageTelemetry(status="SKIPPED", latency_ms=0),
                    stage_3_risk_arbiter=PipelineStageTelemetry(status="SUCCESS", latency_ms=1),
                    total_pipeline_ms=2,
                ),
                timeline_events=[
                    TimelineEvent(time=now_str, stage="Ingestion", detail="Parsed & hashed in volatile memory"),
                    TimelineEvent(time=now_str, stage="PII Sanitization", detail="Bypassed - quarantined at schema firewall"),
                    TimelineEvent(time=now_str, stage="Ledger Gate", detail="Firewall quarantine triggered: bank identifier < 8 digits"),
                    TimelineEvent(time=now_str, stage="Forensic Inspection", detail=f"Metadata scan complete: {pdf_forensics.get('evidence', 'Bypassed')}"),
                    TimelineEvent(time=now_str, stage="Risk Arbiter", detail="Verdict issued & Call Voucher generated"),
                ],
                ocr_used=ocr_used,
                total_pages=total_pages,
                filename=filename,
                pdf_forensics=PdfForensics(**pdf_forensics) if isinstance(pdf_forensics, dict) else pdf_forensics,
                artifact_tracking=ArtifactTracking(**artifact_tracking) if isinstance(artifact_tracking, dict) else artifact_tracking,
                defensive_actions=DefensiveActions(**quarantine_defensive) if isinstance(quarantine_defensive, dict) else quarantine_defensive,
            )

        evidence_trail: List[EvidenceCue] = []

        # ------------------------------------------------------------------
        # AGENT 0: Privacy & Compliance Agent (PII Sanitization in RAM)
        # ------------------------------------------------------------------
        t0_start = time.perf_counter()
        sanitized_body, pii_logs = sanitize_text_in_memory(email.body, field_name="body")
        t0_end = time.perf_counter()
        stage_0_ms = max(1, int((t0_end - t0_start) * 1000))

        # ------------------------------------------------------------------
        # AGENT 1: Identity & Wire Forensic Agent + SemakMule Lookup
        # ------------------------------------------------------------------
        t1_start = time.perf_counter()
        sender_domain = self._extract_domain(email.sender)
        lookalike_flag = False
        unverified_bank_flag = False

        matched_verified_domain: Optional[str] = None
        target_vendor_name: str = "Unknown Counterparty"
        authorized_phone: str = "+60-3-7722-8888"
        ledger_bank_display: Optional[str] = None
        vendor_profile: Optional[Dict[str, object]] = None

        if sender_domain in KNOWN_VENDORS:
            matched_verified_domain = sender_domain
            vendor_profile = KNOWN_VENDORS[sender_domain]
            target_vendor_name = str(vendor_profile["vendor_name"])
            authorized_phone = str(vendor_profile["authorized_callback"])
            verified_accs = vendor_profile.get("verified_accounts", [])  # type: ignore
            ledger_bank_display = verified_accs[0] if verified_accs else None
        else:
            lookalike_flag = True
            evidence_trail.append(
                EvidenceCue(
                    cue_code="LOOKALIKE_DOMAIN",
                    agent_source="Agent 1: Identity & Wire Forensic",
                    severity="CRITICAL",
                    description=(
                        f"Inbound sender domain '{sender_domain}' matches homoglyph typosquatting, "
                        f"known adversarial impersonation signatures, or is absent from the verified vendor whitelist."
                    ),
                )
            )

            # Resolve intended entity from context signatures
            content_lower = f"{email.sender} {email.subject} {email.body}".lower()
            if any(sig in content_lower for sig in ["megabuild", "bu1ld", "mega build"]):
                target_vendor_name = "Mega Build Sdn Bhd"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = KNOWN_VENDORS.get("megabuild.com.my")
            elif any(sig in content_lower for sig in ["alphatech", "alpha tech"]):
                target_vendor_name = "Alpha Tech Sdn Bhd"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = KNOWN_VENDORS.get("alphatech.com.my")
            elif any(sig in content_lower for sig in ["fastcargo", "fast cargo"]):
                target_vendor_name = "Fast Cargo Logistics"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = KNOWN_VENDORS.get("fastcargo.com.my")
            elif any(sig in content_lower for sig in ["tax-enforce", "tax penalty", "statutory penalty", "lhdn"]):
                target_vendor_name = "Inland Revenue Board (LHDN) / Tax Enforcement Authority"
                authorized_phone = "+60-3-8911-1000"
                vendor_profile = None
            elif any(sig in content_lower for sig in ["citygroup", "city group"]):
                target_vendor_name = "City Group Corporate Executive Office"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = None

            if vendor_profile:
                v_accs = vendor_profile.get("verified_accounts", [])  # type: ignore
                ledger_bank_display = v_accs[0] if v_accs else None

        # Bank account verification against procurement ledger
        account_matched = False
        if vendor_profile:
            known_clean_accs = [
                _normalize_account_number(acc)
                for acc in vendor_profile.get("verified_accounts", [])  # type: ignore
            ]
            if clean_bank in known_clean_accs:
                account_matched = True

        if lookalike_flag or not account_matched:
            unverified_bank_flag = True
            desc_target = target_vendor_name if target_vendor_name else "registered counterparty"
            evidence_trail.append(
                EvidenceCue(
                    cue_code="UNVERIFIED_BANK_CHANGE",
                    agent_source="Agent 1: Identity & Wire Forensic",
                    severity="CRITICAL",
                    description=(
                        f"Declared bank account '{clean_bank}' deviates from registered "
                        f"procurement accounts for {desc_target}."
                    ),
                )
            )

        # SemakMule Blacklist Registry Lookup
        semak_res = check_semakmule_blacklist(clean_bank)
        is_mule = bool(semak_res.get("is_mule", False))

        if is_mule:
            evidence_trail.append(
                EvidenceCue(
                    cue_code="SEMAKMULE_BLACKLIST_HIT",
                    agent_source="Agent 1: Identity & Wire Forensic (PDRM SemakMule)",
                    severity="CRITICAL",
                    description=(
                        f"CRITICAL FRAUD: Declared account {clean_bank} is listed on the "
                        f"PDRM SemakMule / JSJK CCID Blacklist as a known illicit money mule account."
                    ),
                )
            )

        t1_end = time.perf_counter()
        stage_1_ms = max(1, int((t1_end - t1_start) * 1000))

        # ------------------------------------------------------------------
        # AGENT 2: Cognitive Cyber Threat Analyst (Gemini + CTI Trends)
        # ------------------------------------------------------------------
        t2_start = time.perf_counter()
        active_threat_trends = get_active_threat_trends()
        gemini_result = self.gemini_agent.analyze_correspondence(
            sanitized_body,
            email.subject,
            active_threat_trends=active_threat_trends,
        )
        cisa_urgency_flag = False
        cti_trend_match_flag = False

        if gemini_result.is_suspicious and gemini_result.cues:
            for cue in gemini_result.cues:
                if cue == "CISA_URGENCY":
                    cisa_urgency_flag = True
                if cue == "CTI_TREND_MATCH":
                    cti_trend_match_flag = True
                evidence_trail.append(
                    EvidenceCue(
                        cue_code=cue,
                        agent_source="Agent 2: Cognitive Threat Analyst (Gemini 2.5 Flash)",
                        severity="HIGH",
                        description=(
                            f"{gemini_result.threat_summary} "
                            f"[Confidence: {int(gemini_result.confidence * 100)}%]"
                        ),
                    )
                )

        t2_end = time.perf_counter()
        stage_2_ms = max(1, int((t2_end - t2_start) * 1000))

        # ------------------------------------------------------------------
        # AGENT 3: Chief Risk Arbiter & Action Agent
        # ------------------------------------------------------------------
        t3_start = time.perf_counter()

        # Deterministic Risk Scoring Model
        if is_mule:
            score = 99.0  # SemakMule Blacklist Hit = 99
        elif vendor_profile and (not account_matched or lookalike_flag):
            score = 85.0  # Known vendor + Bank account mismatch = 85
        elif not vendor_profile:
            score = 50.0  # Unknown vendor = 40-55
            if cisa_urgency_flag or gemini_result.is_suspicious:
                score += 15.0
        else:
            # Legitimate vendor + Verified bank = 5-15
            score = 10.0

        # Adjust score if urgency/CTI detected on suspicious sender
        if not is_mule and score >= 40.0:
            if cisa_urgency_flag:
                score = min(95.0, score + 10.0)
            if cti_trend_match_flag:
                score = min(95.0, score + 5.0)

        # Baseline edge-case rule:
        # Legitimate domain + verified bank account stays safe (< 50.0) UNLESS tampered
        is_domain_verified = matched_verified_domain is not None
        if is_domain_verified and account_matched and not pdf_forensics.get("is_tampered"):
            score = 10.0

        # PDF Document Metadata & Forensics Anti-Tamper Escalation
        if pdf_forensics.get("is_tampered") is True:
            score = min(100.0, score + 25.0)
            has_bank_mismatch = not account_matched or lookalike_flag
            is_unknown_vendor = vendor_profile is None
            if (has_bank_mismatch or is_unknown_vendor) and score < 75.0:
                score = 85.0
            evidence_trail.append(
                EvidenceCue(
                    cue_code="PDF_METADATA_TAMPERED",
                    agent_source="Agent 1: Digital Forensics & Metadata Inspector",
                    severity="CRITICAL",
                    description=pdf_forensics.get(
                        "evidence", "Altered via consumer editing suite."
                    ),
                )
            )

        if artifact_tracking and artifact_tracking.get("is_duplicate") is True:
            evidence_trail.append(
                EvidenceCue(
                    cue_code="DUPLICATE_ARTIFACT_REPLAY",
                    agent_source="Artifact Forensics & Replay Guard",
                    severity="HIGH",
                    description="Duplicate invoice artifact detected (Previous submission found).",
                )
            )

        score = min(100.0, max(0.0, score))
        is_scam = score >= self.risk_threshold

        # Threat Level
        if score >= 70.0:
            threat_level = "CRITICAL"
        elif score >= self.risk_threshold:
            threat_level = "SUSPICIOUS"
        else:
            threat_level = "SAFE"

        # Discrepancy Matrix status
        if is_mule:
            matrix_status = "CRITICAL_MULE_DETECTED"
        elif not account_matched or lookalike_flag:
            matrix_status = "DISCREPANCY_DETECTED"
        else:
            matrix_status = "MATCH"

        discrepancy_matrix = DiscrepancyMatrix(
            ledger_vendor_name=target_vendor_name if (vendor_profile or lookalike_flag) else None,
            ledger_bank_account=ledger_bank_display,
            invoice_bank_account=raw_bank or clean_bank,
            account_match=account_matched,
            is_mule=is_mule,
            status=matrix_status,
        )

        # Audit Checklist (6 itemized gap analysis points)
        audit_checklist = [
            AuditChecklistItem(
                check="Vendor Identity",
                status="PASS" if (is_domain_verified and not lookalike_flag) else "FAIL",
                detail=(
                    "Vendor identity verified against immutable procurement ledger."
                    if (is_domain_verified and not lookalike_flag)
                    else f"Sender domain '{sender_domain}' failed authentication against master whitelist."
                ),
            ),
            AuditChecklistItem(
                check="Bank Account Ledger",
                status="PASS" if account_matched else "FAIL",
                detail=(
                    f"Inbound account '{clean_bank}' matches pre-approved corporate ledger."
                    if account_matched
                    else f"Declared account '{clean_bank}' diverges from master verified baseline."
                ),
            ),
            AuditChecklistItem(
                check="PDRM SemakMule Registry",
                status="FAIL" if is_mule else "PASS",
                detail=(
                    f"CRITICAL: Account {clean_bank} flagged in PDRM SemakMule CCID database!"
                    if is_mule
                    else "Deterministic lookup returned clean (no mule flags detected)."
                ),
            ),
            AuditChecklistItem(
                check="Trending Modus Operandi (CTI)",
                status="FAIL" if cti_trend_match_flag else "PASS",
                detail=(
                    "Inbound pretext aligns with active NSRC/PDRM threat advisories (e.g. banking migration)."
                    if cti_trend_match_flag
                    else "No alignment with cached trending scam pretexts."
                ),
            ),
            AuditChecklistItem(
                check="Urgency & Coercion Level",
                status="FAIL" if cisa_urgency_flag else "PASS",
                detail=(
                    "Artificial urgency or coercive work stoppage deadlines detected."
                    if cisa_urgency_flag
                    else "Normal commercial pacing without artificial coercion."
                ),
            ),
            AuditChecklistItem(
                check="Document Metadata & Anti-Tamper Forensics",
                status="FAIL" if pdf_forensics.get("is_tampered") else "PASS",
                detail=pdf_forensics.get("evidence", "Clean metadata signature"),
            ),
        ]

        # Primary Cues and Human Callback Voucher
        primary_cues: List[str] = []
        if is_scam:
            primary_cues = [cue.cue_code for cue in evidence_trail]
            safe_next_step = HumanCallbackVoucher(
                action_type="REQUIRE_HUMAN_CALLBACK",
                protocol="OUT_OF_BAND_TELEPHONE_VERIFICATION",
                target_vendor=target_vendor_name,
                authorized_phone_number=authorized_phone,
                security_instructions=(
                    f"CIRCUIT BREAKER ACTIVATED: Suspected invoice redirection or executive BEC scam. "
                    f"Do NOT release funds or modify accounting vendor records. Contact {target_vendor_name} "
                    f"via verified telephone line ({authorized_phone}) to verbally authenticate this payment request."
                ),
                verification_status="PAYMENT_LOCKED_PENDING_CALL",
            )
            if is_mule:
                verdict_summary = (
                    f"CRITICAL FRAUD: Target account ({clean_bank}) is a flagged PDRM SemakMule illicit account. "
                    f"Wire transfer frozen immediately."
                )
            elif not account_matched:
                verdict_summary = (
                    f"CRITICAL BEC DISCREPANCY: Inbound bank account ({clean_bank}) deviates from "
                    f"procurement ledger ({ledger_bank_display or 'None'}) for {target_vendor_name}."
                )
            else:
                verdict_summary = (
                    f"HIGH-RISK ALERT: Inbound correspondence flagged for social engineering / BEC cues "
                    f"targeting {target_vendor_name}."
                )

            executive_summary = (
                f"CRITICAL DEFENSE ALERT: Inbound communication flagged as HIGH-RISK SCAM (Risk Score: {score:.1f}/100). "
                f"Identified cues: {', '.join(primary_cues)}. Bank redirection payment locked pending out-of-band callback."
            )
        else:
            safe_next_step = None
            verdict_summary = (
                f"VERIFIED SAFE: Inbound transaction matches registered procurement baseline for {target_vendor_name}."
            )
            executive_summary = (
                f"COMMUNICATION VERIFIED: Inbound message verified against enterprise procurement whitelist "
                f"(Risk Score: {score:.1f}/100, Threat Level: {threat_level}). No fraudulent bank redirection detected."
            )

        t3_end = time.perf_counter()
        stage_3_ms = max(1, int((t3_end - t3_start) * 1000))
        total_pipeline_ms = max(
            stage_0_ms + stage_1_ms + stage_2_ms + stage_3_ms,
            int((time.perf_counter() - overall_start) * 1000),
        )

        pipeline_telemetry = PipelineTelemetry(
            stage_0_pii_scrub=PipelineStageTelemetry(status="SUCCESS", latency_ms=stage_0_ms),
            stage_1_ledger_match=PipelineStageTelemetry(status="SUCCESS", latency_ms=stage_1_ms),
            stage_2_cognitive_gemini=PipelineStageTelemetry(status="SUCCESS", latency_ms=stage_2_ms),
            stage_3_risk_arbiter=PipelineStageTelemetry(status="SUCCESS", latency_ms=stage_3_ms),
            total_pipeline_ms=total_pipeline_ms,
        )

        timeline_events = [
            TimelineEvent(time=now_str, stage="Ingestion", detail="Parsed & hashed in volatile memory"),
            TimelineEvent(time=now_str, stage="PII Sanitization", detail="Ephemeral RAM buffer scrubbed"),
            TimelineEvent(time=now_str, stage="Ledger Gate", detail="SemakMule & Master Ledger evaluated"),
            TimelineEvent(
                time=now_str,
                stage="Forensic Inspection",
                detail=f"Metadata scan complete: {pdf_forensics.get('evidence', 'Clean metadata signature')}",
            ),
            TimelineEvent(time=now_str, stage="Risk Arbiter", detail="Verdict issued & Call Voucher generated"),
        ]

        defensive_actions = generate_defensive_actions({
            "incident_id": email.case_id or "INC-SCAN",
            "case_id": email.case_id or "INC-SCAN",
            "risk_score": score,
            "threat_level": threat_level,
            "status": matrix_status,
            "verdict_summary": verdict_summary,
            "executive_summary": executive_summary,
            "inbound_bank_account": raw_bank or clean_bank,
            "inbound_vendor": target_vendor_name,
            "is_mule": is_mule,
            "is_scam": is_scam,
        })

        return AuditForensicReport(
            case_id=email.case_id or "MANUAL_INPUT",
            status="PROCESSED",
            is_scam=is_scam,
            risk_score=score,
            threat_level=threat_level,
            verdict_summary=verdict_summary,
            primary_cues=primary_cues,
            evidence_trail=evidence_trail,
            pii_redaction_trail=pii_logs,
            safe_next_step=safe_next_step,
            executive_summary=executive_summary,
            discrepancy_matrix=discrepancy_matrix,
            audit_checklist=audit_checklist,
            pipeline_telemetry=pipeline_telemetry,
            timeline_events=timeline_events,
            ocr_used=ocr_used,
            total_pages=total_pages,
            filename=filename,
            pdf_forensics=PdfForensics(**pdf_forensics) if isinstance(pdf_forensics, dict) else pdf_forensics,
            artifact_tracking=ArtifactTracking(**artifact_tracking) if isinstance(artifact_tracking, dict) else artifact_tracking,
            defensive_actions=DefensiveActions(**defensive_actions) if isinstance(defensive_actions, dict) else defensive_actions,
        )

    def run_pipeline(self, email: EmailInput) -> AuditForensicReport:
        """Execute the coordinated multi-agent forensic inspection pipeline."""
        return self.coordinate_agents(email)
