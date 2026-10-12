"""
OSINT Police Threat Intelligence Ingestion Agent
================================================
Verifies authenticity of incoming cyber/scam news reports and ingests confirmed
PDRM CCID mule accounts into local in-memory SemakMule threat cache and disk storage.

Implements a 2-stage verification pipeline:
  Stage 1: News Authenticity & Source Credibility Gate (Defends against threat cache poisoning)
  Stage 2: Structured Entity Extraction (Enforces bank canonicalization and account digit normalization)
"""

import json
import logging
import os
import re
import tempfile
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urlparse

from pydantic import BaseModel, Field

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


# ============================================================================
# PYDANTIC V2 SCHEMAS
# ============================================================================

class VerificationStatus(str, Enum):
    AUTHENTIC_PDRM_REPORT = "AUTHENTIC_PDRM_REPORT"
    UNVERIFIED_SOURCE = "UNVERIFIED_SOURCE"
    SUSPECTED_FAKE_NEWS = "SUSPECTED_FAKE_NEWS"


class NewsVerificationResult(BaseModel):
    is_authentic: bool
    status: VerificationStatus
    confidence_score: float = Field(ge=0.0, le=1.0)
    source_credibility_reasoning: str
    detected_publisher: str


class MuleAccountRecord(BaseModel):
    account_no: str
    bank_name: str
    police_reports_count: int = 1
    status: str = "CONFIRMED_FRAUD_MULE"
    category: str = "INVOICE_REDIRECT_SCAM"
    source: str
    ingested_at: str


class IngestionPipelineResult(BaseModel):
    verification: NewsVerificationResult
    extracted_mules: list[MuleAccountRecord]
    records_added: int


# ============================================================================
# CANONICALIZATION & WHITELIST REGISTRIES
# ============================================================================

CANONICAL_BANKS: Dict[str, str] = {
    "MAYBANK": "MAYBANK",
    "MALAYAN BANKING": "MAYBANK",
    "MALAYAN BANKING BERHAD": "MAYBANK",
    "MBB": "MAYBANK",
    "CIMB": "CIMB",
    "CIMB BANK": "CIMB",
    "CIMB BANK BERHAD": "CIMB",
    "PUBLIC BANK": "PUBLIC_BANK",
    "PUBLIC_BANK": "PUBLIC_BANK",
    "PUBLIC BANK BERHAD": "PUBLIC_BANK",
    "PBB": "PUBLIC_BANK",
    "RHB": "RHB",
    "RHB BANK": "RHB",
    "RHB BANK BERHAD": "RHB",
    "HONG LEONG": "HONG_LEONG",
    "HONG LEONG BANK": "HONG_LEONG",
    "HONG_LEONG": "HONG_LEONG",
    "HLB": "HONG_LEONG",
    "AMBANK": "AMBANK",
    "AMBANK GROUP": "AMBANK",
    "AMBANK BERHAD": "AMBANK",
    "BSN": "BSN",
    "BANK SIMPANAN NASIONAL": "BSN",
    "BANK ISLAM": "BANK_ISLAM",
    "BANK_ISLAM": "BANK_ISLAM",
    "BANK MUAMALAT": "BANK_MUAMALAT",
    "BANK_MUAMALAT": "BANK_MUAMALAT",
    "ALLIANCE": "ALLIANCE_BANK",
    "ALLIANCE BANK": "ALLIANCE_BANK",
    "ALLIANCE_BANK": "ALLIANCE_BANK",
    "AFFIN": "AFFIN_BANK",
    "AFFIN BANK": "AFFIN_BANK",
    "AFFIN_BANK": "AFFIN_BANK",
    "OCBC": "OCBC_BANK",
    "OCBC BANK": "OCBC_BANK",
    "UOB": "UOB_BANK",
    "UOB BANK": "UOB_BANK",
    "STANDARD CHARTERED": "STANDARD_CHARTERED",
    "HSBC": "HSBC_BANK",
    "HSBC BANK": "HSBC_BANK",
}

