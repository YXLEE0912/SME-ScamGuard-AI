"""
Tests for OSINT Police Threat Intelligence Ingestion Agent
==========================================================
Verifies 2-stage verification pipeline, authenticity gating, bank/account normalization,
and atomic SemakMule threat cache hydration.
"""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.services.osint_mule_ingestion import (
    VerificationStatus,
    canonicalize_bank_name,
    get_semakmule_cache_path,
    load_semakmule_cache_data,
    normalize_account_digits,
    verify_and_ingest_police_news,
)
from backend.services.reconciliation import (
    load_semakmule_cache,
    reconcile_invoice,
)
import backend.services.reconciliation as recon

client = TestClient(app)


@pytest.fixture(autouse=True)
def preserve_and_restore_semakmule_cache():
    """Ensure tests run idempotently without permanently mutating semakmule_cache.json."""
    cache_path = get_semakmule_cache_path()
    original_text = cache_path.read_text(encoding="utf-8") if cache_path.exists() else None
    original_cached_set = set(recon._CACHED_SEMAKMULE) if recon._CACHED_SEMAKMULE is not None else None

    yield

    # Restore disk state
    if original_text is not None and cache_path.exists():
        cache_path.write_text(original_text, encoding="utf-8")

    # Restore in-memory state in reconciliation
    if original_cached_set is not None:
        recon._CACHED_SEMAKMULE = set(original_cached_set)
    else:
        recon._CACHED_SEMAKMULE = None
        recon.load_semakmule_cache()


# ============================================================================
# CORE REQUIREMENT TESTS
# ============================================================================

def test_authentic_news_ingestion():
    """
    Test 1 (Authentic News Ingestion):
    Feeds a realistic Bernama news story citing PDRM with Maybank and CIMB mule numbers.
    Asserts is_authentic == True, 2 accounts extracted and added to cache.
    """
    headline = "PDRM Busts Commercial Syndicate Using Mule Accounts for AP Invoice Diversion"
    source_url = "https://www.bernama.com/en/crime/news.php?id=234819"
    content = (
        "KUALA LUMPUR: Bukit Aman CCID director highlighted two syndicate accounts — "
        "Maybank accounts 5140-1299-4821 and CIMB 888102938472 — used in invoice redirect scams "
        "targeting local SMEs. Members of the public are advised to verify beneficiary accounts "
        "on the official SemakMule portal."
    )

    result = verify_and_ingest_police_news(
        headline=headline,
        source_url=source_url,
        content=content,
        force_mock=True,
    )

    # 1. Verification assertions
    assert result.verification.is_authentic is True
    assert result.verification.status == VerificationStatus.AUTHENTIC_PDRM_REPORT
    assert result.verification.confidence_score >= 0.80
    assert "Bernama" in result.verification.detected_publisher

    # 2. Extraction assertions (2 accounts)
    assert len(result.extracted_mules) == 2
    extracted_accs = {m.account_no for m in result.extracted_mules}
    assert "514012994821" in extracted_accs
    assert "888102938472" in extracted_accs
    assert result.records_added >= 2

    # Verify canonicalized bank names
    bank_map = {m.account_no: m.bank_name for m in result.extracted_mules}
    assert bank_map["514012994821"] == "MAYBANK"
    assert bank_map["888102938472"] == "CIMB"

    # 3. Disk cache persistence assertion
    disk_data = load_semakmule_cache_data()
    blacklisted_disk = {str(item.get("account_no")) for item in disk_data.get("blacklisted_accounts", [])}
    assert "514012994821" in blacklisted_disk
    assert "888102938472" in blacklisted_disk

    # 4. In-memory threat cache integration assertion (Downstream reconciliation immediately catches it)
    active_cache = load_semakmule_cache()
    assert "514012994821" in active_cache
    assert "888102938472" in active_cache


