"""
Agent 1: In-Memory Privacy Sanitizer (RAM Layer)
=================================================
Synchronized service facade for Layer 1 Privacy Sanitization.
Re-exports core deterministic PII sanitization from backend.app.layers.layer1_privacy.
"""

from backend.app.layers.layer1_privacy import sanitize_pii

__all__ = ["sanitize_pii"]
