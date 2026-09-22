"""Local-first, in-memory zero-trust PII sanitization service.

Guarantees that sensitive Personal Identifiable Information (PII) including
Malaysian MyKad identity numbers, contact mobile numbers, and bank account numbers
are sanitized in-memory before any downstream forensic processing or LLM telemetry.
"""

import re
from typing import List, Tuple
from app.models.schema import PIIRedactionLog

# Malaysian Statutory MyKad Identity Pattern: YYMMDD-PB-###G (6-2-4 digits)
MYKAD_PATTERN: re.Pattern = re.compile(r"\b\d{6}-\d{2}-\d{4}\b")

# Malaysian Phone Numbers: +60 or 01x mobile/contact patterns
PHONE_PATTERN: re.Pattern = re.compile(
    r"(?:\+60[- ]?(?:[1-9][- ]?\d{3,4}[- ]?\d{4}|[1-9]\d{6,8})\b|\b01[0-9][- ]?\d{3,4}[- ]?\d{4}\b|\b01[0-9]\d{7,8}\b)"
)

# Financial Account Numbers: 10 to 18 digits with optional hyphens or spaces
BANK_ACCOUNT_PATTERN: re.Pattern = re.compile(r"\b(?:\d[- ]*){9,17}\d\b")

# Masking Tokens
MYKAD_MASK = "YYMMDD-**-****"
PHONE_MASK = "XXX-***-****"
BANK_MASK = "XXXX-****-****"

# Rule Names
RULE_MYKAD = "MYKAD_STATUTORY_MASK"
RULE_PHONE = "PDPA_PHONE_MASK"
RULE_BANK = "FINANCIAL_ACCOUNT_MASK"


def sanitize_text_in_memory(
    text: str, field_name: str = "body"
) -> Tuple[str, List[PIIRedactionLog]]:
    """Sanitize sensitive PII in-memory and return masked text along with audit logs.

    Applies zero-trust deterministic redacting rules in prioritized sequence:
    1. Malaysian MyKad Statutory Masking (MYKAD_STATUTORY_MASK)
    2. PDPA Malaysian Mobile / Phone Masking (PDPA_PHONE_MASK)
    3. Financial Bank Account Masking (FINANCIAL_ACCOUNT_MASK)

    Args:
        text: Raw inbound text string (e.g. email body, message content).
        field_name: The originating document field name for logging purposes.

    Returns:
        A tuple of (sanitized_text, redaction_logs).
    """
    if not text:
        return "", []

    redaction_logs: List[PIIRedactionLog] = []
    sanitized: str = text

    # Step 1: Redact Malaysian MyKad patterns
    for match in MYKAD_PATTERN.finditer(sanitized):
        redaction_logs.append(
            PIIRedactionLog(
                field_name=field_name,
                original_snippet=match.group(),
                masked_value=MYKAD_MASK,
                redaction_rule=RULE_MYKAD,
            )
        )
    sanitized = MYKAD_PATTERN.sub(MYKAD_MASK, sanitized)

    # Step 2: Redact Malaysian mobile and telephone numbers (+60 or 01x)
    for match in PHONE_PATTERN.finditer(sanitized):
        redaction_logs.append(
            PIIRedactionLog(
                field_name=field_name,
                original_snippet=match.group(),
                masked_value=PHONE_MASK,
                redaction_rule=RULE_PHONE,
            )
        )
    sanitized = PHONE_PATTERN.sub(PHONE_MASK, sanitized)

    # Step 3: Redact Bank Accounts (10+ digits, handling optional hyphens/spaces)
    for match in BANK_ACCOUNT_PATTERN.finditer(sanitized):
        redaction_logs.append(
            PIIRedactionLog(
                field_name=field_name,
                original_snippet=match.group(),
                masked_value=BANK_MASK,
                redaction_rule=RULE_BANK,
            )
        )
    sanitized = BANK_ACCOUNT_PATTERN.sub(BANK_MASK, sanitized)

    return sanitized, redaction_logs
