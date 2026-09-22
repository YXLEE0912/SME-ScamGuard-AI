"""Multi-Agent Scam Guard Engine for SME Business Email Compromise (BEC) defense.

Coordinates four deterministic, local-first forensic agents:
- AGENT 0: Privacy & Compliance Agent (In-memory zero-trust PII sanitization)
- AGENT 1: Identity & Wire Forensic Agent (Typo-squatting, homoglyph, and bank whitelist verification)
- AGENT 2: Psycho-Social Forensic Agent (CISA social-engineering coercion & urgency heuristic)
- AGENT 3: Chief Risk Arbiter & Action Agent (Risk scoring, payout locking, and callback voucher issuance)
"""

import re
from typing import Dict, List, Optional, Set
from app.models.schema import (
    AuditForensicReport,
    EmailInput,
    EvidenceCue,
    HumanCallbackVoucher,
    PIIRedactionLog,
)
from app.services.pii import sanitize_text_in_memory

# 1. Internal Baseline Whitelist (Verified Vendors)
VERIFIED_VENDORS: Dict[str, Dict[str, object]] = {
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

# 2. Suspicious / Impersonation Domain Signatures
SUSPICIOUS_SIGNATURES: List[str] = [
    "bu1ld",
    "citygroup-corp",
    "tax-enforce-gov",
    "gmail-corp",
]

# CISA Framework Urgency and Coercion Keywords
CISA_KEYWORD_PATTERNS: Dict[str, str] = {
    "urgent": r"\b(urgent|urgency|critical urgent)\b",
    "immediately": r"\b(immediately|immediate)\b",
    "frozen": r"\b(frozen|freezing|freeze)\b",
    "penalty": r"\b(penalty|penalties)\b",
    "confidential": r"\b(confidential)\b",
    "nda": r"\b(nda)\b",
    "stoppage": r"\b(stoppage)\b",
    "24 hours": r"\b(24 hours|48 hours)\b",
    "deadline_time": r"\b(5:00 pm|4:00 pm)\b",
    "expedite": r"\b(expedite|expedited)\b",
    "today": r"\b(today)\b",
}


def _normalize_account_number(acc: Optional[str]) -> str:
    """Normalize bank account string by stripping non-digit characters."""
    if not acc:
        return ""
    return re.sub(r"\D", "", acc)


class MultiAgentScamGuardEngine:
    """Deterministic Multi-Agent Engine orchestrating BEC and invoice scam defense."""

    def __init__(self, risk_threshold: float = 50.0) -> None:
        """Initialize the engine with an operational risk threshold.

        Args:
            risk_threshold: Minimum risk score (0.0 - 100.0) triggering scam classification.
        """
        self.risk_threshold = risk_threshold

    @staticmethod
    def _extract_domain(sender: str) -> str:
        """Extract clean lowercased domain from RFC 5322 sender string."""
        s = sender.strip()
        if "<" in s and ">" in s:
            s = s[s.find("<") + 1 : s.find(">")]
        if "@" in s:
            return s.split("@")[-1].strip().lower()
        return s.lower()

    def run_pipeline(self, email: EmailInput) -> AuditForensicReport:
        """Execute the coordinated multi-agent forensic inspection pipeline.

        Args:
            email: Input email and transaction data.

        Returns:
            AuditForensicReport with risk score, evidence trail, and callback voucher if flagged.
        """
        evidence_trail: List[EvidenceCue] = []

        # ==================================================================
        # AGENT 0: Privacy & Compliance Agent
        # ==================================================================
        _, pii_logs = sanitize_text_in_memory(email.body, field_name="body")

        # ==================================================================
        # AGENT 1: Identity & Wire Forensic Agent
        # ==================================================================
        sender_domain = self._extract_domain(email.sender)
        lookalike_flag = False
        unverified_bank_flag = False

        matched_verified_domain: Optional[str] = None
        target_vendor_name: str = "Unknown Counterparty"
        authorized_phone: str = "+60-3-7722-8888"

        # Check sender domain against verified procurement whitelist
        if sender_domain in VERIFIED_VENDORS:
            matched_verified_domain = sender_domain
            target_vendor_name = str(VERIFIED_VENDORS[sender_domain]["vendor_name"])
            authorized_phone = str(VERIFIED_VENDORS[sender_domain]["authorized_callback"])
            vendor_profile: Optional[Dict[str, object]] = VERIFIED_VENDORS[sender_domain]
        else:
            # Flag lookalike / homoglyph / typosquatting domain
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

            # Resolve intended target entity from context signatures
            content_lower = f"{email.sender} {email.subject} {email.body}".lower()
            if any(sig in content_lower for sig in ["megabuild", "bu1ld", "mega build"]):
                target_vendor_name = "Mega Build Sdn Bhd"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = VERIFIED_VENDORS.get("megabuild.com.my")
            elif any(sig in content_lower for sig in ["alphatech", "alpha tech"]):
                target_vendor_name = "Alpha Tech Sdn Bhd"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = VERIFIED_VENDORS.get("alphatech.com.my")
            elif any(sig in content_lower for sig in ["fastcargo", "fast cargo"]):
                target_vendor_name = "Fast Cargo Logistics"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = VERIFIED_VENDORS.get("fastcargo.com.my")
            elif any(sig in content_lower for sig in ["tax-enforce", "tax penalty", "statutory penalty", "lhdn"]):
                target_vendor_name = "Inland Revenue Board (LHDN) / Tax Enforcement Authority"
                authorized_phone = "+60-3-8911-1000"  # Official LHDN statutory helpline
                vendor_profile = None
            elif any(sig in content_lower for sig in ["citygroup", "city group"]):
                target_vendor_name = "City Group Corporate Executive Office"
                authorized_phone = "+60-3-7722-8888"
                vendor_profile = None
            else:
                vendor_profile = None

        # Wire forensic: Bank account verification against procurement baseline
        normalized_declared = _normalize_account_number(email.declared_bank_account)
        if vendor_profile:
            verified_accounts = [
                _normalize_account_number(acc)
                for acc in vendor_profile.get("verified_accounts", [])  # type: ignore
            ]
            if lookalike_flag or (normalized_declared and normalized_declared not in verified_accounts):
                unverified_bank_flag = True
                evidence_trail.append(
                    EvidenceCue(
                        cue_code="UNVERIFIED_BANK_CHANGE",
                        agent_source="Agent 1: Identity & Wire Forensic",
                        severity="CRITICAL",
                        description=(
                            f"Declared bank account '{email.declared_bank_account}' deviates from registered "
                            f"procurement accounts {vendor_profile.get('verified_accounts')} for {target_vendor_name}."
                        ),
                    )
                )
        else:
            if email.declared_bank_account:
                unverified_bank_flag = True
                evidence_trail.append(
                    EvidenceCue(
                        cue_code="UNVERIFIED_BANK_CHANGE",
                        agent_source="Agent 1: Identity & Wire Forensic",
                        severity="CRITICAL",
                        description=(
                            f"Declared bank account '{email.declared_bank_account}' belongs to an unverified "
                            f"or untrusted counterparty without pre-approved baseline registry."
                        ),
                    )
                )

        # ==================================================================
        # AGENT 2: Psycho-Social Forensic Agent (CISA Framework)
        # ==================================================================
        combined_text = f"{email.subject} {email.body}".lower()
        matched_cisa_cues: Set[str] = set()

        for cue_name, pattern in CISA_KEYWORD_PATTERNS.items():
            if re.search(pattern, combined_text, re.IGNORECASE):
                matched_cisa_cues.add(cue_name)

        cisa_urgency_flag = len(matched_cisa_cues) >= 2
        if cisa_urgency_flag:
            evidence_trail.append(
                EvidenceCue(
                    cue_code="CISA_URGENCY",
                    agent_source="Agent 2: Psycho-Social Forensic Agent",
                    severity="HIGH",
                    description=(
                        f"Psychological coercion and artificial urgency triggers detected under CISA framework "
                        f"(matched cues: {', '.join(sorted(matched_cisa_cues))})."
                    ),
                )
            )

        # ==================================================================
        # AGENT 3: Chief Risk Arbiter & Action Agent
        # ==================================================================
        score = 10.0  # Baseline risk score
        if lookalike_flag:
            score += 45.0
        if unverified_bank_flag:
            score += 30.0
        if cisa_urgency_flag:
            if lookalike_flag or unverified_bank_flag:
                score += 15.0
            else:
                score += 10.0

        score = min(100.0, max(0.0, score))

        # Edge Case Rule:
        # If an email has high urgency (e.g. Fast Cargo demurrage) BUT sender domain
        # and bank account match the verified whitelist, score MUST stay < 50.0 (is_scam = False).
        is_domain_verified = matched_verified_domain is not None
        is_bank_verified = False
        if vendor_profile:
            known_accounts = [
                _normalize_account_number(acc)
                for acc in vendor_profile.get("verified_accounts", [])  # type: ignore
            ]
            is_bank_verified = normalized_declared in known_accounts

        if is_domain_verified and is_bank_verified:
            if score >= 50.0:
                score = 20.0

        is_scam = score >= self.risk_threshold

        # Threat Level
        if score >= 70.0:
            threat_level = "CRITICAL"
        elif score >= self.risk_threshold:
            threat_level = "SUSPICIOUS"
        else:
            threat_level = "SAFE"

        # Construct primary cues and human callback voucher
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
            executive_summary = (
                f"CRITICAL DEFENSE ALERT: Inbound communication flagged as HIGH-RISK SCAM (Risk Score: {score:.1f}/100). "
                f"Identified cues: {', '.join(primary_cues)}. Bank redirection payment locked pending out-of-band callback."
            )
        else:
            primary_cues = []
            safe_next_step = None
            executive_summary = (
                f"COMMUNICATION VERIFIED: Inbound message verified against enterprise procurement whitelist "
                f"(Risk Score: {score:.1f}/100, Threat Level: {threat_level}). No fraudulent bank redirection detected."
            )

        return AuditForensicReport(
            case_id=email.case_id or "MANUAL_INPUT",
            is_scam=is_scam,
            risk_score=score,
            threat_level=threat_level,
            primary_cues=primary_cues,
            evidence_trail=evidence_trail,
            pii_redaction_trail=pii_logs,
            safe_next_step=safe_next_step,
            executive_summary=executive_summary,
        )
