"""Comprehensive tests for Day 3: FastAPI REST endpoints and TelegramAlertService.

Validates:
- Telegram mock token detection, message formatting, and network fault tolerance.
- FastAPI routes: root (/), health (/api/health), scanning (/api/scan),
  historical reports (/api/reports), and benchmark evaluation (/api/eval/benchmark).
"""

from typing import Any, Dict
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
import httpx

from app.api.routes import AUDIT_STORE
from app.main import app
from app.models.schema import AuditForensicReport, EmailInput, HumanCallbackVoucher
from app.services.telegram import TelegramAlertService


@pytest.fixture
def client() -> TestClient:
    """Provide a TestClient instance for FastAPI application."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_audit_store() -> None:
    """Clear in-memory audit store before each test."""
    AUDIT_STORE.clear()


# ======================================================================
# 1. TelegramAlertService Unit Tests
# ======================================================================

def test_telegram_dummy_token_detection() -> None:
    """Verify that placeholder or missing credentials activate mock mode."""
    # Empty tokens
    assert TelegramAlertService("", "")._is_dummy_token() is True
    assert TelegramAlertService("token", "")._is_dummy_token() is True
    assert TelegramAlertService("", "chat")._is_dummy_token() is True

    # Standard placeholders
    assert TelegramAlertService("dummy_token_for_dev", "dummy_chat_id")._is_dummy_token() is True
    assert TelegramAlertService("your_bot_token_here", "12345678")._is_dummy_token() is True
    assert TelegramAlertService("123456:ABC-DEF", "your_chat_id")._is_dummy_token() is True
    assert TelegramAlertService("none", "none")._is_dummy_token() is True

    # Valid looking credentials
    assert TelegramAlertService("123456789:AAFg8jKLmNpQrStUvWxYz", "-100123456789")._is_dummy_token() is False


@pytest.mark.anyio
async def test_telegram_send_alert_mock_mode(capsys: pytest.CaptureFixture[str]) -> None:
    """Verify mock mode prints terminal logs and returns True without HTTP calls."""
    service = TelegramAlertService("dummy_token_for_dev", "dummy_chat_id")
    report = AuditForensicReport(
        case_id="TC_TEST_MOCK_01",
        is_scam=True,
        risk_score=95.0,
        threat_level="CRITICAL",
        primary_cues=["LOOKALIKE_DOMAIN", "CISA_URGENCY"],
        executive_summary="Critical BEC attempt detected.",
    )

    result = await service.send_scam_alert(report)
    assert result is True

    captured = capsys.readouterr()
    assert "[TELEGRAM MOCK] Alert dispatched for Case TC_TEST_MOCK_01" in captured.out
    assert "Score: 95.0" in captured.out
    assert "Level: CRITICAL" in captured.out


@pytest.mark.anyio
async def test_telegram_send_alert_live_dispatch() -> None:
    """Verify that a non-dummy token formats Markdown and calls Telegram Bot API."""
    service = TelegramAlertService("real_token_12345", "chat_id_67890")
    report = AuditForensicReport(
        case_id="TC_TEST_LIVE_01",
        is_scam=True,
        risk_score=100.0,
        threat_level="CRITICAL",
        primary_cues=["LOOKALIKE_DOMAIN", "UNVERIFIED_BANK_CHANGE"],
        safe_next_step=HumanCallbackVoucher(
            target_vendor="Mega Build Sdn Bhd",
            authorized_phone_number="+60-3-7722-8888",
            security_instructions="Do not disburse funds.",
        ),
        executive_summary="Homoglyph domain attack detected.",
    )

    req = httpx.Request("POST", "https://api.telegram.org")
    mock_response = httpx.Response(200, json={"ok": True}, request=req)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await service.send_scam_alert(report)

        assert result is True
        mock_post.assert_awaited_once()

        call_args, call_kwargs = mock_post.call_args
        assert call_args[0] == "https://api.telegram.org/botreal_token_12345/sendMessage"
        payload = call_kwargs["json"]
        assert payload["chat_id"] == "chat_id_67890"
        assert payload["parse_mode"] == "Markdown"
        assert "CRITICAL SCAM DETECTED" in payload["text"]
        assert "TC_TEST_LIVE_01" in payload["text"]
        assert "+60-3-7722-8888" in payload["text"]
        assert "Mega Build Sdn Bhd" in payload["text"]


@pytest.mark.anyio
async def test_telegram_send_alert_http_error_graceful() -> None:
    """Verify that HTTP errors or connection timeouts do not raise exceptions."""
    service = TelegramAlertService("real_token_12345", "chat_id_67890")
    report = AuditForensicReport(
        case_id="TC_TEST_ERR_01",
        is_scam=True,
        risk_score=90.0,
        threat_level="CRITICAL",
        primary_cues=["LOOKALIKE_DOMAIN"],
        executive_summary="Critical scam detected.",
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectTimeout("Connection timed out")
        result = await service.send_scam_alert(report)
        assert result is False


# ======================================================================
# 2. FastAPI Endpoint Tests
# ======================================================================

def test_root_endpoint(client: TestClient) -> None:
    """Assert GET / returns message and status 200."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "SME-ScamGuard-AI" in data["message"]


