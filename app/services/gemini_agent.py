"""Agent 2: Cognitive Cyber Threat Analyst powered by Google Gemini 2.5 Flash.

Performs psycho-social forensic analysis, detecting Business Email Compromise (BEC),
CEO fraud, invoice redirection, artificial urgency, and secrecy pretexts.
Includes offline keyword-based fallback heuristics for zero-fail resilience.
"""

import json
import logging
import os
import re
from typing import List, Optional
from pydantic import BaseModel, Field

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiAnalysis(BaseModel):
    """Structured forensic analysis schema returned by Gemini Agent 2."""

    is_suspicious: bool = Field(
        ...,
        description="Whether the correspondence exhibits social engineering, BEC, or fraud indicators.",
    )
    cues: List[str] = Field(
        default_factory=list,
        description="Forensic threat cues identified (e.g. 'CISA_URGENCY', 'INVOICE_REDIRECT', 'CEO_FRAUD').",
    )
    threat_summary: str = Field(
        ...,
        description="Concise cognitive threat assessment explaining observed psychological manipulation.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score in the cognitive threat assessment (0.0 to 1.0).",
    )


class GeminiCognitiveAgent:
    """Agent 2: Cognitive Cyber Threat Analyst utilizing Gemini 2.5 Flash with offline resilience."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash") -> None:
        """Initialize Gemini Cognitive Agent with API key and target model."""
        self.api_key = (api_key or os.getenv("GEMINI_API_KEY", "")).strip()
        self.model = model
        self._client: Optional[genai.Client] = None
        if self._is_valid_api_key(self.api_key):
            try:
                self._client = genai.Client(api_key=self.api_key)
                logger.info("GeminiCognitiveAgent initialized with Gemini 2.5 Flash client.")
            except Exception as e:
                logger.warning("Could not initialize Gemini Client: %s", e)
                self._client = None

    @staticmethod
    def _is_valid_api_key(key: str) -> bool:
        """Check whether the provided API key appears to be a legitimate non-placeholder key."""
        if not key:
            return False
        key_lower = key.lower()
        dummy_markers = ["dummy", "placeholder", "your_gemini_api_key", "test", "none", "null"]
        if any(marker in key_lower for marker in dummy_markers):
            return False
        return len(key) >= 15

    def analyze_correspondence(
        self,
        sanitized_text: str,
        subject: str,
        active_threat_trends: Optional[List[str]] = None,
    ) -> GeminiAnalysis:
        """Analyze sanitized email text and subject for BEC, CEO fraud, urgency, and invoice fraud.

        Uses gemini-2.5-flash with structured JSON output matching GeminiAnalysis.
        Falls back to local heuristic keyword analysis if API key is absent or an error occurs.
        """
        trends = active_threat_trends or []
        if not self._client:
            return self._heuristic_fallback(
                sanitized_text,
                subject,
                active_threat_trends=trends,
                reason="GEMINI_API_KEY not configured or offline demo mode",
            )

        trends_context = ""
        if trends:
            trends_context = (
                "\n\nCURRENT ACTIVE LOCAL THREAT INTELLIGENCE (PDRM / NSRC ADVISORIES):\n"
                + "\n".join(f"- {t}" for t in trends)
                + "\nNote: Compare correspondence against these active modus operandi trends."
            )

        prompt = (
            "You are Agent 2 (Cognitive Cyber Threat Analyst) in a zero-trust multi-agent SOC defense system. "
            "Inspect the following inbound email (which has already been sanitized of statutory PII) for "
            "cyber threats: Business Email Compromise (BEC), CEO/Executive fraud, invoice redirection, "
            "artificial urgency, coercive language, confidential/secrecy pretexts, and bank detail modification.\n\n"
            f"EMAIL SUBJECT: {subject}\n"
            f"SANITIZED EMAIL BODY:\n{sanitized_text}"
            f"{trends_context}\n\n"
            "Evaluate whether this correspondence is suspicious. List specific forensic cue codes in 'cues' "
            "(include 'CISA_URGENCY' if artificial pressure/deadlines exist, 'INVOICE_REDIRECT' if bank swap is requested, "
            "'CEO_FRAUD' if executive coercion or secrecy pretext is used, 'CTI_TREND_MATCH' if aligned with trending MO). "
            "Provide a crisp threat summary and a confidence score between 0.0 and 1.0."
        )

        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiAnalysis,
                temperature=0.1,
            )
            response = self._client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )

            # 1. Direct parsed object
            if hasattr(response, "parsed") and isinstance(response.parsed, GeminiAnalysis):
                return response.parsed

            # 2. Parsed dictionary
            if hasattr(response, "parsed") and isinstance(response.parsed, dict):
                return GeminiAnalysis.model_validate(response.parsed)

            # 3. Text JSON validation
            if response.text:
                return GeminiAnalysis.model_validate_json(response.text)

            raise ValueError("Empty or unparsable response from Gemini API")

        except Exception as exc:
            logger.warning("Gemini analysis error (%s). Gracefully falling back to offline heuristics.", exc)
            return self._heuristic_fallback(
                sanitized_text,
                subject,
                active_threat_trends=trends,
                reason=f"Gemini API fallback: {exc}",
            )

    def _heuristic_fallback(
        self,
        sanitized_text: str,
        subject: str,
        active_threat_trends: Optional[List[str]] = None,
        reason: str = "",
    ) -> GeminiAnalysis:
        """Deterministic offline fallback analyzing CISA urgency, invoice redirection, and CEO fraud keywords."""
        content = f"{subject} {sanitized_text}".lower()
        cues: List[str] = []

        # CISA Urgency & Coercion Patterns
        urgency_patterns = [
            r"\b(urgent|urgency|immediately|immediate|critical urgent)\b",
            r"\b(frozen|freezing|freeze|penalty|penalties|stoppage)\b",
            r"\b(24 hours|48 hours|5:00 pm|4:00 pm|today|expedite)\b",
        ]
        matched_urgency_count = sum(1 for pat in urgency_patterns if re.search(pat, content))
        if matched_urgency_count >= 1:
            cues.append("CISA_URGENCY")

        # Invoice Redirection Patterns
        redirect_patterns = [
            r"\b(change of (beneficiary |bank )?details|migration|migrated|audit settlement)\b",
            r"\b(new bank account|backup account|remit.*immediately|updated account details|banking operations)\b",
            r"\b(supplier account swap|payment instructions|wire.*promptly|clearing account|alternate account)\b",
        ]
        if any(re.search(pat, content) for pat in redirect_patterns):
            cues.append("INVOICE_REDIRECT")

        # CEO / Executive Fraud & Secrecy Patterns
        exec_patterns = [
            r"\b(director|ceo|cfo|executive|managing director)\b",
            r"\b(confidential|strictly confidential|nda|secret|private acquisition)\b",
            r"\b(salary redirection|payroll update|personal wire|advance deposit)\b",
        ]
        if any(re.search(pat, content) for pat in exec_patterns):
            cues.append("CEO_FRAUD")

        # CTI Trending Modus Operandi Matching
        cti_patterns = [
            r"\b(migration|branch maintenance|under maintenance|maintenance|secondary account)\b",
            r"\b(tax penalty|sst audit|lhdn penalty|penalty settlement)\b",
            r"\b(cash flow freeze|freeze bypass|urgent remit)\b",
        ]
        if any(re.search(pat, content) for pat in cti_patterns):
            cues.append("CTI_TREND_MATCH")

        is_suspicious = len(cues) > 0
        if is_suspicious:
            confidence = min(0.95, 0.60 + 0.10 * len(cues))
            cue_str = ", ".join(cues)
            threat_summary = (
                f"Cognitive threat cues detected ({cue_str}) indicating potential "
                f"Business Email Compromise (BEC), artificial urgency, or invoice redirection."
            )
        else:
            confidence = 0.90
            threat_summary = "Cognitive threat analysis indicates standard legitimate business correspondence."

        return GeminiAnalysis(
            is_suspicious=is_suspicious,
            cues=cues,
            threat_summary=threat_summary,
            confidence=confidence,
        )

