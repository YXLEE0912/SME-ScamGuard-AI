---
name: ap-audit
description: Multimodal invoice field extraction, PDF binary inspection, and 3-way forensic reconciliation (Email Body vs. PDF Document vs. Vendor Master Ledger) for SME Accounts Payable fraud and BEC defense.
---

# Accounts Payable Fraud & BEC Verification Specification

Instruction manual for ingesting inbound billing requests, parsing invoice documents, and running deterministic multi-source reconciliation to block Business Email Compromise (BEC) and unauthorized payment diversion.

---

## 1. Target Extraction Schema

Extract raw incoming fields into the following structured JSON schema:

```json
{
  "vendor_name": "string | null",
  "invoice_number": "string | null",
  "invoice_date": "YYYY-MM-DD | null",
  "total_amount": 0.0,
  "currency": "MYR",
  "beneficiary_bank_name": "string | null",
  "beneficiary_account_number": "string | null",
  "payment_due_date": "YYYY-MM-DD | null"
}
```

---

## 2. Forensic Analysis Priority & Decision Procedure
Execute audits in strict hierarchical order. Halt and flag at the highest risk identified:

### Priority 1: PDRM CCID SemakMule Blacklist Check
- Extract account number digits (strip spaces and hyphens).
- Query against local/cached SemakMule fraud database.
- Trigger: Account matches an active police report.
- Verdict: `STATUS = BLOCKED`, `RISK_TIER = CRITICAL`, `ALERT = BLACKLIST_MULE_ACCOUNT`.

### Priority 2: In-Transit Payment Diversion Trap (Email Body vs. PDF)
- Compare payment bank details written in the email body against the attached invoice PDF.
- Trigger: Email asks to pay into Bank A/Account A, while the attached PDF displays Bank B/Account B.
- Verdict: `STATUS = BLOCKED`, `RISK_TIER = CRITICAL`, `ALERT = EMAIL_BODY_DIVERGENCE_TRAP`.

### Priority 3: Master Vendor Ledger Discrepancy (PDF vs. Ledger Baseline)
- Match vendor identity by domain (`sender_email`) or normalized trade name in `backend/data/vendor_ledger.json`.
- Compare extracted `beneficiary_bank_name` and `beneficiary_account_number` against the approved ledger entry.
- Trigger A (Account Mismatch): Vendor exists, but account number differs.
  - Verdict: `STATUS = BLOCKED`, `RISK_TIER = CRITICAL`, `ALERT = UNAUTHORIZED_BANK_CHANGE`.
- Trigger B (Unregistered Vendor): Vendor not present in ledger.
  - Verdict: `STATUS = NEEDS_REVIEW`, `RISK_TIER = MEDIUM`, `ALERT = UNREGISTERED_SUPPLIER`.

### Priority 4: PDF Binary Metadata Integrity Inspection
- Inspect the PDF trailer dictionary and document stream headers:
  - Check `/Producer`, `/Creator`, and `/ModDate`.
  - Flag presence of consumer graphical tools: Canva, Adobe Photoshop, iLovePDF, PDFescape, or Sejda.
- Heuristic logic:
  - If consumer tool is detected BUT bank account matches Master Vendor Ledger -> Low risk / info-only notice (`ALERT = INFORMAL_TOOL_LEGITIMATE_VENDOR`). Verdict remains `STATUS = VERIFIED`.
  - If consumer tool is detected AND bank account does NOT match Master Ledger -> `STATUS = BLOCKED`, `RISK_TIER = CRITICAL`, `ALERT = SUSPICIOUS_METADATA_TAMPERING`.

### Priority 5: Sender Domain Authentication & Typosquatting
- Analyze the sender's email domain against the vendor's authorized domain list.
- Calculate Levenshtein similarity distance against legitimate domains (e.g., `techpaarts.com.my` vs. `techparts.com.my`).
- Trigger: Lookalike domain detected or missing SPF/DKIM validation.
- Verdict: `STATUS = BLOCKED`, `RISK_TIER = HIGH`, `ALERT = TYPOSQUATTING_DOMAIN`.

---

## 3. Fallback Rules (When No PDF is Attached)
When an inbound email contains payment solicitations with no document attachment:
- Extract routing details directly from email body prose.
- Adapt audit to a 2-Way Cross-Check: Email Body Instructions vs. Vendor Master Ledger Baseline.
- If account matches ledger: `STATUS = NEEDS_REVIEW`, `RISK_TIER = LOW`, `ALERT = INVOICE_DOCUMENT_MISSING`.
- If account differs from ledger: `STATUS = BLOCKED`, `RISK_TIER = CRITICAL`, `ALERT = PLAIN_TEXT_PAYMENT_DIVERSION`.

---

## 4. Deterministic Engine Output Contract
For every analyzed email, emit this exact structure:

```json
{
  "case_id": "string",
  "timestamp": "ISO-8601 string",
  "status": "VERIFIED | NEEDS_REVIEW | BLOCKED",
  "priority_escalation": "Low | Medium | High",
  "risk_score": 0,
  "alerts": [],
  "evidence_matrix": {
    "source_1_email_body": {
      "bank_name": "string | null",
      "account_number": "string | null",
      "amount": 0.0
    },
    "source_2_invoice_pdf": {
      "bank_name": "string | null",
      "account_number": "string | null",
      "amount": 0.0,
      "metadata_producer": "string | null"
    },
    "source_3_master_ledger": {
      "bank_name": "string | null",
      "account_number": "string | null",
      "baseline_range": [0.0, 0.0],
      "is_registered": true
    }
  },
  "reconciliation_verdicts": {
    "email_matches_pdf": true,
    "pdf_matches_ledger": true,
    "semak_mule_clear": true,
    "metadata_authentic": true
  }
}
```