def test_health_endpoint(client: TestClient) -> None:
    """Assert GET /api/health returns healthy status and metadata."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "SME-ScamGuard-AI",
        "version": "1.0.0",
    }


def test_scan_email_scam_detection(client: TestClient) -> None:
    """Assert POST /api/scan detects scam, stores report, and triggers alert task."""
    scam_payload: Dict[str, Any] = {
        "case_id": "TC_API_SCAN_SCAM",
        "sender": "finance@mega-bu1ld.com.my",
        "subject": "URGENT: Revised Bank Account for Invoice #MB-8821",
        "body": "Transfer RM 148,500.00 today to CIMB 8009-4411-2299 immediately before 5:00 PM.",
        "declared_bank_account": "8009-4411-2299",
        "declared_amount": 148500.0,
    }

    response = client.post("/api/scan", json=scam_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["case_id"] == "TC_API_SCAN_SCAM"
    assert data["is_scam"] is True
    assert data["risk_score"] >= 50.0
    assert data["threat_level"] in ["CRITICAL", "SUSPICIOUS"]
    assert "LOOKALIKE_DOMAIN" in data["primary_cues"]
    assert data["safe_next_step"] is not None

    # Check that AUDIT_STORE has recorded the report at index 0
    assert len(AUDIT_STORE) == 1
    assert AUDIT_STORE[0].case_id == "TC_API_SCAN_SCAM"


def test_scan_email_legitimate(client: TestClient) -> None:
    """Assert POST /api/scan correctly identifies legitimate vendor invoice."""
    legit_payload: Dict[str, Any] = {
        "case_id": "TC_API_SCAN_LEGIT",
        "sender": "billing@alphatech.com.my",
        "subject": "Invoice AT-2026-09: Monthly Cloud Support",
        "body": "Attached monthly invoice. Total Due: RM 12,800.00 to Maybank 8001-2233-4455.",
        "declared_bank_account": "8001-2233-4455",
        "declared_amount": 12800.0,
    }

    response = client.post("/api/scan", json=legit_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["case_id"] == "TC_API_SCAN_LEGIT"
    assert data["is_scam"] is False
    assert data["risk_score"] < 50.0
    assert data["threat_level"] == "SAFE"
    assert data["safe_next_step"] is None

    assert len(AUDIT_STORE) == 1
    assert AUDIT_STORE[0].case_id == "TC_API_SCAN_LEGIT"


def test_get_reports_endpoint(client: TestClient) -> None:
    """Assert GET /api/reports retrieves stored reports in reverse chronological order."""
    # Initially empty
    res0 = client.get("/api/reports")
    assert res0.status_code == 200
    assert res0.json() == []

    # Insert two scans
    client.post(
        "/api/scan",
        json={
            "case_id": "CASE_FIRST",
            "sender": "billing@alphatech.com.my",
            "subject": "Invoice 1",
            "body": "Normal invoice to Maybank 8001-2233-4455.",
        },
    )
    client.post(
        "/api/scan",
        json={
            "case_id": "CASE_SECOND",
            "sender": "finance@mega-bu1ld.com.my",
            "subject": "URGENT payment",
            "body": "Transfer money to CIMB 8009-4411-2299 immediately.",
        },
    )

    res_all = client.get("/api/reports")
    assert res_all.status_code == 200
    reports = res_all.json()
    assert len(reports) == 2
    # Newest first
    assert reports[0]["case_id"] == "CASE_SECOND"
    assert reports[1]["case_id"] == "CASE_FIRST"


def test_benchmark_endpoint_success(client: TestClient) -> None:
    """Assert POST /api/eval/benchmark executes all benchmark cases and returns 100% accuracy."""
    response = client.post("/api/eval/benchmark")
    assert response.status_code == 200
    data = response.json()

    assert data["total_cases"] == 8
    assert data["passed_cases"] == 8
    assert data["accuracy_rate"] == 1.0
    assert len(data["cases_analyzed"]) == 8

    for case in data["cases_analyzed"]:
        assert "case_id" in case
        assert "description" in case
        assert "expected_is_scam" in case
        assert "actual_is_scam" in case
        assert "risk_score" in case
        assert case["passed"] is True


def test_benchmark_endpoint_missing_file(client: TestClient) -> None:
    """Assert POST /api/eval/benchmark handles missing eval dataset gracefully."""
    with patch("pathlib.Path.exists", return_value=False):
        response = client.post("/api/eval/benchmark")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert data["total_cases"] == 0
        assert data["passed_cases"] == 0
        assert data["accuracy_rate"] == 0.0


# ======================================================================
# 3. GmailWatcherService & /api/gmail/sync Endpoint Tests
# ======================================================================

def test_gmail_watcher_dummy_credentials() -> None:
    """Verify GmailWatcherService safely returns empty list with dummy/missing credentials."""
    from app.services.gmail import GmailWatcherService
    service = GmailWatcherService("test_account@gmail.com", "abcd1234efgh5678")
    assert service._has_credentials() is False
    assert service.fetch_latest_unread_emails() == []


def test_gmail_sync_endpoint_empty(client: TestClient) -> None:
    """Verify POST /api/gmail/sync returns structured response with zero emails."""
    response = client.post("/api/gmail/sync")
    assert response.status_code == 200
    data = response.json()
    assert data["fetched_count"] == 0
    assert data["quarantined_count"] == 0
    assert data["reports"] == []


def test_gmail_sync_endpoint_with_mocked_inbox(client: TestClient) -> None:
    """Verify POST /api/gmail/sync runs multi-agent inspection on fetched emails."""
    mock_emails = [
        EmailInput(
            case_id="GMAIL-101",
            sender="finance@mega-bu1ld.com.my",
            subject="URGENT: Change of Beneficiary Bank Details",
            body="Remit balance immediately to CIMB Bank 8009-4411-2299 before 5:00 PM today.",
            declared_bank_account="8009-4411-2299",
            declared_amount=148500.0,
        ),
        EmailInput(
            case_id="GMAIL-102",
            sender="billing@alphatech.com.my",
            subject="Invoice AT-2026-09: Monthly Cloud Support",
            body="Standard Net 30 payment to Maybank 8001-2233-4455.",
            declared_bank_account="8001-2233-4455",
            declared_amount=12800.0,
        ),
    ]

    with patch("app.api.routes.gmail_service.fetch_latest_unread_emails", return_value=mock_emails):
        with patch("app.services.telegram.TelegramAlertService.send_scam_alert", new_callable=AsyncMock) as mock_alert:
            response = client.post("/api/gmail/sync")
            assert response.status_code == 200
            data = response.json()
            assert data["fetched_count"] == 2
            assert data["quarantined_count"] == 1
            assert len(data["reports"]) == 2

            # Assert first email was flagged and quarantined
            report_map = {r["case_id"]: r for r in data["reports"]}
            assert report_map["GMAIL-101"]["is_scam"] is True
            assert report_map["GMAIL-102"]["is_scam"] is False


def test_gemini_cognitive_agent_fallback() -> None:
    """Verify GeminiCognitiveAgent offline heuristic fallback extracts threat cues."""
    from app.services.gemini_agent import GeminiCognitiveAgent
    agent = GeminiCognitiveAgent(api_key="dummy_key_for_test")
    analysis = agent.analyze_correspondence(
        sanitized_text="Kindly remit balance immediately to backup account today before 5:00 pm.",
        subject="URGENT: Change of Bank Account Details",
    )
    assert analysis.is_suspicious is True
    assert "CISA_URGENCY" in analysis.cues
    assert analysis.confidence >= 0.6

