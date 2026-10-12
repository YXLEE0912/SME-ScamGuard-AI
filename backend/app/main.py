import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, Request, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models import (
    CallbackVerificationRequest,
    OverrideRequest,
)
from backend.app.orchestrator import run_scamguard_pipeline
from backend.app.layers.layer6_governance import validate_dual_authorization

app = FastAPI(
    title="SME-ScamGuard-AI",
    description="Autonomous Accounts Payable BEC Interdiction System for Malaysian SMEs",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.app.routers.ledger import router as ledger_router
from backend.app.routers.demo import router as demo_router
from backend.app.routers.mule_intel import router as mule_intel_router

app.include_router(ledger_router)
app.include_router(demo_router)
app.include_router(mule_intel_router)
VOUCHER_STORE: Dict[str, Dict[str, Any]] = {}

def load_eval_cases() -> list:
    """Load evaluation test cases from backend/data/eval_cases.json."""
    data_path = Path(__file__).resolve().parent.parent / "data" / "eval_cases.json"
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "HEALTHY", "system": "SME-ScamGuard-AI"}

@app.post("/api/scan")
async def scan_invoice(
    request: Request,
    mode: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
):
    """
    Ingests invoice payloads via JSON or multipart/form-data.
    If ?mode=demo, retrieves synthetic local fixtures from eval_cases.json.
    """
    is_demo = (mode == "demo")
    
    # 1. Demo Mode: Match or fallback to synthetic eval cases
    if is_demo:
        eval_cases = load_eval_cases()
        selected_case = None
        if case_id:
            for c in eval_cases:
                if c.get("case_id") == case_id:
                    selected_case = c
                    break
        if not selected_case and eval_cases:
            selected_case = eval_cases[0]
            
        if selected_case:
            pipeline_result = run_scamguard_pipeline(
                selected_case,
                raw_pdf_bytes=None,
                mock_ai=True,
                simulate_ai_error=bool(selected_case.get("simulate_ai_error", False)),
            )
            v_id = pipeline_result["voucher_id"]
            VOUCHER_STORE[v_id] = {
                "voucher_id": v_id,
                "status": pipeline_result["voucher_status"],
                "amount_myr": selected_case.get("amount_myr", 0.0),
                "beneficiary_account": selected_case.get("bank_account", ""),
                "clerk_callback_logged": False,
                "manager_override_logged": False,
            }
            return pipeline_result

    # 2. Extract content from JSON or Form
    content_type = request.headers.get("content-type", "")
    raw_bytes = None
    payload_data: Dict[str, Any] = {}
    
    if "application/json" in content_type:
        payload_data = await request.json()
    elif "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if uploaded_file and hasattr(uploaded_file, "read"):
            raw_bytes = await uploaded_file.read()
            filename = getattr(uploaded_file, "filename", "uploaded_doc.pdf")
        else:
            filename = "uploaded_doc.pdf"
            
        payload_data = {
            "case_id": case_id or form.get("case_id") or f"UPLOAD-{filename}",
            "vendor_name": form.get("vendor_name") or "Mega Logistics Sdn Bhd",
            "bank_account": form.get("bank_account") or "",
            "bank_name": form.get("bank_name") or "Unknown Bank",
            "amount_myr": float(form.get("amount_myr", 0.0)),
            "subject": form.get("subject") or f"Inbound Upload: {filename}",
            "body": form.get("body") or "Invoice file binary analysis",
            "sender": form.get("sender") or "inbound-ap@external.com",
            "producer_tool": form.get("producer_tool"),
            "timestamp_desync": form.get("timestamp_desync") == "true",
        }
    else:
        # Fallback to query parameters or empty payload
        payload_data = {
            "case_id": case_id or "ADHOC_SCAN",
            "vendor_name": "Mega Logistics Sdn Bhd",
            "bank_account": "",
            "bank_name": "Unknown Bank",
            "amount_myr": 0.0,
            "subject": "Ad-Hoc AP Ingestion",
            "body": "",
            "sender": "ap@external.com",
        }
        
    pipeline_result = run_scamguard_pipeline(
        payload_data,
        raw_pdf_bytes=raw_bytes,
        mock_ai=True,  # Deterministic execution
        simulate_ai_error=bool(payload_data.get("simulate_ai_error", False)),
    )
    
    v_id = pipeline_result["voucher_id"]
    VOUCHER_STORE[v_id] = {
        "voucher_id": v_id,
        "status": pipeline_result["voucher_status"],
        "amount_myr": payload_data.get("amount_myr", 0.0),
        "beneficiary_account": payload_data.get("bank_account", ""),
        "clerk_callback_logged": False,
        "manager_override_logged": False,
    }
    
    return pipeline_result