CREDIBLE_DOMAINS: Set[str] = {
    "bernama.com",
    "thestar.com.my",
    "sinchew.com.my",
    "bharian.com.my",
    "rmp.gov.my",
    "nst.com.my",
    "astroawani.com",
    "hmetro.com.my",
    "malaysiakini.com",
    "freemalaysiatoday.com",
    "utusan.com.my",
    "scam.my",
}

SUSPICIOUS_INDICATORS: List[str] = [
    "satire",
    "prank",
    "parody",
    "hoax",
    "forum post",
    "unverified rumor",
    "rumour",
    "gossip",
    "conspiracy",
    "defamation",
    "fake news",
    "reddit",
    "lowyat",
    "blogspot",
    "wordpress",
    "telegram channel",
]

POLICE_AUTHORITY_KEYWORDS: List[str] = [
    "pdrm",
    "jsjk",
    "ccid",
    "bukit aman",
    "semakmule",
    "semak mule",
    "polis diraja malaysia",
    "commercial crime",
    "nsrc",
    "997",
]

# In-memory fast cache storage for runtime instances
IN_MEMORY_SEMAKMULE_CACHE: Dict[str, MuleAccountRecord] = {}


# ============================================================================
# NORMALIZATION UTILITIES
# ============================================================================

def canonicalize_bank_name(raw_name: str) -> str:
    """Canonicalize bank name to standard uppercase enum/token."""
    if not raw_name:
        return "UNKNOWN_BANK"
    cleaned = re.sub(r"[^A-Za-z0-9\s]", " ", raw_name).strip().upper()
    cleaned = re.sub(r"\s+", " ", cleaned)

    if cleaned in CANONICAL_BANKS:
        return CANONICAL_BANKS[cleaned]

    for k, v in CANONICAL_BANKS.items():
        if k in cleaned or cleaned in k:
            return v

    return cleaned.replace(" ", "_")


def normalize_account_digits(acc: Any) -> Optional[str]:
    """
    Normalizes bank account digits: strips non-numeric characters, hyphens, and whitespace.
    Validates Malaysian banking digit length invariant (9-16 digits).
    Returns normalized string or None if invalid.
    """
    if not acc:
        return None
    digits = re.sub(r"\D", "", str(acc).split(".")[0]).strip()
    if 9 <= len(digits) <= 16:
        return digits
    return None


def get_semakmule_cache_path() -> Path:
    """Locate semakmule_cache.json relative to repository structure."""
    possible_paths = [
        Path(__file__).resolve().parent.parent / "data" / "semakmule_cache.json",
        Path("backend/data/semakmule_cache.json"),
        Path("data/semakmule_cache.json"),
    ]
    for p in possible_paths:
        if p.exists():
            return p.resolve()
    # Default fallback
    target = Path(__file__).resolve().parent.parent / "data" / "semakmule_cache.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    return target.resolve()


def load_semakmule_cache_data() -> Dict[str, Any]:
    """Safely loads backend/data/semakmule_cache.json from disk."""
    cache_path = get_semakmule_cache_path()
    if cache_path.exists():
        try:
            return json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.error(f"Error loading semakmule cache from disk: {exc}")
    return {
        "source": "Royal Malaysia Police (PDRM) CCID SemakMule Financial Fraud Registry",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "records_count": 0,
        "blacklisted_accounts": [],
        "records": [],
    }