def test_fake_satire_rejection():
    """
    Test 2 (Fake / Satire Rejection):
    Feeds an unverified forum post or suspicious scam claim with no institutional police attribution.
    Asserts is_authentic == False, SUSPECTED_FAKE_NEWS or UNVERIFIED_SOURCE, and asserts 0 records added to cache.
    """
    # Case A: Suspected fake / satire news
    headline = "Hilarious Satire: Prank Blog Claims Boss Transferred Company Millions to Fake Account 123456789012"
    source_url = "https://unverified-pranks.blogspot.com/2026/10/satire-boss-scam.html"
    content = (
        "Satire alert: A viral reddit rumor says a company director sent funds to Maybank 123456789012. "
        "This is pure unverified satire with zero police reports."
    )

    result = verify_and_ingest_police_news(
        headline=headline,
        source_url=source_url,
        content=content,
        force_mock=True,
    )

    assert result.verification.is_authentic is False
    assert result.verification.status in (
        VerificationStatus.SUSPECTED_FAKE_NEWS,
        VerificationStatus.UNVERIFIED_SOURCE,
    )
    assert len(result.extracted_mules) == 0
    assert result.records_added == 0

    # Ensure account was NEVER written to disk cache
    disk_data = load_semakmule_cache_data()
    blacklisted_disk = {str(item.get("account_no")) for item in disk_data.get("blacklisted_accounts", [])}
    assert "123456789012" not in blacklisted_disk

    # Case B: Unverified forum gossip without police citation
    headline = "Someone in Telegram said this account is suspicious"
    source_url = "https://random-forum.xyz/threads/8912"
    content = "User123 says watch out for CIMB 777123456789. No police report filed."

    result_forum = verify_and_ingest_police_news(
        headline=headline,
        source_url=source_url,
        content=content,
        force_mock=True,
    )

    assert result_forum.verification.is_authentic is False
    assert result_forum.verification.status in (
        VerificationStatus.UNVERIFIED_SOURCE,
        VerificationStatus.SUSPECTED_FAKE_NEWS,
    )
    assert len(result_forum.extracted_mules) == 0
    assert result_forum.records_added == 0


def test_data_hygiene_and_normalization():
    """
    Test 3 (Data Hygiene & Normalization):
    Handles hyphenated accounts (5140-1299-4821) -> Asserts normalized string 514012994821.
    Tests various format distortions (spaces, punctuation, non-digits).
    """
    assert normalize_account_digits("5140-1299-4821") == "514012994821"
    assert normalize_account_digits(" 8881 0293 8472 ") == "888102938472"
    assert normalize_account_digits("1410-0290-0012-3456") == "1410029000123456"
    
    # Invalid lengths (less than 9 or greater than 16)
    assert normalize_account_digits("12345") is None
    assert normalize_account_digits("12345678901234567890") is None
    assert normalize_account_digits(None) is None

    # Bank Canonicalization
    assert canonicalize_bank_name("Maybank") == "MAYBANK"
    assert canonicalize_bank_name("cimb bank") == "CIMB"
    assert canonicalize_bank_name("Public Bank Berhad") == "PUBLIC_BANK"
    assert canonicalize_bank_name("RHB") == "RHB"
    assert canonicalize_bank_name("Hong Leong Bank") == "HONG_LEONG"
    assert canonicalize_bank_name("AmBank") == "AMBANK"
    assert canonicalize_bank_name("Bank Simpanan Nasional") == "BSN"


def test_clean_text_with_no_mules():
    """
    Test 4 (Clean Text with No Mules):
    Ingests authentic news report about cyber awareness that mentions NO bank accounts.
    Asserts is_authentic == True, extracted_mules == [], cache remains uncorrupted.
    """
    headline = "PDRM CCID Advises SMEs to Strengthen Dual-Control AP Workflows"
    source_url = "https://www.thestar.com.my/news/nation/2026/10/pdrm-cyber-advisory"
    content = (
        "PETALING JAYA: Bukit Aman Commercial Crime Investigation Department (CCID) has urged "
        "Malaysian small and medium enterprises (SMEs) to verify vendor bank details out-of-band "
        "via official corporate landlines before executing payments, especially in the wake of "
        "rising Business Email Compromise (BEC) fraud. The National Scam Response Centre (NSRC 997) "
        "remains on 24-hour standby."
    )

    result = verify_and_ingest_police_news(
        headline=headline,
        source_url=source_url,
        content=content,
        force_mock=True,
    )

    assert result.verification.is_authentic is True
    assert result.verification.status == VerificationStatus.AUTHENTIC_PDRM_REPORT
    assert result.verification.confidence_score >= 0.80
    assert result.extracted_mules == []
    assert result.records_added == 0