@app.post("/api/vouchers/{voucher_id}/verify-call")
def verify_clerk_call(voucher_id: str, req: CallbackVerificationRequest):
    """
    Step 1 of 4-Eyes Dual Approval:
    AP Clerk logs verbal callback to official corporate switchboard.
    """
    voucher = VOUCHER_STORE.get(voucher_id)
    if not voucher:
        voucher = {
            "voucher_id": voucher_id,
            "status": "PAYMENT_LOCKED",
            "amount_myr": 0.0,
            "beneficiary_account": "Unknown",
            "clerk_callback_logged": False,
            "manager_override_logged": False,
        }
        VOUCHER_STORE[voucher_id] = voucher
        
    now_iso = datetime.now(timezone.utc).isoformat()
    voucher["clerk_callback_logged"] = True
    voucher["clerk_callback_timestamp"] = now_iso
    voucher["clerk_id"] = req.clerk_id
    voucher["clerk_phone_dialed"] = req.phone_dialed
    voucher["clerk_notes"] = req.verification_notes
    voucher["status"] = "CLERK_VERIFIED"
    
    return {
        "voucher_id": voucher_id,
        "step_1_completed": True,
        "status": voucher["status"],
        "message": f"Out-of-band switchboard call verified by {req.clerk_id} to {req.phone_dialed}.",
    }

@app.post("/api/vouchers/{voucher_id}/override")
def override_manager(voucher_id: str, req: OverrideRequest):
    """
    Step 2 of 4-Eyes Dual Approval:
    Finance Manager applies corporate cryptographic override.
    Strictly rejected if clerk callback was not logged first.
    """
    voucher = VOUCHER_STORE.get(voucher_id)
    if not voucher:
        raise HTTPException(status_code=404, detail=f"Voucher {voucher_id} not found")
        
    clerk_logged = voucher.get("clerk_callback_logged", False)
    auth_result = validate_dual_authorization(clerk_logged, req.corporate_key_token)
    
    if not auth_result["authorized"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=auth_result["message"]
        )
        
    now_iso = datetime.now(timezone.utc).isoformat()
    voucher["manager_override_logged"] = True
    voucher["manager_override_timestamp"] = now_iso
    voucher["manager_id"] = req.manager_id
    voucher["override_reason"] = req.override_reason
    voucher["status"] = "OVERRIDDEN_RELEASED"
    
    return {
        "voucher_id": voucher_id,
        "step_2_completed": True,
        "status": voucher["status"],
        "message": "Payment voucher unlocked and authorized for disbursement.",
    }


# ============================================================================
# DUAL PIPELINE EXECUTION (STAGE 4 MULTIMODAL INGESTION & DEMO / LIVE GMAIL)
# ============================================================================

from backend.app.services.document_extractor import document_extractor
from backend.app.services.gmail_service import gmail_ingestion
from backend.services.reconciliation import reconcile_invoice, reconcile_case, load_master_ledger


@app.post("/api/v1/google/sync")
async def sync_live_gmail():
    """Live Gmail Pipeline: Fetches invoices matching strict query filtering,

    runs multimodal extraction via Google GenAI, and performs 3-way reconciliation.
    """
    result = gmail_ingestion.fetch_inbound_invoices()
    return result


@app.get("/api/v1/demo/cases")
async def get_demo_cases():
    """Demo Mailbox Pipeline: Returns pre-computed fields stored in

    backend/data/mock_cases.json so the triage queue loads with zero latency.
    """
    cases_file = Path(__file__).resolve().parent.parent / "data" / "mock_cases.json"
    if cases_file.exists():
        with open(cases_file, "r", encoding="utf-8") as f:
            cases = json.load(f)
            return {"status": "success", "count": len(cases), "cases": cases}
    return {"status": "success", "count": 0, "cases": []}


@app.post("/api/v1/demo/extract/{case_id}")
async def rerun_demo_extraction(case_id: str):
    """Demo Mailbox Pipeline Live Inspector: Opens local fixture file,

    feeds bytes into live Gemini extractor, and returns real-time parsed output.
    """
    cases_file = Path(__file__).resolve().parent.parent / "data" / "mock_cases.json"
    target_case = None
    if cases_file.exists():
        with open(cases_file, "r", encoding="utf-8") as f:
            cases = json.load(f)
            for c in cases:
                if c.get("case_id") == case_id:
                    target_case = c
                    break

    fixtures_dir = Path(__file__).resolve().parent.parent / "data" / "fixtures"
    att_name = target_case.get("attachment_filename", "invoice_8841.pdf") if target_case else "invoice_8841.pdf"
    fixture_path = fixtures_dir / att_name

    raw_bytes = b"%PDF-1.4\n1 0 obj\n<< /Producer (SAP NetWeaver) >>\nendobj\n%%EOF"
    if fixture_path.exists():
        raw_bytes = fixture_path.read_bytes()

    # Feed bytes into live extractor
    extracted = document_extractor.extract_from_bytes(raw_bytes, mime_type="application/pdf")

    # Downstream reconciliation
    email_meta = {
        "sender_email": target_case.get("sender", "billing@techparts.com.my") if target_case else "billing@techparts.com.my",
        "email_body_bank_account": None,
        "subject": target_case.get("subject", "Invoice Delivery") if target_case else "Invoice Delivery",
    }
    recon = reconcile_invoice(extracted.model_dump(), email_meta)

    return {
        "case_id": case_id,
        "live_extracted": extracted.model_dump(),
        "reconciliation": recon,
    }


@app.post("/api/reconcile")
async def run_reconciliation(payload: Dict[str, Any]):
    """Core 3-Way Reconciliation endpoint."""
    extracted = payload.get("extracted_invoice", {})
    email_meta = payload.get("email_metadata", {})
    return reconcile_invoice(extracted, email_meta)

