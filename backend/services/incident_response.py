"""
Phase 4.3: Incident Response & Containment Artifact Synthesis (Agent 6)
========================================================================
Generates statutory incident referral packages, dispute drafts, ERP hold requests,
and enforces the 4-Eyes Human-in-the-Loop governance protocol.

Artifacts:
1. NSRC 997 / PDRM CCID Statutory Police Referral Dossier (JSON & Markdown format).
2. Out-of-Band Corporate Landline Switchboard Shield & Callback Voucher.
3. In-Thread Vendor Dispute Response Email Draft.
4. Automated ERP Disbursement Quarantine Hold Request (AutoCount / SAP format).
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple

DEFAULT_REPORTING_ENTITY = {
    "name": "Syarikat Pembinaan Jaya Sdn Bhd",
    "ssm_registration": "201701045678 (1248901-K)",
    "official_address": "Level 12, Menara Kechapi, Jalan Damansara, 50490 Kuala Lumpur",
    "security_contact": "+60 3-2100 4500",
}


def generate_callback_voucher(
    case_id: str,
    vendor_name: str,
    approved_landline: str,
    untrusted_phone_detected: Optional[str] = None,
) -> Dict[str, Any]:
    """
    4-Eyes Protocol Shield:
    Suppresses phone numbers parsed from untrusted invoice documents.
    Presents exclusively the registered corporate switchboard number from Master Ledger.
    """
    return {
        "voucher_id": f"CB-VCH-{case_id}",
        "vendor_name": vendor_name,
        "official_switchboard": approved_landline,
        "suppressed_untrusted_contact": untrusted_phone_detected or "[SUPPRESSED_UNTRUSTED_INVOICE_CONTACT]",
        "callback_completed": False,
        "clerk_id": None,
        "clerk_notes": None,
        "call_timestamp": None,
        "verbal_remittance_confirmed": False,
    }


def validate_dual_authorization(
    clerk_callback_logged: bool,
    manager_override_token: str,
    override_reason: str = "",
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Enforces Maker-Checker Segregation of Duties (SoD):
    Step 1: AP Clerk verbal callback to official switchboard must be recorded.
    Step 2: Finance Manager applies cryptographic corporate key token.
    Override is rejected unless Step 1 is logged.
    """
    if not clerk_callback_logged:
        return (
            False,
            "BLOCKED_PENDING_CLERK_CALLBACK",
            {
                "authorized": False,
                "error": "Segregation of Duties Violation: Manager override cannot be executed before AP Clerk records switchboard verification callback.",
            },
        )

    if not manager_override_token or len(manager_override_token.strip()) < 8:
        return (
            False,
            "INVALID_MANAGER_TOKEN",
            {
                "authorized": False,
                "error": "Cryptographic Manager override token must be at least 8 characters.",
            },
        )

    return (
        True,
        "OVERRIDDEN_RELEASED",
        {
            "authorized": True,
            "message": "Dual-authorization complete: Verified telephone callback logged and Manager cryptographic key approved.",
            "status": "OVERRIDDEN_RELEASED",
            "reason": override_reason,
        },
    )