def hydrate_cache_atomically(records: List[MuleAccountRecord]) -> int:
    """
    Appends valid records to cache["records"] and cache["blacklisted_accounts"],
    updates cache["updated_at"], and writes atomically back to disk.
    Also synchronizes in-memory caches across the runtime.
    """
    if not records:
        return 0

    cache_path = get_semakmule_cache_path()
    cache_data = load_semakmule_cache_data()

    existing_records = cache_data.setdefault("records", [])
    blacklisted = cache_data.setdefault("blacklisted_accounts", [])

    existing_accs: Set[str] = set()
    for item in existing_records:
        if isinstance(item, dict) and "account_no" in item:
            existing_accs.add(str(item["account_no"]))
    for item in blacklisted:
        if isinstance(item, dict) and "account_no" in item:
            existing_accs.add(str(item["account_no"]))

    added_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for rec in records:
        acc = rec.account_no
        # 1. Update module in-memory cache
        IN_MEMORY_SEMAKMULE_CACHE[acc] = rec

        # 2. Update reconciliation in-memory cache if active
        try:
            import backend.services.reconciliation as recon
            recon.KNOWN_SEMAKMULE_ACCOUNTS.add(acc)
            if recon._CACHED_SEMAKMULE is not None:
                recon._CACHED_SEMAKMULE.add(acc)
        except Exception:
            pass

        # 3. Update app config in-memory cache if active
        try:
            import backend.app.config as cfg
            cfg.KNOWN_SEMAKMULE_ACCOUNTS.add(acc)
        except Exception:
            pass

        # 4. Append to JSON store if not duplicate
        if acc not in existing_accs:
            existing_records.append(rec.model_dump())
            blacklisted.append({
                "account_no": acc,
                "bank_name": rec.bank_name,
                "report_count": rec.police_reports_count,
                "category": rec.category,
                "status": rec.status,
            })
            existing_accs.add(acc)
            added_count += 1

    cache_data["updated_at"] = now_iso
    cache_data["last_updated"] = now_iso
    cache_data["records_count"] = len(blacklisted)

    # Atomic write via temporary file
    temp_file = cache_path.with_suffix(".tmp")
    try:
        temp_file.write_text(json.dumps(cache_data, indent=2), encoding="utf-8")
        os.replace(temp_file, cache_path)
    except Exception as exc:
        logger.error(f"Failed atomic write to {cache_path}: {exc}")
        if temp_file.exists():
            try:
                temp_file.unlink()
            except Exception:
                pass
        raise exc

    return added_count


# ============================================================================
# DETERMINISTIC OFFLINE / RESILIENCE EXTRACTOR
# ============================================================================

def _detect_publisher_from_url(source_url: str) -> str:
    """Extract human-readable publisher name from URL domain."""
    try:
        parsed = urlparse(source_url)
        domain = parsed.netloc.lower() or source_url.lower()
        if "bernama.com" in domain:
            return "Bernama (Malaysian National News Agency)"
        if "thestar.com.my" in domain:
            return "The Star Online"
        if "sinchew.com.my" in domain:
            return "Sin Chew Daily"
        if "bharian.com.my" in domain:
            return "Berita Harian"
        if "rmp.gov.my" in domain:
            return "Royal Malaysia Police (PDRM) Official Portal"
        if "nst.com.my" in domain:
            return "New Straits Times"
        if "astroawani.com" in domain:
            return "Astro Awani"
        if "hmetro.com.my" in domain:
            return "Harian Metro"
        if "malaysiakini.com" in domain:
            return "Malaysiakini"
        if "freemalaysiatoday.com" in domain:
            return "Free Malaysia Today"
        return domain or "Unknown Domain"
    except Exception:
        return "Unknown Publisher"


