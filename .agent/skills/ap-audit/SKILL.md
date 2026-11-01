---
name: ap-audit
description: Multimodal invoice field extraction, PDF binary inspection, and 3-way forensic reconciliation (Email Body vs. PDF Document vs. Vendor Master Ledger) for SME Accounts Payable fraud and BEC defense.
---

# Accounts Payable Fraud & BEC Verification Specification

**System Name:** SME-ScamGuard-AI Accounts Payable Defense Framework  
**Version:** 3.0.0 (Authoritative Agent Skill Specification)  
**Core Thesis:** *Email authenticity ≠ Payment authenticity.*

---

## 1. Operational Scope & Ingestion Boundaries

This skill provides comprehensive instructions for evaluating inbound supplier invoices, detecting Business Email Compromise (BEC), in-transit bank account diversions, and fraudulent invoice tampering before disbursement execution.

### Active Data Ingestion Boundaries:
1. **Master Procurement Ledger Snapshot**: Canonical CSV ledger at `backend/data/vendor_ledger.csv` (40 approved Malaysian suppliers).
2. **Local SemakMule Threat Cache**: Fast-lookup PDRM CCID commercial mule account cache at `backend/data/semakmule_cache.json`.
3. **Simulated Inbound Mailbox Feed**: Operational demo dataset at `backend/data/demo_mailbox.json`.
4. **Interactive Ingestion Endpoint**: `POST /api/v1/verify` (accepting RFC 5322 MIME text and raw PDF file uploads).

> [!IMPORTANT]
> **Live Mailbox Push Ingestion Notice [STATUS: ON HOLD]**:
> Live background email listeners (Microsoft Graph API webhooks / Google Workspace push notifications) are explicitly **ON HOLD / NOT FINALIZED YET**. All audits operate strictly through the endpoints and datasets above.

---

## 2. Master 3-Tier Supervision Architecture

All verification workflows enforce strict separation between probabilistic cognitive perception and deterministic financial authorization:

1. **Tier 1: Deterministic Engine (Sub-Millisecond Verification)**:
   - **In-Memory Privacy Sanitizer (RAM Layer)**: Volatile heap redaction (`io.BytesIO`) for Malaysian MyKad (`\b\d{6}-\d{2}-\d{4}\b`) and mobile numbers (`\b01[0-9]-?[0-9]{7,8}\b`), ensuring full PDPA 2010 Section 10 compliance. Zero raw disk writes.
   - **Deterministic Binary Forensics (Byte Layer)**: Static ISO 32000-1 structural PDF inspection (`pypdf`). Checks metadata (`/Producer`, `/Creator`, `/ModDate`), flags modification time deltas `Δt > 3600s`, scans for multiple `%%EOF` incremental trailers, and enforces the **Dual-Factor Benign Tooling Invariant**.
   - **Ground-Truth Registry & Threat Cache (Relational Layer)**: 3-way reconciliation (Email Claim vs. PDF Remittance vs. Master Ledger) and $\mathcal{O}(1)$ local SemakMule police blacklist lookup (`< 0.003 ms`). Confirmed mule hits assign threat score `S = 99`, triggering an unconditional lock.
2. **Tier 2: Cognitive Perception Sandbox (Gemini 2.5 Flash)**:
   - Evaluates linguistic coercion, urgency spikes, and procedural bypass requests.
   - Sandboxed inside `<UNTRUSTED_INBOUND_DOC>` XML blocks to defeat OWASP LLM01 Prompt Injections.
   - **Zero Financial Mutation Privileges**: LLM has zero authority to approve vouchers, change supplier accounts, or clear locks.
   - **Fail-Closed Invariant**: Network timeouts, quota limits, or invalid JSON output trigger `AI_COGNITIVE_UNAVAILABLE` &rarr; deterministically forces `LOCKED_CRITICAL`.
3. **Tier 3: Policy Arbitration & Statutory Containment**:
   - **Declarative Policy Arbiter**: Computes mathematical risk score `R` (0–100) and routes invoices to `VERIFIED`, `NEEDS_REVIEW`, or `LOCKED_CRITICAL`.
   - **Containment & Incident Artifact Synthesis**: Synthesizes automated ERP payment hold payloads (`VCH-HOLD-2026-XXXX`), ready-to-file NSRC 997 police referral packets, vendor dispute drafts, and records tamper-evident SHA-256 HMAC cryptographic event chains (Evidence Act 1950 Section 90A).

---

## 3. Formal Mathematical Risk Formula & Finite State Machine

The Policy Arbiter evaluates total risk using an immutable mathematical formula:

```text
R = max(S_SemakMule, min(100, w1 * I_Ledger + w2 * I_Tool + w3 * I_Urgency + w4 * I_Auth + w5 * I_Context))
```

### Parameter Weights:
- `w1 = 75` (`I_Ledger`): PDF bank account differs from approved Master Ledger (`1` if mismatch, `0` if match).
- `w2 = 20` (`I_Tool`): High-risk PDF tool or trailer splicing anomaly (`1` if anomalous, `0` if authentic ERP export or benign Canva exception).
- `w3 = 15` (`I_Urgency`): Cognitive urgency score > 70 (`1` if breached, `0` otherwise).
- `w4 = 25` (`I_Auth`): Email claim contradicts attached PDF document (`BEC_IN_TRANSIT_DIVERSION`).
- `w5 = 20` (`I_Context`): Temporal anomaly, >180-day vendor dormancy, or missing/invalid PO reference.
- `S_SemakMule = 99`: Confirmed PDRM CCID commercial mule account match (forces immediate freeze).

