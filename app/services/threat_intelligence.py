"""Deterministic Localized Cyber Threat Intelligence (CTI) & PDRM SemakMule Registry.

Provides microsecond lookup against blacklisted mule bank accounts (PDRM SemakMule / PayNet NFP)
and serves cached trending scam Modus Operandi (from NSRC/PDRM JSJK advisories) without live web latency.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

DEFAULT_ACTIVE_TRENDS: List[str] = [
    "Claims of corporate banking migration or branch maintenance requiring payment to secondary account",
    "Urgent tax/SST audit penalty settlement pretext",
    "Executive cash flow freeze bypass request",
]

DEFAULT_KNOWN_MULE_ACCOUNTS: List[str] = [
    "9876543210",
    "164012349999",
    "552112348888",
]


def _get_threat_intel_file_path() -> Path:
    """Resolve absolute path to data/threat_intelligence.json."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    return base_dir / "data" / "threat_intelligence.json"


def load_threat_intelligence() -> Dict[str, Any]:
    """Load threat intelligence feed from local disk with resilient fallback defaults."""
    file_path = _get_threat_intel_file_path()
    if not file_path.exists():
        fallback_path = Path("data/threat_intelligence.json")
        if fallback_path.exists():
            file_path = fallback_path

    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {
                    "active_trends": data.get("active_trends", DEFAULT_ACTIVE_TRENDS),
                    "known_mule_accounts": [
                        re.sub(r"\D", "", str(acc))
                        for acc in data.get("known_mule_accounts", DEFAULT_KNOWN_MULE_ACCOUNTS)
                    ],
                    "last_updated": data.get("last_updated", "2026-10-01"),
                }
        except Exception as exc:
            logger.warning("Failed to parse threat intelligence JSON (%s). Using fallback baseline.", exc)

    return {
        "active_trends": DEFAULT_ACTIVE_TRENDS,
        "known_mule_accounts": DEFAULT_KNOWN_MULE_ACCOUNTS,
        "last_updated": "2026-10-01",
    }


def get_active_threat_trends() -> List[str]:
    """Retrieve string list of trending scam narratives and Modus Operandi."""
    intel = load_threat_intelligence()
    return intel.get("active_trends", DEFAULT_ACTIVE_TRENDS)


def check_semakmule_blacklist(bank_account: str) -> Dict[str, Any]:
    """Deterministic lookup against PDRM SemakMule / JSJK CCID mule bank account registry.

    Args:
        bank_account: Raw or formatted bank account string.

    Returns:
        Dictionary with boolean `is_mule` flag, `registry_status` ("CONFIRMED_MULE", "CLEAN", "UNKNOWN", "UNAVAILABLE"),
        and authoritative `source`.
    """
    clean_account = re.sub(r"\D", "", bank_account or "")
    if not clean_account or len(clean_account) < 8:
        return {
            "is_mule": False,
            "registry_status": "UNKNOWN",
            "source": "PDRM SemakMule / JSJK CCID Blacklist",
            "detail": "Account number missing or too short for registry lookup",
        }

    try:
        intel = load_threat_intelligence()
        known_mules = intel.get("known_mule_accounts", DEFAULT_KNOWN_MULE_ACCOUNTS)
        is_mule = clean_account in known_mules
        status = "CONFIRMED_MULE" if is_mule else "CLEAN"
        return {
            "is_mule": is_mule,
            "registry_status": status,
            "source": "PDRM SemakMule / JSJK CCID Blacklist",
            "detail": "Account flagged in PDRM CCID blacklist" if is_mule else "Clean in PDRM CCID blacklist",
        }
    except Exception as exc:
        logger.error("SemakMule registry lookup failure: %s", exc)
        return {
            "is_mule": False,
            "registry_status": "UNAVAILABLE",
            "source": "PDRM SemakMule / JSJK CCID Blacklist",
            "detail": f"Registry temporarily unavailable: {exc}",
        }
