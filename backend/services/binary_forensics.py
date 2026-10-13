"""
Agent 2: Deterministic Binary Forensics (Byte Layer)
===================================================
Synchronized service facade for Layer 2 Forensics.
Re-exports core deterministic PDF inspection from backend.app.layers.layer2_forensics.
"""

from backend.app.layers.layer2_forensics import inspect_pdf_bytes

__all__ = ["inspect_pdf_bytes"]
