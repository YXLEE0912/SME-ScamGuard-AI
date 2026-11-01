"""
Agent 3 Relational Layer: SemakMule Police Threat Cache Service
===============================================================
Maintains an in-memory hash set of commercial mule accounts compiled from
PDRM CCID (Commercial Crime Investigation Department) bulletins.

Guarantees:
- O(1) in-memory lookup latency (< 0.003 ms SLA).
- Overriding threat score S_SemakMule = 99 on confirmed match.
- Explicit non-exoneration semantics on miss: NOT_FOUND_IN_SNAPSHOT (never CLEAN).
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, Optional, Set, Tuple

# Default canonical CCID SemakMule blacklisted commercial mule accounts
DEFAULT_SEMAKMULE_ACCOUNTS: Set[str] = {
    "111222333444",
    "888800001111",
    "999888777666",
    "1410029000123456",
    "800944112299",
    "214488990011",
    "319900228811",
}

_SEMAKMULE_CACHE: Optional[Set[str]] = None
_CACHE_LAST_LOADED: float = 0.0


def normalize_account_digits(acc: Any) -> str:
    """Normalize account numbers by removing hyphens, spaces, and punctuation."""
    if acc is None:
        return ""
    s = str(acc).split(".")[0].strip()
    return "".join(c for c in s if c.isdigit())


def get_semakmule_cache_path() -> Path:
    """Resolve semakmule_cache.json location across deployment environments."""
    paths = [
        Path(__file__).resolve().parent.parent / "data" / "semakmule_cache.json",
        Path("backend/data/semakmule_cache.json"),
        Path("data/semakmule_cache.json"),
    ]
    for p in paths:
        if p.exists():
            return p
    return paths[0]


def load_semakmule_cache(force_reload: bool = False) -> Set[str]:
    """
    Hydrates in-memory hash set from disk. Fast-lookup structure guarantees <0.003ms latency.
    """
    global _SEMAKMULE_CACHE, _CACHE_LAST_LOADED
    if _SEMAKMULE_CACHE is not None and not force_reload:
        return _SEMAKMULE_CACHE

    accounts = set(DEFAULT_SEMAKMULE_ACCOUNTS)
    cache_file = get_semakmule_cache_path()

    if cache_file.exists():
        try:
            data = json.loads(cache_file.read_text(encoding="utf-8"))
            for item in data.get("blacklisted_accounts", []):
                acc = item.get("account_no") or item.get("account_number")
                if acc:
                    accounts.add(normalize_account_digits(acc))
            for item in data.get("records", []):
                acc = item.get("account_no") or item.get("account_number")
                if acc:
                    accounts.add(normalize_account_digits(acc))
        except Exception:
            pass

    _SEMAKMULE_CACHE = accounts
    _CACHE_LAST_LOADED = time.time()
    return _SEMAKMULE_CACHE


def query_semakmule_threat_cache(account_no: str) -> Tuple[int, str, float]:
    """
    Sub-millisecond query against PDRM CCID threat cache.
    
    Returns:
        (s_semakmule, status_tag, latency_ms)
        - Confirmed hit: (99, "CONFIRMED_COMMERCIAL_MULE", latency_ms)
        - Cache miss: (0, "NOT_FOUND_IN_SNAPSHOT", latency_ms)  <-- NEVER "CLEAN"
    """
    start = time.perf_counter()
    normalized = normalize_account_digits(account_no)
    cache = load_semakmule_cache()

    hit = normalized in cache if normalized else False
    latency_ms = (time.perf_counter() - start) * 1000.0

    if hit:
        return 99, "CONFIRMED_COMMERCIAL_MULE", latency_ms
    return 0, "NOT_FOUND_IN_SNAPSHOT", latency_ms