# ============================================================================
# FASTAPI ROUTER ENDPOINT & INTERDICTION PIPELINE INTEGRATION TESTS
# ============================================================================

def test_api_endpoint_authentic_police_alert():
    """Test POST /api/v1/intel/ingest-police-alert with authentic report (200 OK)."""
    payload = {
        "headline": "PDRM Busts Commercial Syndicate Using Mule Accounts",
        "source_url": "https://www.bernama.com/en/crime/news.php?id=234819",
        "content": (
            "KUALA LUMPUR: Bukit Aman CCID director highlighted two Maybank accounts 5140-1299-4821 "
            "and CIMB 888102938472 used in invoice redirect scams."
        ),
    }
    response = client.post("/api/v1/intel/ingest-police-alert", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verification"]["is_authentic"] is True
    assert data["verification"]["status"] == "AUTHENTIC_PDRM_REPORT"
    assert len(data["extracted_mules"]) == 2
    assert data["records_added"] >= 2


def test_api_endpoint_fake_news_rejection():
    """Test POST /api/v1/intel/ingest-police-alert with suspected fake/satire news (400 Bad Request)."""
    payload = {
        "headline": "Prank: Viral satire claiming millions sent to fake account",
        "source_url": "https://prank-blog.blogspot.com/fake-post",
        "content": "Satire and hoax: Untrusted blog claims money was sent to account 999888111222.",
    }
    response = client.post("/api/v1/intel/ingest-police-alert", json=payload)
    assert response.status_code == 400
    detail = response.json().get("detail", {})
    assert detail.get("error") == "SUSPECTED_FAKE_NEWS"


def test_api_endpoint_validation_error():
    """Test POST /api/v1/intel/ingest-police-alert with invalid payload (422 Unprocessable Entity)."""
    payload = {
        "headline": "Short",  # Fails min_length=5
        "source_url": "abc",  # Fails min_length=8
        "content": "Tiny",    # Fails min_length=10
    }
    response = client.post("/api/v1/intel/ingest-police-alert", json=payload)
    assert response.status_code == 422


def test_downstream_reconciliation_detects_ingested_mule():
    """
    Test End-to-End Interdiction:
    Ingests mule account '514012994821', then verifies that the core AP reconciliation engine
    immediately flags it as SEMAKMULE_BLACKLIST_HIT with LOCKED_CRITICAL and risk_score 99.
    """
    payload = {
        "headline": "PDRM Alert on High Risk Mule Accounts",
        "source_url": "https://www.thestar.com.my/news/nation/pdrm-mule-list",
        "content": "Bukit Aman CCID identified Maybank account 5140-1299-4821 as an active syndicate mule.",
    }
    ingest_res = verify_and_ingest_police_news(
        headline=payload["headline"],
        source_url=payload["source_url"],
        content=payload["content"],
        force_mock=True,
    )
    assert ingest_res.verification.is_authentic is True
    assert any(m.account_no == "514012994821" for m in ingest_res.extracted_mules)

    # Now run AP invoice reconciliation targeting this beneficiary account
    recon_res = reconcile_invoice(
        extracted_invoice={
            "vendor_name": "Mega Logistics Sdn Bhd",
            "bank_name": "Maybank",
            "bank_account": "514012994821",  # Ingested mule
            "amount": 18500.0,
            "pdf_producer": "AutoCount Accounting v2.1",
            "po_number": "PO-ML-9988",
        },
        email_metadata={
            "sender_email": "billing@megalogistics.com.my",
            "email_body_bank_account": "514012994821",
            "subject": "Tax Invoice Delivery",
        },
    )

    assert recon_res["verdict"] == "LOCKED_CRITICAL"
    assert recon_res["risk_score"] == 99
    assert "SEMAKMULE_BLACKLIST_HIT" in recon_res["flags"]
    assert recon_res["checks"]["semak_mule_clear"] is False