### State Transitions & Disposition Invariants:
- **`VERIFIED` (`R < 50`)**: Zero bank mismatches, exact ledger parity, clean SemakMule check, and valid PO. Approved for straight-through voucher generation.
- **`NEEDS_REVIEW` (`50 <= R < 80`)**: High claim amount (> RM 20,000), dormant supplier warning, or mild urgency signals. Payment paused; mandatory 4-Eyes dual sign-off required.
- **`LOCKED_CRITICAL` (`R >= 80` or Mandatory Failure)**: Destination bank mismatch, confirmed SemakMule hit, PDF tampering, or `AI_COGNITIVE_UNAVAILABLE`. Automated voucher freeze; police dossier generated.

---

## 4. Key Forensic Reconciliation Invariants

### 1. Three-Way Reconciliation Priority:
```text
[Inbound Email Claims] <─── Check A ───> [Attached Invoice PDF]
                                                  ▲
                                                  │ Check B
                                                  ▼
                                       [Master Procurement Ledger]
```
- **Check A (Email vs. PDF)**: Discrepancy indicates in-transit tampering (`BEC_IN_TRANSIT_DIVERSION`).
- **Check B (PDF vs. Ledger)**: Discrepancy indicates unauthorized bank modification (`UNAUTHORIZED_BANK_CHANGE`).
- **Check C (Local SemakMule Cache)**: Match forces `S = 99` override. Miss indicates `NOT_FOUND_IN_SNAPSHOT`, never `CLEAN`.

### 2. Dual-Factor Benign Tooling Invariant:
Micro-SMEs commonly use Canva or iLovePDF for legitimate billing. To prevent false positives:
- If PDF `/Producer` is Canva, iLovePDF, or Sejda **AND** bank account exactly matches Master Ledger &rarr; Tool penalty is neutralized (`tool_penalty = 0`, tag `CONSUMER_PDF_TOOL_BENIGN`).
- If consumer tool is detected **AND** bank account does NOT match Master Ledger &rarr; Full anomaly penalty applies (`tool_penalty = 20`, tag `ANOMALOUS_PDF_TOOL_UNAPPROVED_DESTINATION`).

---

## 5. Human-in-the-Loop 4-Eyes Governance Protocol

For any invoice flagged with `NEEDS_REVIEW` or `LOCKED_CRITICAL`:
1. **Invoice Phone Suppression**: Untrusted contact numbers printed on invoices are strictly suppressed.
2. **Out-of-Band Switchboard Display**: Cockpit displays exclusively the verified corporate switchboard telephone number from the Master Ledger (e.g. `+60 3-7722 8841`).
3. **Mandatory Callback Logging**: AP Clerk (Maker) must call the switchboard, record call timestamp in Malaysian Standard Time (MYT), extension, and officer title.
4. **State-Machine Action Gating & Decision Actions**:
   - Actions in cockpit: **`Approve and Submit`** and **`Escalate`** (static clerk/manager text lines are removed).
   - On initial defect state, `Approve and Submit` is strictly **disabled** with helper copy *"Resolve or correct flagged defects before authorization is permitted."*, while `Escalate` is active.
   - Operator field correction via `[✎ Correct...]` submits verified value to `POST /api/v1/queue/{case_id}/override`, renders an inline badge on the Agent card `[✎ Operator Corrected: <field> -> <value>] (YYYY-MM-DD HH:mm:ss MYT)`, and unlocks choice between `Approve and Submit` or `Escalate`.
   - Settled state displays finalized indicator `✓ Approved` or `🚨 Escalated`.
5. **Audit Field Correction Record**: If an approved bank update is accepted:
   `Verified Value: [approved account]` | `Original Value: ~~[untrusted account]~~` | `Status: Corrected`
   Logged immutably to the SHA-256 HMAC cryptographic audit chain (`data/audits.json`).

---

## 6. Deterministic Output Schema

Every invoice evaluation emits a structured schema conforming to:

```json
{
  "case_id": "string",
  "sender_email": "string",
  "vendor_name": "string",
  "invoice_number": "string",
  "amount": 0.0,
  "currency": "MYR",
  "disposition": "VERIFIED | NEEDS_REVIEW | LOCKED_CRITICAL",
  "risk_score": 0.0,
  "reconciliation": {
    "email_claimed_account": "string | null",
    "pdf_extracted_account": "string | null",
    "ledger_approved_account": "string | null",
    "email_pdf_match": true,
    "pdf_ledger_match": true,
    "semak_mule_hit": false
  },
  "forensic_flags": [],
  "cognitive_assessment": {
    "urgency_score": 0.0,
    "coercion_detected": false,
    "procedural_bypass_requested": false
  },
  "containment": {
    "erp_voucher_status": "RELEASED | FROZEN_HOLD",
    "nsrc_dossier_ready": false,
    "event_hash": "string (SHA-256)"
  }
}
```


---

<p align="center">
  <b>🛡️ SME-ScamGuard-AI</b><br>
  <i>AI-Assisted · Deterministic by Design · Human-Controlled</i>
</p>
