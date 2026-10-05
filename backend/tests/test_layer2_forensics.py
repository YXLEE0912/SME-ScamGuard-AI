from backend.app.layers.layer2_forensics import inspect_pdf_bytes

def test_clean_pdf_structure(clean_pdf_bytes):
    result = inspect_pdf_bytes(clean_pdf_bytes)
    assert result["is_valid_pdf_structure"] is True
    assert result["consumer_tool_detected"] is False
    assert result["i_tamper"] == 0
    assert result["timestamp_desync"] is False

def test_tampered_pdf_ilovepdf(tampered_pdf_bytes):
    result = inspect_pdf_bytes(tampered_pdf_bytes)
    assert result["consumer_tool_detected"] is True
    assert result["i_tamper"] == 1
    assert "iLovePDF" in result["producer_string"]

def test_canva_and_sejda_detection():
    canva_bytes = (
        b"%PDF-1.4\n1 0 obj\n<< /Producer (Canva Online PDF Service) >>\nendobj\n%%EOF"
    )
    result = inspect_pdf_bytes(canva_bytes)
    assert result["consumer_tool_detected"] is True
    assert result["i_tamper"] == 1

def test_timestamp_desync():
    # Desync by 5 days
    desync_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj\n"
        b"<< /Producer (Official Generator) /CreationDate (D:20261001000000Z) /ModDate (D:20261006120000Z) >>\n"
        b"endobj\n"
        b"%%EOF"
    )
    result = inspect_pdf_bytes(desync_bytes)
    assert result["timestamp_desync"] is True
    assert result["i_tamper"] == 1

def test_corrupted_payload_handling(corrupted_bytes):
    result = inspect_pdf_bytes(corrupted_bytes)
    assert result["is_valid_pdf_structure"] is False
    assert result["i_tamper"] == 1
