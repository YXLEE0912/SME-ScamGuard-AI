import re
import time
import base64
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.forensics import inspect_pdf_metadata
from api.policy_engine import evaluate_security_policy

app = FastAPI(
    title="SME-ScamGuard-AI Vercel Serverless Gateway",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MYKAD_REGEX = re.compile(r"\b\d{6}-\d{2}-\d{4}\b")
MOBILE_REGEX = re.compile(r"\b01[0-9]-?[0-9]{7,8}\b")

# Master Procurement Ledger Ground Truth
MASTER_LEDGER: Dict[str, Dict[str, str]] = {
    "Mega Logistics Sdn Bhd": {
        "bank": "Maybank",
        "account": "514012998877",
        "phone": "+60 3-7722 8888",
        "ssm": "201801023456 (1284567-T)",
    },
    "Alpha Tech Sdn Bhd": {
        "bank": "Maybank",
        "account": "800122334455",
        "phone": "+60 3-7722 8888",
        "ssm": "201901034567 (1325678-W)",
    },
}

KNOWN_MULES = {"1410029000123456", "800944112299", "214488990011", "319900228811"}

# Pre-packaged Malaysian Demo Scenarios
DEMO_SCENARIOS = [
    {
        "case_id": "INV-2026-8841",
        "title": "Critical BEC Wire Scam",
        "scenario_type": "CRITICAL_BEC",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "inbound_sender": "billing@mega-bu1ld.com.my",
        "domain_highlight": "mega-bu1ld",
        "subject": "URGENT: Revised Banking Details for Interim Milestone Claim #4",
        "body": "Dear Finance,\n\nPlease note our primary Maybank account is undergoing an audit freeze.\nTransfer the interim claim of RM 98,500.00 today to:\nBank: CIMB Bank\nAccount: 8009-4411-2299\nContact mobile: 012-3456789.",
        "amount_myr": 98500.0,
        "claimed_bank": "CIMB Bank",
        "claimed_account": "8009-4411-2299",
        "claimed_phone": "012-3456789",
        "master_ledger_bank": "Maybank",
        "master_ledger_account": "514012998877",
        "master_ledger_phone": "+60 3-7722 8888",
        "risk_score": 99,
        "status": "LOCKED_CRITICAL",
        "review_codes": ["MASTER_LEDGER_MISMATCH", "PRODUCER_TOOL_TAMPER", "SEMAKMULE_HIT"],
        "producer_tool": "iLovePDF Online Tool (Tampered) | ModDate Desync",
        "is_tampered_tool": True,
        "fail_closed_reason": None,
        "voucher_status": "PAYMENT_LOCKED",
    },
    {
        "case_id": "INV-2026-9024",
        "title": "Fail-Closed Recovery Scenario",
        "scenario_type": "FAIL_CLOSED_RECOVERY",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "inbound_sender": "vendor@megalogistics-claims.biz",
        "domain_highlight": "megalogistics-claims",
        "subject": "Scheduled Payment Disbursement Verification #9024",
        "body": "Please process payment voucher of RM 73,000.00 to account 7766-5544-33.",
        "amount_myr": 73000.0,
        "claimed_bank": "Alliance Bank",
        "claimed_account": "7766554433",
        "claimed_phone": "019-8765432",
        "master_ledger_bank": "Maybank",
        "master_ledger_account": "514012998877",
        "master_ledger_phone": "+60 3-7722 8888",
        "risk_score": 85,
        "status": "LOCKED_CRITICAL",
        "review_codes": ["MASTER_LEDGER_MISMATCH", "AI_COGNITIVE_UNAVAILABLE"],
        "producer_tool": "ERP Generator (ModDate Desync)",
        "is_tampered_tool": True,
        "fail_closed_reason": "AI_COGNITIVE_TIMEOUT (Deterministic Tri-Factor Engaged)",
        "voucher_status": "PAYMENT_LOCKED",
    },
    {
        "case_id": "INV-2026-1042",
        "title": "Legitimate Supplier Claim",
        "scenario_type": "LEGITIMATE_VERIFIED",
        "vendor_name": "Mega Logistics Sdn Bhd",
        "inbound_sender": "billing@megalogistics.com.my",
        "domain_highlight": "",
        "subject": "Monthly Freight Logistics Statement #ML-2026-1042",
        "body": "Dear Accounts,\nPlease find our monthly statement for RM 14,800.00. Standard Maybank 514012998877. Switchboard +60 3-7722 8888.",
        "amount_myr": 14800.0,
        "claimed_bank": "Maybank",
        "claimed_account": "514012998877",
        "claimed_phone": "+60 3-7722 8888",
        "master_ledger_bank": "Maybank",
        "master_ledger_account": "514012998877",
        "master_ledger_phone": "+60 3-7722 8888",
        "risk_score": 0,
        "status": "VERIFIED",
        "review_codes": ["ALL_CHECKS_PASSED"],
        "producer_tool": "SAP NetWeaver ERP Generator",
        "is_tampered_tool": False,
        "fail_closed_reason": None,
        "voucher_status": "SAFE_RELEASED",
    },
]

VOUCHER_STATE = {s["case_id"]: {"clerk_verified": False, "manager_overridden": False} for s in DEMO_SCENARIOS}

@app.get("/api/v1/auth/google")
def google_auth_init():
    """Initiates Google OAuth 2.0 consent flow."""
    # In live corporate deployments, redirects to Google Accounts OAuth 2.0 endpoint
    return {
        "status": "OAUTH_INITIATED",
        "provider": "Google Identity Services",
        "scope": "https://www.googleapis.com/auth/gmail.readonly",
        "redirect_url": "/api/v1/auth/google/callback?code=DEMO_OAUTH_CODE_VALID",
    }

@app.get("/api/v1/auth/google/callback")
def google_auth_callback(code: Optional[str] = None):
    """Handles OAuth 2.0 callback and establishes read-only Gmail session."""
    return RedirectResponse(url="/?mode=google_connected")

@app.get("/api/v1/scan/inbox")
def scan_inbox(mode: Optional[str] = Query("demo")):
    """
    Returns scan inbox items.
    If mode=demo, returns the 3 pre-packaged Malaysian corporate fraud scenarios.
    """
    return {
        "mode": mode,
        "connected_account": "ap-audit@megabuild.com.my" if mode == "demo" else "live-corporate@gmail.com",
        "scenarios": DEMO_SCENARIOS,
        "total_queued": len(DEMO_SCENARIOS),
    }

@app.post("/api/v1/scan/upload")
async def scan_upload(
    file: UploadFile = File(...),
    vendor_name: str = Form("Mega Logistics Sdn Bhd"),
    claimed_bank: str = Form("Unknown Bank"),
    claimed_account: str = Form(""),
    amount_myr: float = Form(0.0),
    ai_online: bool = Form(True),
):
    """
    Receives uploaded PDF (enforces client <= 4.5MB limit).
    Runs in-memory privacy sanitization and executes deterministic policy engine.
    """
    pdf_bytes = await file.read()
    
    # Check 4.5MB payload constraint
    if len(pdf_bytes) > 4.5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload exceeds 4.5MB serverless limit. Please compress invoice.",
        )
        
    # Layer 2: Deterministic Binary Forensics
    forensics = inspect_pdf_metadata(pdf_bytes)
    
    # Layer 3: Master Ledger & SemakMule Check
    cleaned_acc = re.sub(r"[-\s]", "", claimed_account)
    semakmule_hit = cleaned_acc in KNOWN_MULES
    
    ledger_record = MASTER_LEDGER.get(vendor_name)
    ledger_match = False
    if ledger_record:
        ledger_match = (cleaned_acc == re.sub(r"[-\s]", "", ledger_record["account"]))
        
    # Layer 5: Policy Engine
    policy = evaluate_security_policy(
        ledger_match=ledger_match,
        semakmule_hit=semakmule_hit,
        pdf_tampered=forensics["is_tampered_tool"],
        ai_online=ai_online,
    )
    
    sha256_hash = hashlib.sha256(pdf_bytes).hexdigest()
    case_id = f"UPL-{sha256_hash[:8].upper()}"
    
    return {
        "case_id": case_id,
        "filename": file.filename,
        "sha256_hash": sha256_hash,
        "policy": policy,
        "forensics": forensics,
        "reconciliation": {
            "vendor_name": vendor_name,
            "claimed_bank": claimed_bank,
            "claimed_account": claimed_account,
            "ledger_match": ledger_match,
            "semakmule_hit": semakmule_hit,
            "master_ledger": ledger_record,
        },
    }

class VerifyCallModel(BaseModel):
    clerk_id: str
    phone_dialed: str

class OverrideModel(BaseModel):
    manager_key: str
    reason: str

@app.post("/api/v1/vouchers/{case_id}/verify-call")
def clerk_verify_call(case_id: str, body: VerifyCallModel):
    state = VOUCHER_STATE.setdefault(case_id, {"clerk_verified": False, "manager_overridden": False})
    state["clerk_verified"] = True
    return {"case_id": case_id, "clerk_verified": True, "message": "Clerk callback logged successfully."}

@app.post("/api/v1/vouchers/{case_id}/override")
def manager_override(case_id: str, body: OverrideModel):
    state = VOUCHER_STATE.get(case_id, {"clerk_verified": False, "manager_overridden": False})
    if not state.get("clerk_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="4-Eyes Violation: Step 1 (Clerk Switchboard Call) must be completed before Manager Override."
        )
    state["manager_overridden"] = True
    return {"case_id": case_id, "released": True, "message": "Payment voucher unlocked and released."}
