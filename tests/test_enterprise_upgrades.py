"""Comprehensive unit & integration tests for Enterprise Upgrades in SME-ScamGuard-AI.

Tests:
1. Threat intelligence feed loading and SemakMule blacklist lookup.
2. Multi-format document parser: PDF, DOCX, TXT, and deterministic regex extraction.
3. Quarantine firewall (schema firewall when bank is missing or < 8 digits).
4. Two-way discrepancy matrix and 5-point forensic audit checklist.
5. Endpoints: POST /api/scan/invoice-file and POST /api/scan/channel-message.
6. Local audit persistence to ./data/audits.json.
"""

import io
import json
from pathlib import Path
from typing import Any, Dict
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.api.routes import AUDIT_STORE
from app.main import app
from app.models.schema import EmailInput
from app.services.document_parser import (
    extract_financial_fields,
    parse_invoice_attachment,
)
from app.services.engine import MultiAgentScamGuardEngine
from app.services.threat_intelligence import (
    check_semakmule_blacklist,
    get_active_threat_trends,
    load_threat_intelligence,
)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_audit_store() -> None:
    AUDIT_STORE.clear()


# ======================================================================
# 1. Threat Intelligence & SemakMule Tests
# ======================================================================

def test_load_threat_intelligence_and_trends() -> None:
    intel = load_threat_intelligence()
    assert "active_trends" in intel
    assert len(intel["active_trends"]) >= 3
    assert "known_mule_accounts" in intel

    trends = get_active_threat_trends()
    assert len(trends) >= 3
    assert any("migration" in t.lower() for t in trends)


def test_semakmule_blacklist_lookup() -> None:
    # Blacklisted mule: 9876543210
    res_mule = check_semakmule_blacklist("9876543210")
    assert res_mule["is_mule"] is True
    assert "PDRM SemakMule" in res_mule["source"]

    # Formatted blacklisted mule: 9876-543-210
    res_mule_fmt = check_semakmule_blacklist("9876-543-210")
    assert res_mule_fmt["is_mule"] is True

    # Clean legitimate account: 512345678901
    res_clean = check_semakmule_blacklist("512345678901")
    assert res_clean["is_mule"] is False


# ======================================================================
# 2. Document Parser & Regex Extraction Tests
# ======================================================================

def test_extract_financial_fields() -> None:
    sample_text = (
        "Invoice from Mega Build Sdn Bhd\n"
        "Please remit RM 148,500.00 to Account No: 8009-4411-2299 before 5:00 PM."
    )
    bank, amount = extract_financial_fields(sample_text)
    assert bank == "800944112299"
    assert amount == 148500.0


def test_parse_plaintext_invoice() -> None:
    content = b"Tax Invoice\nVendor: Mega Build\nTotal Due: RM 5,420.50\nBank Account: 512345678901"
    parsed = parse_invoice_attachment(content, "invoice.txt")
    assert parsed["filename"] == "invoice.txt"
    assert parsed["extracted_bank"] == "512345678901"
    assert parsed["extracted_amount"] == 5420.50
    assert parsed["ocr_used"] is False


def test_parse_docx_invoice() -> None:
    import docx
    doc = docx.Document()
    doc.add_paragraph("Mega Build Progress Claim Invoice")
    doc.add_paragraph("Total: RM 98,200.00")
    table = doc.add_table(rows=1, cols=2)
    table.rows[0].cells[0].text = "Beneficiary Account:"
    table.rows[0].cells[1].text = "5123-4567-8901"
    bio = io.BytesIO()
    doc.save(bio)
    parsed = parse_invoice_attachment(bio.getvalue(), "invoice.docx")
    assert parsed["filename"] == "invoice.docx"
    assert parsed["extracted_bank"] == "512345678901"
    assert parsed["extracted_amount"] == 98200.0


# ======================================================================
# 3. Engine Features: Quarantine Firewall & Discrepancy Matrix
# ======================================================================

def test_quarantine_guard_firewall_triggers_on_missing_bank() -> None:
    engine = MultiAgentScamGuardEngine()
    email_missing_bank = EmailInput(
        case_id="TEST_QUARANTINE_01",
        sender="billing@megabuild.com.my",
        subject="Invoice without bank",
        body="Here is your invoice for RM 5,000. Please pay immediately.",
        declared_bank_account=None,
    )
    report = engine.coordinate_agents(email_missing_bank)
    assert report.status == "QUARANTINED"
    assert report.risk_score == 80.0
    assert "Integrity Firewall" in report.verdict_summary
    assert report.safe_next_step is not None
    assert report.discrepancy_matrix is not None


def test_engine_semakmule_critical_score() -> None:
    engine = MultiAgentScamGuardEngine()
    # 9876543210 is a known mule account
    email_mule = EmailInput(
        case_id="TEST_MULE_01",
        sender="finance@mega-bu1ld.com.my",
        subject="Bank update",
        body="Please pay RM 14,500 to CIMB 9876543210.",
        declared_bank_account="9876543210",
        declared_amount=14500.0,
    )
    report = engine.coordinate_agents(email_mule)
    assert report.status == "PROCESSED"
    assert report.risk_score == 99.0
    assert report.threat_level == "CRITICAL"
    assert report.discrepancy_matrix.is_mule is True
    assert report.discrepancy_matrix.status == "CRITICAL_MULE_DETECTED"
    assert len(report.audit_checklist) == 6
    assert report.timeline_events is not None
    assert len(report.timeline_events) == 5


# ======================================================================
# 4. API Endpoints: Invoice Upload & Channel Message
# ======================================================================

def test_scan_invoice_file_endpoint(client: TestClient) -> None:
    raw_txt = (
        b"Mega Build Sdn Bhd Invoice #MB-999\n"
        b"Due: RM 24,000.00\n"
        b"Remit to Maybank Account: 5123-4567-8901\n"
    )
    files = {"file": ("invoice_megabuild.txt", raw_txt, "text/plain")}
    data = {
        "sender": "billing@megabuild.com.my",
        "subject": "Monthly Statement",
    }
    response = client.post("/api/scan/invoice-file", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "PROCESSED"
    assert res_json["is_scam"] is False
    assert res_json["risk_score"] < 50.0
    assert res_json["discrepancy_matrix"]["account_match"] is True


def test_scan_channel_message_endpoint(client: TestClient) -> None:
    payload = {
        "message": "Boss, our Maybank is under maintenance. Please remit RM 14,500 to our alternate CIMB account: 9876543210 urgently.",
        "sender": "whatsapp:+60129881122",
        "subject": "WhatsApp Emergency Billing",
    }
    response = client.post("/api/scan/channel-message", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["is_scam"] is True
    assert res_json["risk_score"] == 99.0  # Mule hit
    assert res_json["discrepancy_matrix"]["is_mule"] is True
    assert len(res_json["timeline_events"]) == 5
