import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"


def test_demo_mailbox_50():
    res = client.get("/api/v1/demo/mailbox")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["count"] == 50
    assert len(data["invoices"]) == 50


def test_correct_field_audit_flow():
    # Correct a field on an invoice with defect (e.g. inv_031)
    res = client.post(
        "/api/v1/demo/correct-field",
        json={
            "invoice_id": "inv_031",
            "field_name": "amount",
            "corrected_value": "RM 4,200.00 (Approved via Director Special Requisition)",
            "justification": "Confirmed with procurement director via verified switchboard.",
            "clerk_id": "AP-CLERK-SITI",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["defect_fields"] == 0
    assert data["invoice_status"] == "VERIFIED"

    # Verify audit trail contains the correction
    audit_res = client.get("/api/v1/demo/audit")
    assert audit_res.status_code == 200
    events = audit_res.json()["events"]
    assert any("AP-CLERK-SITI" in e.get("operator_id", "") for e in events)


def test_ledger_upload_and_zero_disk():
    sample_csv = (
        "vendor_name,ssm_no,bank_name,account_no,official_landline,typical_max_amount,last_active_date,po_prefix,requires_grn\n"
        "Alpha Test Sdn Bhd,202101001122,Maybank,514019998888,+60 3-8888 1111,10000.0,2026-09-01,PO-AT-,True\n"
        "Beta Test Supplies,202201003344,CIMB Bank,8001112223,+60 3-7777 2222,20000.0,2026-09-10,PO-BT-,False\n"
    )
    files = {"file": ("autocount_export.csv", io.BytesIO(sample_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/v1/ledger/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["vendors_loaded"] == 2
    assert "ledger_sha256" in data

    # Verify status
    ledger_status = client.get("/api/v1/ledger")
    assert ledger_status.status_code == 200
    assert ledger_status.json()["vendors_count"] == 2

    # Reset back to default 40 vendors
    from backend.services.ledger_sync import load_default_ledger_file
    load_default_ledger_file()
    assert client.get("/api/v1/ledger").json()["vendors_count"] == 40
