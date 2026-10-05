import io
import time
import re
from datetime import datetime
from typing import Dict, Any, Optional
from pypdf import PdfReader
from backend.app.config import SUSPICIOUS_PRODUCERS

def parse_pdf_date(date_str: str) -> Optional[datetime]:
    """Parse PDF format date strings like D:20261005120000Z or D:20261005120000+08'00'."""
    if not date_str:
        return None
    cleaned = date_str.replace("D:", "").replace("'", "")
    # Try standard prefixes YYYYMMDDHHMMSS
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

def extract_pdf_field_regex(text: str, field_name: str) -> str:
    """Extract metadata field using regex like /Producer (text)."""
    pattern = rf"/{field_name}\s*\(([^)]+)\)"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

def inspect_pdf_bytes(pdf_bytes: bytes, metadata_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    LAYER 2: Deterministic Binary Forensics (Agent 2)
    Validates ISO 32000-1 binary structure (<35ms SLA) and flags consumer PDF splicing.
    """
    start_time = time.perf_counter()
    
    if not pdf_bytes:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "is_valid_pdf_structure": False,
            "consumer_tool_detected": False,
            "timestamp_desync": False,
            "i_tamper": 1,
            "producer_string": "Missing or Empty PDF Bytes",
            "page_count": 0,
            "latency_ms": elapsed_ms,
        }
    
    # 1. Structural check: %PDF- header and %EOF trailer
    stripped = pdf_bytes.strip()
    has_header = stripped.startswith(b"%PDF-")
    has_trailer = (b"%EOF" in pdf_bytes[-1024:] or b"%%EOF" in pdf_bytes[-1024:])
    is_valid_structure = bool(has_header and has_trailer)
    
    # 2. Raw byte scan for consumer editing tools
    raw_lower = pdf_bytes.lower()
    tool_found_in_bytes = any(tool.encode() in raw_lower for tool in SUSPICIOUS_PRODUCERS)
    
    producer = "Official ERP Generator"
    creator = ""
    creation_date_str = ""
    mod_date_str = ""
    page_count = 1 if is_valid_structure else 0
    desync = False
    
    # Try parsing via pypdf
    parsed_via_pypdf = False
    if is_valid_structure:
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
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

    # Regex fallback if pypdf couldn't read (e.g., minimal stream fixture)
    raw_str = pdf_bytes.decode("latin1", errors="ignore")
    if not parsed_via_pypdf and is_valid_structure:
        p_regex = extract_pdf_field_regex(raw_str, "Producer")
        if p_regex:
            producer = p_regex
        c_regex = extract_pdf_field_regex(raw_str, "Creator")
        if c_regex:
            creator = c_regex
        cd_regex = extract_pdf_field_regex(raw_str, "CreationDate")
        if cd_regex:
            creation_date_str = cd_regex
        md_regex = extract_pdf_field_regex(raw_str, "ModDate")
        if md_regex:
            mod_date_str = md_regex

    # Timestamp desynchronization check
    c_date = parse_pdf_date(creation_date_str)
    m_date = parse_pdf_date(mod_date_str)
    if c_date and m_date:
        diff_seconds = abs((m_date - c_date).total_seconds())
        if diff_seconds > 3600:
            desync = True
    elif mod_date_str and creation_date_str and (mod_date_str != creation_date_str):
        desync = True

    # Allow simulated override or explicit test fixture hints
    if metadata_override:
        if "producer" in metadata_override:
            producer = metadata_override["producer"]
        if "timestamp_desync" in metadata_override:
            desync = bool(metadata_override["timestamp_desync"])
            
    # Check producer string against suspicious list
    producer_lower = producer.lower()
    creator_lower = creator.lower()
    consumer_tool_detected = (
        tool_found_in_bytes or
        any(tool in producer_lower for tool in SUSPICIOUS_PRODUCERS) or
        any(tool in creator_lower for tool in SUSPICIOUS_PRODUCERS)
    )
    
    # Deterministic tamper flag: i_tamper = 1 if consumer tool, desync, or corrupt
    i_tamper = 1 if (consumer_tool_detected or desync or not is_valid_structure) else 0
    
    producer_display = producer
    if consumer_tool_detected and "(Tampered)" not in producer_display:
        producer_display += " (Tampered)"
    if desync and "ModDate Desync" not in producer_display:
        producer_display += " | ModDate Desync"
        
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    return {
        "is_valid_pdf_structure": is_valid_structure,
        "consumer_tool_detected": consumer_tool_detected,
        "timestamp_desync": desync,
        "i_tamper": i_tamper,
        "producer_string": producer_display,
        "page_count": page_count,
        "latency_ms": elapsed_ms,
    }
