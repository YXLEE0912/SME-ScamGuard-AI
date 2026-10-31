"""
Agent 2: Deterministic Binary Forensics (Byte Layer)
====================================================
Conducts ISO 32000-1-informed static structural inspection of invoice PDF byte streams
using pypdf coupled with raw byte-offset analysis.

Implements:
1. Metadata Dictionary Extraction (/Producer, /Creator, /CreationDate, /ModDate).
2. Modification Timestamp Delta Anomaly (Δt > 3600 seconds).
3. Raw byte-level scanning for incremental update trailers (%%EOF).
4. Dual-Factor Benign Tooling Rule for SME utilities (Canva, iLovePDF, Sejda).
"""

import io
import re
import time
from datetime import datetime
from typing import Dict, Any, Optional

from pypdf import PdfReader
from backend.models.schema import BinaryForensicResult

BENIGN_CONSUMER_TOOLS = {
    "canva",
    "canva web export",
    "ilovepdf",
    "ilovepdf online tool",
    "sejda",
    "sejda pdf editor",
    "pdf24",
}

SUSPICIOUS_TOOLS = {
    "photoshop",
    "adobe photoshop",
    "pdfescape",
    "foxit phantompdf",
    "smallpdf",
    "nitro pdf",
}


def parse_pdf_date(date_str: str) -> Optional[datetime]:
    """Parse PDF format date strings like D:20261005120000Z or D:20261005120000+08'00'."""
    if not date_str:
        return None
    cleaned = date_str.replace("D:", "").replace("'", "")
    match = re.match(r"^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})", cleaned)
    if match:
        try:
            year, month, day, hour, minute, second = map(int, match.groups())
            return datetime(year, month, day, hour, minute, second)
        except Exception:
            return None
    match_short = re.match(r"^(\d{4})(\d{2})(\d{2})", cleaned)
    if match_short:
        try:
            year, month, day = map(int, match_short.groups())
            return datetime(year, month, day, 0, 0, 0)
        except Exception:
            return None
    return None


def inspect_pdf_structure(
    pdf_bytes: bytes,
    extracted_account: Optional[str] = None,
    approved_ledger_account: Optional[str] = None,
    metadata_override: Optional[Dict[str, Any]] = None,
) -> BinaryForensicResult:
    """
    Executes sub-millisecond ISO 32000-1 binary inspection of PDF payloads.
    Returns typed BinaryForensicResult contract.
    """
    if not pdf_bytes:
        return BinaryForensicResult(
            producer="Missing or Empty PDF Bytes",
            creation_date=None,
            mod_date=None,
            delta_seconds=None,
            eof_count=0,
            is_spliced=True,
            i_tamper=1,
            tool_tag="EMPTY_PAYLOAD_ANOMALY",
        )

    stripped = pdf_bytes.strip()
    has_header = stripped.startswith(b"%PDF-")
    eof_count = pdf_bytes.count(b"%%EOF")
    if eof_count == 0:
        eof_count = pdf_bytes.count(b"%EOF")
    is_spliced = eof_count > 1

    producer = "Enterprise ERP Generator"
    creator = ""
    creation_date_str = ""
    mod_date_str = ""
    parsed_via_pypdf = False

    if has_header and eof_count >= 1:
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            meta = reader.metadata or {}
            p = str(meta.get("/Producer", "")).strip()
            if p:
                producer = p
            creator = str(meta.get("/Creator", "")).strip()
            creation_date_str = str(meta.get("/CreationDate", ""))
            mod_date_str = str(meta.get("/ModDate", ""))
            parsed_via_pypdf = True
        except Exception:
            parsed_via_pypdf = False

    # Regex fallback if stream object parsing was obstructed
    if not parsed_via_pypdf and has_header:
        raw_str = pdf_bytes.decode("latin1", errors="ignore")
        p_match = re.search(r"/Producer\s*\(([^)]+)\)", raw_str, re.IGNORECASE)
        if p_match:
            producer = p_match.group(1).strip()
        c_match = re.search(r"/Creator\s*\(([^)]+)\)", raw_str, re.IGNORECASE)
        if c_match:
            creator = c_match.group(1).strip()
        cd_match = re.search(r"/CreationDate\s*\(([^)]+)\)", raw_str, re.IGNORECASE)
        if cd_match:
            creation_date_str = cd_match.group(1).strip()
        md_match = re.search(r"/ModDate\s*\(([^)]+)\)", raw_str, re.IGNORECASE)
        if md_match:
            mod_date_str = md_match.group(1).strip()

    # Apply test overrides if supplied
    if metadata_override:
        if "producer" in metadata_override:
            producer = metadata_override["producer"]
        if "creation_date" in metadata_override:
            creation_date_str = metadata_override["creation_date"]
        if "mod_date" in metadata_override:
            mod_date_str = metadata_override["mod_date"]

    # Calculate modification delta
    delta_seconds: Optional[float] = None
    c_date = parse_pdf_date(creation_date_str)
    m_date = parse_pdf_date(mod_date_str)
    desync = False

    if c_date and m_date:
        delta_seconds = abs((m_date - c_date).total_seconds())
        if delta_seconds > 3600.0:
            desync = True
    elif creation_date_str and mod_date_str and creation_date_str != mod_date_str:
        desync = True

    if metadata_override and metadata_override.get("timestamp_desync"):
        desync = True

    # Tool classification
    producer_lower = producer.lower()
    creator_lower = creator.lower()
    raw_lower = pdf_bytes.lower()

    is_benign_consumer = any(tool in producer_lower or tool in creator_lower for tool in BENIGN_CONSUMER_TOOLS) or \
                         any(tool.encode() in raw_lower for tool in BENIGN_CONSUMER_TOOLS)
    is_suspicious_editor = any(tool in producer_lower or tool in creator_lower for tool in SUSPICIOUS_TOOLS) or \
                           any(tool.encode() in raw_lower for tool in SUSPICIOUS_TOOLS)

    # Dual-Factor Benign Tooling Invariant (Proposal Section 4.3):
    # If producer is Canva / iLovePDF / Sejda:
    #   if extracted_account == approved_ledger_account: tool_penalty = 0, tag = CONSUMER_PDF_TOOL_BENIGN
    #   else: tool_penalty = 20, tag = ANOMALOUS_PDF_TOOL_UNAPPROVED_DESTINATION
    tool_tag = "AUTHENTIC_ERP_SIGNATURE"
    i_tamper = 0

    if is_benign_consumer:
        if extracted_account and approved_ledger_account and (extracted_account == approved_ledger_account):
            i_tamper = 0
            tool_tag = "CONSUMER_PDF_TOOL_BENIGN"
        else:
            i_tamper = 1
            tool_tag = "ANOMALOUS_PDF_TOOL_UNAPPROVED_DESTINATION"
    elif is_suspicious_editor:
        i_tamper = 1
        tool_tag = "SUSPICIOUS_IMAGE_EDITOR_DETECTED"
    elif desync:
        i_tamper = 1
        tool_tag = "TIMESTAMP_DESYNC_MODDATE_ANOMALY"
    elif is_spliced:
        i_tamper = 1
        tool_tag = "MULTIPLE_EOF_SPLICING_ANOMALY"

    return BinaryForensicResult(
        producer=producer,
        creation_date=creation_date_str or None,
        mod_date=mod_date_str or None,
        delta_seconds=delta_seconds,
        eof_count=eof_count,
        is_spliced=is_spliced,
        i_tamper=i_tamper,
        tool_tag=tool_tag,
    )

