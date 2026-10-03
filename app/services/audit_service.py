"""Audit Service and Artifact Replay Defense for SME-ScamGuard-AI.

Provides:
- SHA-256 artifact hashing and duplicate / replay attack detection.
- Cryptographic hash-chain ledger management for tamper-evident audit logging.
- Verification utility for offline audit log tamper detection.
"""

from datetime import datetime
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# In-memory registry of seen artifact hashes: {sha256: {"timestamp": iso_str, "filename": str}}
SEEN_ARTIFACT_HASHES: Dict[str, dict] = {}

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def current_iso_timestamp() -> str:
    """Return current ISO formatted UTC/local timestamp."""
    return datetime.now().isoformat()


def compute_artifact_hash(file_bytes: bytes) -> str:
    """Compute hexadecimal SHA-256 hash of inbound file or text bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


def check_and_register_artifact(file_bytes: bytes, filename: str) -> dict:
    """Check if an artifact hash was previously seen (replay detection) and register it.

    Args:
        file_bytes: Raw binary content of document or text payload.
        filename: Name of the uploaded file or descriptor.

    Returns:
        Dictionary with artifact_hash, is_duplicate, first_seen_timestamp,
        original_filename, and status_badge.
    """
    sha256 = compute_artifact_hash(file_bytes)
    if sha256 in SEEN_ARTIFACT_HASHES:
        return {
            "artifact_hash": sha256,
            "is_duplicate": True,
            "first_seen_timestamp": SEEN_ARTIFACT_HASHES[sha256]["timestamp"],
            "original_filename": SEEN_ARTIFACT_HASHES[sha256]["filename"],
            "status_badge": "WARNING: DUPLICATE / REPLAY DETECTED",
        }
    else:
        ts = current_iso_timestamp()
        SEEN_ARTIFACT_HASHES[sha256] = {"timestamp": ts, "filename": filename}
        return {
            "artifact_hash": sha256,
            "is_duplicate": False,
            "first_seen_timestamp": None,
            "original_filename": filename,
            "status_badge": "PASS: UNIQUE ARTIFACT (NEW)",
        }


def compute_record_hash(record: dict, prev_hash: str = GENESIS_HASH) -> str:
    """Compute cryptographic hash of an audit record chained with previous block hash."""
    clean_dict = {
        k: v for k, v in record.items() if k not in ("record_hash", "prev_hash")
    }
    clean_dict["prev_hash"] = prev_hash
    canonical_repr = json.dumps(clean_dict, sort_keys=True, default=str)
    return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()


def get_audit_file_path() -> Path:
    """Resolve absolute path to data/audits.json."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    return base_dir / "data" / "audits.json"


def append_local_audit(report_dict: dict) -> None:
    """Append audit record locally to ./data/audits.json with SHA-256 hash chaining."""
    audit_file = get_audit_file_path()
    audit_file.parent.mkdir(parents=True, exist_ok=True)
    records: List[dict] = []

    if audit_file.exists():
        try:
            with open(audit_file, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, list):
                    records = loaded
        except Exception as exc:
            logger.warning("Error reading audit file %s: %s", audit_file, exc)
            records = []

    prev_hash = GENESIS_HASH
    if records:
        # Latest record is at index 0
        prev_hash = records[0].get("record_hash") or GENESIS_HASH

    record_to_save = dict(report_dict)
    record_to_save["persisted_at"] = current_iso_timestamp()
    record_to_save["prev_hash"] = prev_hash
    record_to_save["record_hash"] = compute_record_hash(record_to_save, prev_hash=prev_hash)

    records.insert(0, record_to_save)
    records = records[:200]

    try:
        with open(audit_file, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, default=str)
    except Exception as exc:
        logger.warning("Could not persist audit record to %s: %s", audit_file, exc)


def verify_audit_integrity(audit_records: Optional[List[dict]] = None) -> bool:
    """Verify cryptographic SHA-256 hash chain integrity of audit records.

    Args:
        audit_records: Optional list of audit records. If None, loaded from data/audits.json.

    Returns:
        True if all record hashes and chain links are strictly intact, False otherwise.
    """
    if audit_records is None:
        audit_file = get_audit_file_path()
        if not audit_file.exists():
            return True
        try:
            with open(audit_file, "r", encoding="utf-8") as f:
                audit_records = json.load(f)
        except Exception as exc:
            print(f"AUDIT INTEGRITY: TAMPER DETECTED: Unable to read file ({exc})")
            logger.error("AUDIT INTEGRITY: TAMPER DETECTED: Unable to read file: %s", exc)
            return False

    if not audit_records:
        return True

    # Audit records are stored newest first (index 0 is newest, index -1 is oldest)
    # Check each record's computed hash against its stored record_hash
    for idx, record in enumerate(audit_records):
        stored_hash = record.get("record_hash")
        # If legacy record without hash, skip or verify if present
        if not stored_hash:
            continue

        prev_hash = record.get("prev_hash", GENESIS_HASH)
        expected_hash = compute_record_hash(record, prev_hash=prev_hash)

        if stored_hash != expected_hash:
            msg = (
                f"AUDIT INTEGRITY: TAMPER DETECTED at index {idx} "
                f"(Case: {record.get('case_id')}). Expected hash {expected_hash}, got {stored_hash}."
            )
            print(msg)
            logger.error(msg)
            return False

        # Linkage check: record[idx]["prev_hash"] must match record[idx + 1]["record_hash"]
        if idx + 1 < len(audit_records):
            next_record = audit_records[idx + 1]
            next_hash = next_record.get("record_hash")
            if next_hash and prev_hash != next_hash:
                msg = (
                    f"AUDIT INTEGRITY: TAMPER DETECTED: Broken hash chain linkage between "
                    f"index {idx} and {idx + 1}."
                )
                print(msg)
                logger.error(msg)
                return False

    return True
