import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure workspace root is on sys.path
workspace_root = Path(__file__).resolve().parent.parent.parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

from backend.app.main import app

@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)

@pytest.fixture
def clean_pdf_bytes():
    """Minimal valid ISO 32000-1 PDF bytes."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n"
        b"<< /Producer (SAP NetWeaver ERP) /CreationDate (D:20261005120000Z) /ModDate (D:20261005120000Z) >>\n"
        b"endobj\n"
        b"trailer\n"
        b"<< /Root 1 0 R >>\n"
        b"%%EOF\n"
    )

@pytest.fixture
def tampered_pdf_bytes():
    """PDF bytes with consumer tool signature and desync dates."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n"
        b"<< /Producer (iLovePDF Web Tool) /CreationDate (D:20261001100000Z) /ModDate (D:20261005180000Z) >>\n"
        b"endobj\n"
        b"trailer\n"
        b"<< /Root 1 0 R >>\n"
        b"%%EOF\n"
    )

@pytest.fixture
def corrupted_bytes():
    """Corrupted binary bytes without proper PDF headers."""
    return b"CORRUPTED_NON_PDF_PAYLOAD_WITHOUT_PROPER_HEADER"
