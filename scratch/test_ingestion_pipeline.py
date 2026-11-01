import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_queue_deduplication():
    # Call get_queue
    res = client.get("/api/v1/queue")
    assert res.status_code == 200, res.text
    data = res.json()
    invoices = data["invoices"]
    ids = [inv["id"] for inv in invoices]
    assert len(ids) == len(set(ids)), f"Duplicate IDs found in queue: {[x for x in ids if ids.count(x) > 1]}"
    print(f"PASS: Queue deduplication verified across {len(invoices)} items.")

def test_verify_rejects_non_pdf():
    # Uploading a non-pdf file like cat.jpg
    fake_img = b"fake image bytes of a cat"
    files = {"file": ("cat.jpg", fake_img, "image/jpeg")}
    res = client.post("/api/v1/verify", files=files)
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    detail = res.json().get("detail", "")
    assert "Invalid document: Uploaded file must be a readable PDF invoice. Could not extract textual financial fields." in detail
    print("PASS: Non-PDF rejected with HTTP 400 and required message.")

def test_verify_rejects_corrupted_pdf_or_no_text():
    # Uploading a PDF header without financial fields (e.g. freight_stmt_1042.pdf)
    with open("backend/data/fixtures/freight_stmt_1042.pdf", "rb") as f:
        pdf_bytes = f.read()
    files = {"file": ("freight_stmt_1042.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/v1/verify", files=files)
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    detail = res.json().get("detail", "")
    assert "Invalid document: Uploaded file must be a readable PDF invoice. Could not extract textual financial fields." in detail
    print("PASS: PDF without readable financial fields rejected with HTTP 400.")

def test_verify_accepts_valid_pdf_invoice():
    # Uploading invoice_8841.pdf
    with open("backend/data/fixtures/invoice_8841.pdf", "rb") as f:
        pdf_bytes = f.read()
    files = {"file": ("invoice_8841.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/v1/verify", files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    record = body["record"]
    assert record["sender_name"] == "TechParts Logistics Sdn Bhd", f"Got {record['sender_name']}"
    assert record["comparison"]["account_no"]["draft"] == "514011234567"
    assert record["comparison"]["amount"]["draft"] == "RM 15,000.00"
    print("PASS: Real PDF invoice extracted correctly without synthetic defaults!")

if __name__ == "__main__":
    test_queue_deduplication()
    test_verify_rejects_non_pdf()
    test_verify_rejects_corrupted_pdf_or_no_text()
    test_verify_accepts_valid_pdf_invoice()
    print("ALL TESTS PASSED!")

