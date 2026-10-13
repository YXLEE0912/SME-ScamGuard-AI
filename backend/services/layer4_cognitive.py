"""
Agent 4: Cognitive Behavioral Investigator (Perception Layer)
============================================================
Synchronized service facade for Layer 4 Cognitive Investigation.
Re-exports prompt builder, LLM analyzer, and offline evaluator from backend.app.layers.layer4_cognitive.
"""

from backend.app.layers.layer4_cognitive import (
    build_quarantined_prompt,
    analyze_behavior_with_gemini,
    evaluate_offline_cognitive,
    URGENCY_KEYWORDS,
    INJECTION_PATTERNS,
)

__all__ = [
    "build_quarantined_prompt",
    "analyze_behavior_with_gemini",
    "evaluate_offline_cognitive",
    "URGENCY_KEYWORDS",
    "INJECTION_PATTERNS",
]