def _verify_offline_heuristics(
    headline: str,
    source_url: str,
    content: str,
) -> NewsVerificationResult:
    """
    Deterministic offline heuristic authenticity verifier.
    Checks domain whitelist and institutional police citations.
    """
    url_lower = source_url.lower()
    combined_text = f"{headline} {content}".lower()

    # Detect domain
    parsed = urlparse(source_url)
    domain = parsed.netloc.lower() or url_lower
    is_whitelisted_domain = any(cred in domain for cred in CREDIBLE_DOMAINS)

    # Detect police authority citations
    has_police_citation = any(kw in combined_text for kw in POLICE_AUTHORITY_KEYWORDS)

    # Detect suspicious indicators (satire, unverified blog, rumor)
    has_suspicious_indicator = any(
        kw in combined_text or kw in url_lower for kw in SUSPICIOUS_INDICATORS
    )

    detected_pub = _detect_publisher_from_url(source_url)

    if has_suspicious_indicator:
        return NewsVerificationResult(
            is_authentic=False,
            status=VerificationStatus.SUSPECTED_FAKE_NEWS,
            confidence_score=0.10,
            source_credibility_reasoning=(
                "Suspected fake news, satire, prank, or malicious blog post detected. "
                "Text contains explicit markers of non-accredited or defamatory communication."
            ),
            detected_publisher=detected_pub,
        )

    if is_whitelisted_domain and has_police_citation:
        return NewsVerificationResult(
            is_authentic=True,
            status=VerificationStatus.AUTHENTIC_PDRM_REPORT,
            confidence_score=0.96,
            source_credibility_reasoning=(
                f"Verified authentic institutional report from accredited publisher ({detected_pub}) "
                "citing Royal Malaysia Police (PDRM) CCID authorities."
            ),
            detected_publisher=detected_pub,
        )

    if is_whitelisted_domain and not has_police_citation:
        return NewsVerificationResult(
            is_authentic=False,
            status=VerificationStatus.UNVERIFIED_SOURCE,
            confidence_score=0.45,
            source_credibility_reasoning=(
                "Publisher is a recognized media portal, but the content lacks direct attribution "
                "to PDRM CCID or official law enforcement officers."
            ),
            detected_publisher=detected_pub,
        )

    # Non-whitelisted domain / unverified source
    return NewsVerificationResult(
        is_authentic=False,
        status=VerificationStatus.UNVERIFIED_SOURCE,
        confidence_score=0.30,
        source_credibility_reasoning=(
            f"Source domain ({domain}) is not in the accredited Malaysian institutional whitelist. "
            "Unverified external source cannot be used to poison the SemakMule threat cache."
        ),
        detected_publisher=detected_pub,
    )


def _extract_mules_offline_regex(content: str, source_url: str) -> List[MuleAccountRecord]:
    """
    Deterministic offline regex entity extractor for authentic reports.
    Extracts bank names and adjacent 9-16 digit account numbers.
    """
    records: List[MuleAccountRecord] = []
    seen_accounts: Set[str] = set()
    now_iso = datetime.now(timezone.utc).isoformat()

    # Pattern 1: Bank name followed by account digits
    # e.g., "Maybank accounts 5140-1299-4821 and CIMB 888102938472"
    p1 = re.compile(
        r"\b(Maybank|CIMB(?: Bank)?|Public Bank|RHB(?: Bank)?|Hong Leong(?: Bank)?|AmBank|BSN|Bank Islam|Bank Muamalat|Alliance Bank|Affin Bank)\b"
        r"(?:[\w\s]{0,25}?)"
        r"(?:[:\-]?\s*)"
        r"\b([0-9]{3,6}[-\s]?[0-9]{3,6}[-\s]?[0-9]{3,6})\b",
        re.IGNORECASE,
    )
    for m in p1.finditer(content):
        bank_raw, acc_raw = m.group(1), m.group(2)
        norm_acc = normalize_account_digits(acc_raw)
        if norm_acc and norm_acc not in seen_accounts:
            seen_accounts.add(norm_acc)
            records.append(
                MuleAccountRecord(
                    account_no=norm_acc,
                    bank_name=canonicalize_bank_name(bank_raw),
                    police_reports_count=1,
                    status="CONFIRMED_FRAUD_MULE",
                    category="INVOICE_REDIRECT_SCAM",
                    source=source_url,
                    ingested_at=now_iso,
                )
            )

    # Pattern 2: Account digits followed by bank name
    # e.g., "5140-1299-4821 (Maybank)" or "5140-1299-4821 under Maybank"
    p2 = re.compile(
        r"\b([0-9]{3,6}[-\s]?[0-9]{3,6}[-\s]?[0-9]{3,6})\b"
        r"(?:[\w\s\(\)]{0,20}?)"
        r"\b(Maybank|CIMB(?: Bank)?|Public Bank|RHB(?: Bank)?|Hong Leong(?: Bank)?|AmBank|BSN|Bank Islam|Bank Muamalat|Alliance Bank|Affin Bank)\b",
        re.IGNORECASE,
    )
    for m in p2.finditer(content):
        acc_raw, bank_raw = m.group(1), m.group(2)
        norm_acc = normalize_account_digits(acc_raw)
        if norm_acc and norm_acc not in seen_accounts:
            seen_accounts.add(norm_acc)
            records.append(
                MuleAccountRecord(
                    account_no=norm_acc,
                    bank_name=canonicalize_bank_name(bank_raw),
                    police_reports_count=1,
                    status="CONFIRMED_FRAUD_MULE",
                    category="INVOICE_REDIRECT_SCAM",
                    source=source_url,
                    ingested_at=now_iso,
                )
            )

    return records


# ============================================================================
# GEMINI 2.5 FLASH PROMPT BLUEPRINTS
# ============================================================================

STAGE1_VERIFICATION_SYSTEM_PROMPT = """You are an OSINT Threat Intelligence Verification Agent specializing in Malaysian cybersecurity, police intelligence, and commercial crime syndicates.
Your primary directive is to defend downstream threat intelligence caches against poisoning, defamation, unverified satire, and fake news.

Evaluate the incoming intelligence stream enclosed inside <UNTRUSTED_INTEL_STREAM>.
Check whether:
1. It originates from an accredited institutional or major news publisher (e.g. Bernama, The Star, Sin Chew, Berita Harian, RMP official portal, NST, Astro Awani).
2. It cites authentic police / institutional entities (PDRM, JSJK, Bukit Aman, CCID, NSRC 997, SemakMule).
3. It exhibits credible journalistic structure and factual tone, free from sensationalist hearsay, forum gossip, satire, or defamatory personal attacks.

Classification Rules:
- If authentic report from credible publisher citing official police sources:
  status = "AUTHENTIC_PDRM_REPORT", is_authentic = true, confidence_score >= 0.85
- If unverified forum post, personal blog, social media rumor, or unverified source:
  status = "UNVERIFIED_SOURCE", is_authentic = false, confidence_score < 0.60
- If satirical post, hoax, prank, malicious defamation, or fabricated news:
  status = "SUSPECTED_FAKE_NEWS", is_authentic = false, confidence_score <= 0.30

Respond STRICTLY in JSON format with these exact keys:
{
  "is_authentic": <bool>,
  "status": "<AUTHENTIC_PDRM_REPORT | UNVERIFIED_SOURCE | SUSPECTED_FAKE_NEWS>",
  "confidence_score": <float between 0.0 and 1.0>,
  "source_credibility_reasoning": "<concise evidentiary rationale>",
  "detected_publisher": "<publisher name>"
}
"""

STAGE2_EXTRACTION_SYSTEM_PROMPT = """You are a Forensic Entity Extraction Agent.
Your job is to extract verified bank account numbers and financial institutions associated with mule accounts mentioned in this authentic police report.

Rules:
1. Extract all bank account numbers mentioned as mule accounts, syndicate accounts, or fraudulent receiving accounts.
2. For each account, extract:
   - account_no: the raw account number string as appears in text
   - bank_name: the associated banking institution (e.g., Maybank, CIMB, Public Bank, RHB, Hong Leong, AmBank, BSN)
   - police_reports_count: integer of reports if mentioned (default 1)
   - category: scam category if mentioned (default: INVOICE_REDIRECT_SCAM)
3. Do NOT extract corporate official accounts, victim accounts, or police hotline numbers.
4. If no mule bank accounts are mentioned, return an empty array for extracted_accounts.

Respond STRICTLY in JSON format matching this schema:
{
  "extracted_accounts": [
    {
      "account_no": "<string>",
      "bank_name": "<string>",
      "police_reports_count": <int>,
      "category": "<string>"
    }
  ]
}
"""


# ============================================================================
# CORE PIPELINE EXECUTION
# ============================================================================

def verify_and_ingest_police_news(
    headline: str,
    source_url: str,
    content: str,
    force_mock: bool = False,
) -> IngestionPipelineResult:
    """
    Execute 2-Stage OSINT Police News Verification & Ingestion Pipeline:
      1. Bounded execution: Encapsulates untrusted input in <UNTRUSTED_INTEL_STREAM>.
      2. Stage 1: Authenticity Verification & Source Credibility Gate.
         If is_authentic is False or confidence_score < 0.80, abort immediately (0 cache writes).
      3. Stage 2: Entity Extraction, bank canonicalization & digit normalization.
      4. Atomic Cache Hydration: Updates semakmule_cache.json and in-memory caches.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    use_live_gemini = bool(api_key) and not force_mock

    verification: NewsVerificationResult

    # -------------------------------------------------------------------------
    # STAGE 1: NEWS AUTHENTICITY GATE
    # -------------------------------------------------------------------------
    if use_live_gemini:
        try:
            client = genai.Client(api_key=api_key)
            bounded_text = f"""<UNTRUSTED_INTEL_STREAM>
HEADLINE: {headline}
SOURCE_URL: {source_url}
CONTENT:
{content}
</UNTRUSTED_INTEL_STREAM>"""

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                system_instruction=STAGE1_VERIFICATION_SYSTEM_PROMPT,
            )

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[bounded_text],
                config=config,
            )
            raw_text = resp.text.strip() if resp.text else "{}"
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            data = json.loads(raw_text.strip())
            verification = NewsVerificationResult(**data)
        except Exception as exc:
            logger.warning(f"Live Gemini Stage 1 call failed ({exc}). Falling back to heuristics.")
            verification = _verify_offline_heuristics(headline, source_url, content)
    else:
        verification = _verify_offline_heuristics(headline, source_url, content)

    # Security Barrier: Abort immediately if verification gate fails
    if not verification.is_authentic or verification.confidence_score < 0.80:
        return IngestionPipelineResult(
            verification=verification,
            extracted_mules=[],
            records_added=0,
        )

    # -------------------------------------------------------------------------
    # STAGE 2: STRUCTURED ENTITY EXTRACTION
    # -------------------------------------------------------------------------
    extracted_records: List[MuleAccountRecord] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    if use_live_gemini:
        try:
            client = genai.Client(api_key=api_key)
            bounded_text = f"""<UNTRUSTED_INTEL_STREAM>
HEADLINE: {headline}
SOURCE_URL: {source_url}
CONTENT:
{content}
</UNTRUSTED_INTEL_STREAM>"""

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                system_instruction=STAGE2_EXTRACTION_SYSTEM_PROMPT,
            )

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[bounded_text],
                config=config,
            )
            raw_text = resp.text.strip() if resp.text else "{}"
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text.strip())
            accounts_list = parsed.get("extracted_accounts", [])

            seen_accs: Set[str] = set()
            for item in accounts_list:
                raw_acc = item.get("account_no", "")
                norm_acc = normalize_account_digits(raw_acc)
                if norm_acc and norm_acc not in seen_accs:
                    seen_accs.add(norm_acc)
                    extracted_records.append(
                        MuleAccountRecord(
                            account_no=norm_acc,
                            bank_name=canonicalize_bank_name(item.get("bank_name", "")),
                            police_reports_count=int(item.get("police_reports_count", 1)),
                            status="CONFIRMED_FRAUD_MULE",
                            category=item.get("category", "INVOICE_REDIRECT_SCAM"),
                            source=source_url,
                            ingested_at=now_iso,
                        )
                    )
        except Exception as exc:
            logger.warning(f"Live Gemini Stage 2 call failed ({exc}). Falling back to regex extraction.")
            extracted_records = _extract_mules_offline_regex(content, source_url)
    else:
        extracted_records = _extract_mules_offline_regex(content, source_url)

    # -------------------------------------------------------------------------
    # ATOMIC CACHE HYDRATION
    # -------------------------------------------------------------------------
    records_added = 0
    if extracted_records:
        records_added = hydrate_cache_atomically(extracted_records)

    return IngestionPipelineResult(
        verification=verification,
        extracted_mules=extracted_records,
        records_added=records_added,
    )
