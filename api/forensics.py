import io
from pypdf import PdfReader

SUSPICIOUS_PRODUCERS = ["ilovepdf", "canva", "sejda", "photoshop", "foxit phantom"]

def inspect_pdf_metadata(pdf_bytes: bytes) -> dict:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata = reader.metadata or {}
        
        producer = str(metadata.get("/Producer", "")).strip()
        creator = str(metadata.get("/Creator", "")).strip()
        creation_date = str(metadata.get("/CreationDate", ""))
        mod_date = str(metadata.get("/ModDate", ""))
        
        is_tampered_tool = any(tool in producer.lower() or tool in creator.lower() for tool in SUSPICIOUS_PRODUCERS)
        timestamp_desync = bool(mod_date and creation_date and (mod_date != creation_date))
        
        producer_display = f"{producer or 'Unknown'} (Tampered)" if is_tampered_tool else (producer or "Official ERP Generator")
        if timestamp_desync:
            producer_display += " | ModDate Desync"
            
        return {
            "producer_string": producer_display,
            "is_tampered_tool": is_tampered_tool or timestamp_desync,
            "page_count": len(reader.pages)
        }
    except Exception:
        return {
            "producer_string": "Corrupted or Unparseable Binary",
            "is_tampered_tool": True,
            "page_count": 0
        }