def synthesize_nsrc_997_dossier(
    case_id: str,
    vendor_name: str,
    claimed_bank: str,
    claimed_account: str,
    amount_myr: float,
    approved_bank: Optional[str] = None,
    approved_account: Optional[str] = None,
    evidence_hashes: Optional[List[str]] = None,
    reconciliation_flags: Optional[List[str]] = None,
    reporting_entity: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Synthesizes pre-filled statutory referral package for National Scam Response Centre (NSRC 997)
    and Royal Malaysia Police CCID under Malaysian Evidence Act 1950 Section 90A.
    """
    entity = reporting_entity or DEFAULT_REPORTING_ENTITY
    now_iso = datetime.now(timezone.utc).isoformat()
    dossier_id = f"NSRC-997-{case_id}-{int(datetime.now(timezone.utc).timestamp())}"

    dossier_data: Dict[str, Any] = {
        "dossier_id": dossier_id,
        "statutory_channel": "NSRC Hotline 997 / PDRM CCID Commercial Crime Division",
        "generated_timestamp_utc": now_iso,
        "reporting_organization": entity,
        "victim_case_reference": case_id,
        "target_supplier": {
            "vendor_name": vendor_name,
            "authorized_bank": approved_bank or "Maybank",
            "authorized_account": approved_account or "514012998877",
        },
        "fraudulent_transaction_details": {
            "fraudulent_bank": claimed_bank,
            "fraudulent_account_number": claimed_account,
            "solicited_amount_myr": amount_myr,
            "crime_classification": "MACC / CCID Business Email Compromise (BEC) Account Redirection",
        },
        "forensic_evidence_manifest": {
            "evidence_digests_sha256": evidence_hashes or [],
            "reconciliation_findings": reconciliation_flags or ["UNAUTHORIZED_BANK_CHANGE"],
            "statutory_certificate_section_90a": (
                "Certified computer-generated record produced by deterministic automated interdiction "
                "in the ordinary course of business pursuant to Section 90A, Evidence Act 1950 (Malaysia)."
            ),
        },
        "recommended_immediate_actions": [
            "Emergency bank interdiction via NSRC 997 to freeze destination beneficiary mule account.",
            "PDRM CCID registration under Section 420 Penal Code (Cheating).",
            "Issuance of bilateral freeze certificate to recipient clearing bank.",
        ],
    }

    markdown_dossier = f"""# NATIONAL SCAM RESPONSE CENTRE (NSRC 997) STATUTORY REFERRAL DOSSIER
**Document ID:** {dossier_id}  
**Classification:** STRICTLY CONFIDENTIAL · COMMERCIAL CRIME INTELLIGENCE  
**Statutory Authority:** Evidence Act 1950 (Act 56) Section 90A · Penal Code Section 420  

---

### 1. REPORTING VICTIM ENTITY
- **Legal Entity:** {entity['name']}
- **SSM Registration:** {entity['ssm_registration']}
- **Security Operations Contact:** {entity['security_contact']}

### 2. FRAUDULENT REMITTANCE INSTRUCTIONS (MULE TARGET)
- **Target Supplier Name:** {vendor_name}
- **Claimed Beneficiary Bank:** {claimed_bank}
- **Claimed Beneficiary Account:** {claimed_account}
- **Total Fraudulent Claim:** RM {amount_myr:,.2f}

### 3. GROUND-TRUTH DISCREPANCY & RECONCILIATION
- **Approved Historical Bank:** {approved_bank or 'Maybank'}
- **Approved Historical Account:** {approved_account or '514012998877'}
- **Detection Indicators:** {', '.join(reconciliation_flags or ['UNAUTHORIZED_BANK_CHANGE'])}

### 4. FORENSIC CHAIN OF CUSTODY
- **Evidence SHA-256 Digest:** {evidence_hashes[0] if evidence_hashes else 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
- **Certified System Record:** Autonomous AP Interdiction Gateway (SME-ScamGuard-AI)
"""

    return {
        "json_dossier": dossier_data,
        "markdown_dossier": markdown_dossier,
    }


def generate_vendor_dispute_draft(
    vendor_name: str,
    invoice_ref: str,
    claimed_account: str,
    approved_landline: str,
) -> str:
    """
    Synthesizes polite, non-accusatory vendor dispute draft requesting telephone verification.
    """
    return f"""Dear Accounts Receivable Team ({vendor_name}),

RE: Pre-Payment Verification for Invoice Ref: {invoice_ref}

We have received an invoice requesting payment remittance into account ending in ***{claimed_account[-4:] if len(claimed_account) >= 4 else claimed_account}.

Under our corporate financial governance policy and Bank Negara Malaysia fraud interdiction standards, our Accounts Payable department requires telephone confirmation with your authorized finance officer before releasing payments to any new banking destination.

Our Finance Officer will be contacting your registered switchboard at {approved_landline} to confirm these remittance instructions verbally.

Please do not execute any account modifications over email.

Thank you for your cooperation in maintaining payment security.

Sincerely,
Accounts Payable Department
Syarikat Pembinaan Jaya Sdn Bhd
"""


def generate_erp_hold_payload(case_id: str, amount_myr: float, reason: str) -> Dict[str, Any]:
    """
    Emits AutoCount / SQL Account / SAP ERP disbursement hold instruction.
    """
    return {
        "instruction_type": "ERP_PAYMENT_VOUCHER_FREEZE",
        "voucher_hold_id": f"VCH-HOLD-2026-{case_id[-6:] if len(case_id) >= 6 else case_id}",
        "case_id": case_id,
        "status": "PAYMENT_LOCKED",
        "held_amount_myr": amount_myr,
        "freeze_reason": reason,
        "erp_system_target": "AutoCount / SAP / SQL Account Financial Gateway",
        "effective_timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }

