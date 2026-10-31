"""
Phase 6: Canonical Queue & Verification Integration Test Suite
==============================================================
Validates end-to-end functionality of canonical Phase 6 endpoints:
1. GET  /api/v1/queue
2. GET  /api/v1/queue/{case_id}
3. POST /api/v1/verify
4. POST /api/v1/queue/{case_id}/override
5. POST /api/v1/queue/{case_id}/decide
6. GET  /api/v1/audit/trail
7. POST /api/v1/intel/ingest-police-alert
"""

import io
import pytest
from starlette.testclient import TestClient

from backend.app.main import app
from backend.services.audit_service import verify_audit_integrity


@pytest.fixture
def client():
    return TestClient(app)


def test_get_queue_returns_unified_records(client):
    """Verifies GET /api/v1/queue returns status success and populated invoices."""
    res = client.get("/api/v1/queue")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["count"] >= 50
    assert len(data["invoices"]) >= 50

    sample = data["invoices"][0]
    assert "id" in sample
    assert "status" in sample
    assert "risk_score" in sample
    assert "comparison" in sample


def test_get_queue_case_detail_resolution(client):
    """Verifies GET /api/v1/queue/{case_id} resolves both inv_001 and email_001."""
    # Test numeric resolution email_001
    res1 = client.get("/api/v1/queue/email_001")
    assert res1.status_code == 200
    c1 = res1.json()
    assert c1["id"] in ("email_001", "inv_001")

    # Test direct inv_001
    res2 = client.get("/api/v1/queue/inv_001")
    assert res2.status_code == 200
    c2 = res2.json()
    assert c2["id"] in ("email_001", "inv_001")


def test_override_case_field_and_audit_chain(client):
    """Verifies POST /api/v1/queue/{case_id}/override updates field and commits audit."""
    payload = {
        "field_name": "account_no",
        "corrected_value": "514012998877",
        "justification": "Verified via official landline callback to +60 3-7722 8888",
        "clerk_id": "AP-CLERK-MY01",
        "official_landline_dialed": "+60 3-7722 8888",
    }
    res = client.post("/api/v1/queue/inv_001/override", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["updated_field"] == "account_no"
    assert data["new_value"] == "514012998877"
    assert "audit_event" in data
    assert "event_hash" in data["audit_event"]


def test_decide_wire_freeze_containment(client):
    """Verifies POST /api/v1/queue/{case_id}/decide with FREEZE locks voucher."""
    payload = {
        "action": "FREEZE",
        "clerk_id": "AP-CLERK-MY01",
        "reason": "Mule account hit detected; immediate freeze requested.",
    }
    res = client.post("/api/v1/queue/inv_002/decide", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "WIRE_FROZEN"
    assert data["disposition"] == "LOCKED_CRITICAL"
    assert "erp_hold" in data
    assert data["erp_hold"]["status"] == "PAYMENT_LOCKED"


def test_decide_payment_release(client):
    """Verifies POST /api/v1/queue/{case_id}/decide with APPROVE releases payment."""
    payload = {
        "action": "APPROVE",
        "clerk_id": "AP-CLERK-MY01",
        "reason": "Master Procurement Ledger matched. AutoCount signed.",
    }
    res = client.post("/api/v1/queue/inv_003/decide", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "PAYMENT_RELEASED"
    assert data["disposition"] == "VERIFIED"


def test_audit_trail_endpoint_integrity(client):
    """Verifies GET /api/v1/audit/trail verifies unbroken SHA-256 chain."""
    res = client.get("/api/v1/audit/trail")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["chain_intact"] is True
    assert "events" in data
    assert len(data["events"]) >= 1

    # Check local service verify function
    is_valid, msg = verify_audit_integrity()
    assert is_valid is True


def test_verify_endpoint_ingestion(client):
    """Verifies POST /api/v1/verify ingests PDF and runs orchestrator."""
    dummy_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF\n"
    files = {"file": ("vendor_invoice_claim.pdf", io.BytesIO(dummy_pdf), "application/pdf")}
    data = {
        "sender_email": "billing@mega-supplies.com.my",
        "subject": "Monthly Maintenance Tax Invoice",
    }
    res = client.post("/api/v1/verify", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "success"
    assert "case_id" in res_data
    assert "pipeline_result" in res_data
    assert "record" in res_data
