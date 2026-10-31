# 🛡️ SME-ScamGuard-AI

### Autonomous Accounts Payable Integrity & BEC Defense Platform

> **Stop payment fraud before the money moves.**

SME-ScamGuard-AI is an AI-powered financial fraud defense platform designed for Malaysian SMEs.

It protects Accounts Payable workflows against **Business Email Compromise (BEC), invoice bank-account redirection, supplier impersonation, payment manipulation, and suspicious vendor activity** — combining deterministic security controls, AI-assisted analysis, threat intelligence, and human-in-the-loop verification.

<p align="center">

**🔍 Detect &nbsp; • &nbsp; 🧠 Investigate &nbsp; • &nbsp; 🛡️ Verify &nbsp; • &nbsp; 🔒 Contain**

</p>

---

## 🚨 The Problem

Traditional email security protects the **inbox**.

But modern payment fraud attacks the **payment process**.

An attacker who compromises a legitimate supplier's mailbox can send an invoice that appears completely authentic:

```text
Legitimate Supplier Email
        ↓
Compromised Mailbox
        ↓
Fraudulent Invoice
        ↓
Changed Bank Account
        ↓
AP Clerk Approves Payment
        ↓
💸 Financial Loss
```

### Why traditional email security is not enough

| Problem | Why it matters |
|---|---|
| **SPF / DKIM / DMARC pass** | A compromised legitimate mailbox can still pass email authentication |
| **Bank details changed** | Traditional spam filters do not understand financial relationships |
| **Invoice phone number replaced** | Attackers can control the verification channel |
| **PDF modified or regenerated** | Metadata and document structure can contain useful forensic signals |
| **SMEs lack dedicated security teams** | AP staff often become the final security barrier |
| **Consumer PDF tools create false alarms** | Legitimate SMEs frequently use Canva, iLovePDF and similar tools |

The critical security gap is therefore:

> **Email authenticity ≠ Payment authenticity**

---

# 💡 Our Solution

SME-ScamGuard-AI creates a security layer **between invoice receipt and payment approval**.

Instead of asking only:

> "Is this email legitimate?"

the platform asks:

> **"Does this payment request make sense when compared against all available evidence?"**

The system combines three defense layers:

```text
┌──────────────────────────────────────────────────────────────┐
│                    SME-SCAMGUARD-AI                         │
├──────────────────────┬──────────────────────┬───────────────┤
│ 🔍 FORENSIC GUARD   │ ⚡ CONTEXT ENGINE     │ 🛡️ HITL       │
│                      │                      │               │
│ PDF forensics        │ Spend velocity      │ 4-Eyes        │
│ PII sanitization     │ Vendor dormancy     │ verification  │
│ Bank reconciliation  │ PO validation       │ Landline      │
│ Threat intelligence  │ Payment behaviour   │ callback      │
│                      │                      │ Human approval│
└──────────────────────┴──────────────────────┴───────────────┘
```

---

# 🔍 01 — Forensic Guard

### Deterministic document & threat analysis

The Forensic Guard examines the technical and financial characteristics of an incoming payment request.

### 📄 PDF Forensics

The system inspects PDF-level signals such as:

- PDF structural information
- `%EOF` trailer characteristics
- Creation metadata
- `/Producer` information
- Document anomalies

These signals are treated as **supporting evidence**, rather than automatic proof of fraud.

### 🔐 Privacy Sanitization

Sensitive information can be sanitized in memory before being processed by external AI services.

Examples include:

- Malaysian MyKad identifiers
- Mobile numbers
- Sensitive invoice information

### 🛡️ Threat Intelligence

Known suspicious bank accounts can be compared against a locally indexed threat-intelligence cache based on the project's SemakMule workflow.

### 🎨 False-Positive Protection

Consumer PDF creation tools are **not automatically classified as malicious**.

Instead:

```text
PDF Tool Anomaly
       +
Matching Trusted Financial Record
       ↓
Potentially Legitimate
       ↓
Continue Verification
```

This helps protect micro-SMEs from unnecessary fraud alerts.

---

# ⚡ 02 — Velocity & Context Engine

Fraud is rarely just about one invoice.

The Context Engine looks at **behaviour over time**.

### 📊 Payment Velocity

Tracks cumulative payment activity over a rolling window to identify suspicious bursts or micro-structuring.

```text
Normal Activity
      ↓
Normal Activity
      ↓
Normal Activity
      ↓
Sudden Payment Burst
      ↓
⚠️ NEEDS_REVIEW
```

### 🕒 Dormant Vendor Detection

A vendor that has been inactive for an extended period and suddenly requests payment can trigger additional investigation.

Example:

```text
>180 Days Inactive
        ↓
Sudden Payment Request
        ↓
DORMANT_VENDOR_ACTIVITY_DETECTED
```

### 📦 Purchase Order Validation

The system validates whether payment requests satisfy expected procurement rules such as canonical PO prefixes.

Example:

```text
Expected:
PO-ML-XXXXXX

Missing / Invalid PO
        ↓
⚠️ Additional Review
```

---

# 🧠 03 — AI Investigation Layer

AI is used as an **investigation assistant**, not the final payment authority.

Google Gemini is used to help normalize and interpret unstructured information such as:

- Invoice fields
- Email content
- Urgency language
- Pressure tactics
- Vendor information
- Financial entities

### 🔒 Prompt Injection Protection

Inbound documents are treated as **untrusted content**.

```text
<UNTRUSTED_INBOUND_DOC>
    External Email / Invoice Content
</UNTRUSTED_INBOUND_DOC>
```

The AI does not receive payment approval authority.

Instead:

```text
Untrusted Document
        ↓
AI Extraction / Analysis
        ↓
Structured Evidence
        ↓
Deterministic Policy Engine
        ↓
Risk Decision
```

This prevents an invoice from directly instructing the AI to override security controls.

---

# 🛡️ 04 — Human-in-the-Loop 4-Eyes Verification

High-risk financial decisions should not depend entirely on automation.

SME-ScamGuard-AI therefore introduces a **4-eyes verification model**.

### 📞 Out-of-Band Verification

If an invoice contains a suspicious phone number:

```text
Invoice Phone Number
        ↓
❌ Do Not Trust
```

The system instead uses the independently stored corporate contact information:

```text
Trusted Corporate Contact
        ↓
Independent Verification
        ↓
AP Clerk Confirmation
```

This prevents an attacker from controlling both:

> **The invoice + the verification channel**

### ✏️ Controlled Field Correction

Human corrections are not silently overwritten.

The system preserves:

```text
Verified Value
~~Original Extracted Value~~
• Corrected
```

and records the justification as part of the audit trail.

---

# 🔒 Fail-Closed Security

One of the core design principles is:

> **When security intelligence becomes unavailable, do not automatically approve the payment.**

For example:

```text
AI Service Unavailable
        ↓
AI_COGNITIVE_UNAVAILABLE
        ↓
LOCKED_CRITICAL
        ↓
Human Verification Required
```

The system therefore follows a **fail-closed** model instead of failing open.

---

# 🏗️ System Architecture

```text
                         SME-SCAMGUARD-AI
                                │
                                ▼
                    ┌─────────────────────┐
                    │   INGESTION LAYER   │
                    │                     │
                    │ Email / Documents   │
                    │ Financial Records   │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │ TIER 1 — DETERMINISTIC ENGINE │
              │                                │
              │ • Privacy Sanitization        │
              │ • PDF Forensics                │
              │ • Financial Reconciliation     │
              │ • Threat Intelligence         │
              │ • Velocity Monitoring         │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │ TIER 2 — AI INVESTIGATION      │
              │                                │
              │ • Entity Extraction            │
              │ • Document Understanding       │
              │ • Pressure / Urgency Analysis  │
              │ • Untrusted Content Isolation  │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │ TIER 3 — POLICY ARBITRATION    │
              │                                │
              │ Deterministic Risk Engine      │
              │ Risk Score: R = 0 → 100        │
              │ Fail-Closed Safety Controls    │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │ HUMAN-IN-THE-LOOP GOVERNANCE   │
              │                                │
              │ • 4-Eyes Verification          │
              │ • Independent Callback         │
              │ • Manager Override             │
              │ • Payment Lock                 │
              │ • Audit Trail                  │
              └───────────────┬────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              ✅ VERIFIED          🚨 LOCKED
```


### 🤖 7-Agent Defense Architecture (Proposal Baseline)
1. **Agent 1: In-Memory Privacy Sanitizer (RAM Layer)** — Strips MyKad (`\b\d{6}-\d{2}-\d{4}\b`) and Malaysian mobile numbers (`\b01[0-9]-?[0-9]{7,8}\b`) in volatile heap memory (`io.BytesIO`) (<5ms SLA, PDPA 2010 Section 10 compliant).
2. **Agent 2: Deterministic Binary Forensics (Byte Layer)** — Inspects PDF byte structures, trailer dictionaries, `/Producer` indicators, and enforces the dual-factor consumer tooling exception (`CONSUMER_PDF_TOOL_BENIGN` for Canva/iLovePDF).
3. **Agent 3: Ground-Truth Registry & Threat Cache (Relational Layer)** — Validates remittance instructions against approved Master Procurement Ledger and local SemakMule threat cache (<2ms SLA, <0.003ms threat lookup).
4. **Agent 4: Cognitive Behavioral Investigator (Perception Layer – Gemini 2.5 Flash)** — Leverages bounded Google Gemini 2.5 Flash to analyze linguistic urgency, coercion tactics, and adversarial prompt injections within sandboxed `<UNTRUSTED_INBOUND_DOC>` wrappers (no ERP/payment write privileges).
5. **Agent 5: Declarative Policy Arbiter & Fail-Closed Safety Net (Governance Layer)** — Evaluates deterministic multi-factor risk scores ($R \in [0, 100]$) and enforces mandatory fail-closed locking (`AI_COGNITIVE_UNAVAILABLE` $\to$ `LOCKED_CRITICAL`).
6. **Agent 6: Containment & Statutory Artifact Synthesis (Response Layer)** — Produces court-admissible forensic dossiers, NSRC 997 / AMLA 2001 emergency incident referral packages, and cryptographic audit chains (Evidence Act 1950 Section 90A SHA-256).
7. **Agent 7: OSINT Police Threat Intelligence Ingestion Agent (Intelligence Hydration Layer)** — Ingests real-time PDRM CCID scam news alerts via 2-stage authenticity verification gate (`POST /api/v1/intel/ingest-police-alert`), canonicalizing bank names and updating local SemakMule threat cache atomically.

---

# 🎯 Risk Decision Model

The platform uses a deterministic policy layer to combine multiple security signals.

Conceptually:

```text
                    ┌──────────────────┐
                    │ Incoming Request │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    Document Signals   Financial Signals   Threat Signals
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                  ┌────────────────────┐
                  │ Deterministic Risk │
                  │      Arbiter        │
                  └──────────┬─────────┘
                             │
                      Risk Score 0–100
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
          VERIFIED      NEEDS_REVIEW   LOCKED_CRITICAL
```

AI can provide **evidence**, but the final policy decision remains deterministic.

### Formal Risk Formula & Configured Weights (Proposal Section 4.5)

$$R = \max\Big(S_{\text{SemakMule}}, \min\big(100, w_1 \cdot I_{\text{Ledger}} + w_2 \cdot I_{\text{Tool}} + w_3 \cdot I_{\text{Urgency}} + w_4 \cdot I_{\text{Auth}} + w_5 \cdot I_{\text{Context}}\big)\Big)$$

| Weight / Parameter | Value | Indicator Description |
|---|---:|---|
| **$w_1$ ($I_{\text{Ledger}}$)** | **75** | Master Procurement Ledger beneficiary mismatch (`UNAUTHORIZED_BANK_CHANGE`) |
| **$w_2$ ($I_{\text{Tool}}$)** | **20** | Consumer PDF tool / binary revision anomaly (`PDF_METADATA_SUSPICIOUS`) |
| **$w_3$ ($I_{\text{Urgency}}$)** | **15** | Bounded Gemini linguistic urgency / coercive pressure detection |
| **$w_4$ ($I_{\text{Auth}}$)** | **25** | In-transit transport divergence (`BEC_IN_TRANSIT_DIVERSION`: email bank $\neq$ PDF bank) |
| **$w_5$ ($I_{\text{Context}}$)** | **20** | Temporal context: Vendor dormancy (>180d), velocity burst, or missing/invalid PO |
| **$S_{\text{SemakMule}}$** | **99** | Confirmed PDRM CCID SemakMule threat cache hit override (`LOCKED_CRITICAL`) |

| Disposition | Risk Range | Policy Enforcement |
|---|---|---|
| **`VERIFIED`** | $R < 50$ | Proceed only under normal finance approval controls. |
| **`NEEDS_REVIEW`** | $50 \le R < 80$ | Hold voucher for human triage; no automatic disbursement. |
| **`LOCKED_CRITICAL`** | $R \ge 80$ | Freeze voucher, trigger audit event, notify reviewers. |
| **`AI_COGNITIVE_UNAVAILABLE`** | Fail-Closed | Upstream AI timeout/error attaches diagnostic tag and **forces `LOCKED_CRITICAL`**. |

---

# 🌟 Key Security Features

| Security Layer | Protection |
|---|---|
| 🔐 **Privacy Sanitization** | Removes sensitive identifiers before external AI processing |
| 📄 **PDF Forensics** | Detects document-level anomalies |
| 🏦 **Financial Reconciliation** | Detects mismatched financial information |
| 🛡️ **Threat Intelligence** | Identifies known suspicious accounts |
| 📊 **Velocity Monitoring** | Detects unusual payment bursts |
| 🕒 **Dormancy Detection** | Identifies sudden activity from inactive vendors |
| 📦 **PO Validation** | Detects procurement inconsistencies |
| 🧠 **AI Investigation** | Extracts contextual and semantic evidence |
| 🚫 **Prompt Injection Shield** | Treats external documents as untrusted |
| 📞 **Out-of-Band Verification** | Prevents attacker-controlled contact verification |
| 👥 **4-Eyes Approval** | Keeps humans in control of high-risk decisions |
| 🔒 **Fail-Closed Architecture** | Prevents automatic approval when critical services fail |
| 📜 **Tamper-Evident Audit** | Preserves security decision history |

---

# 📊 Benchmark Evaluation

SME-ScamGuard-AI was evaluated against **400 synthetic operational and adversarial scenarios** using a 40-vendor test dataset.

> **These results represent the controlled benchmark environment and are not a claim of production-world accuracy.**

### Results

| Metric | Result |
|---|---:|
| Automated Security Unit Tests | **94 / 94 Passed (100%)** |
| Total Scenarios | **400** |
| Evaluation Completion | **100%** |
| Classification Accuracy | **100%** |
| Adversarial Recall | **100%** |
| Threat Vectors Intercepted | **250 / 250** |
| Legitimate / Benign Scenarios | **150 / 150** |
| False Positives in Benchmark | **0 / 150** |
| Average Deterministic Core Latency | **0.021 ms / invoice** |

### Test Coverage

| Scenario | Volume | Result |
|---|---:|---|
| Legitimate Clean Invoices | 100 | ✅ Cleared |
| Canva / iLovePDF Bills | 50 | ✅ Cleared |
| BEC Redirection Attacks | 50 | 🚨 Blocked |
| Tampered Invoices | 50 | 🚨 Blocked |
| Threat-Intelligence Hits | 50 | 🚨 Blocked |
| Dormant Vendor Activity | 35 | ⚠️ Flagged |
| Payment Velocity Bursts | 35 | ⚠️ Flagged |
| Invalid / Missing PO | 30 | ⚠️ Flagged |

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript |
| **Backend** | FastAPI, Uvicorn, Python 3.12 |
| **AI** | Google Gemini 2.5 Flash |
| **Document Analysis** | `pypdf` + Binary Byte Scanners |
| **Data Processing** | Python In-Memory Structures |
| **Threat Intelligence** | PDRM CCID SemakMule Cache |
| **UI** | Tailwind CSS + Lucide Icons |
| **Dossier Generation** | ReportLab |
| **Integrity** | SHA-256 / HMAC |
| **Development** | Node.js + Python |

---

# 🔐 Security Philosophy

SME-ScamGuard-AI follows five core principles:

### 1. Never Trust the Invoice Alone

An invoice is evidence — not truth.

### 2. Never Let AI Make the Final Payment Decision

AI assists investigation.

Deterministic policy controls the decision.

### 3. Never Trust an Attacker-Controlled Verification Channel

The phone number printed on an invoice may be part of the attack.

### 4. Never Fail Open

If critical security intelligence is unavailable, payment approval stops.

### 5. Keep Humans in Control

High-risk financial decisions require human verification.

---

# ⚖️ Compliance & Governance

SME-ScamGuard-AI incorporates technical controls designed around relevant Malaysian privacy, cybersecurity and financial-crime governance considerations.

### 🇲🇾 PDPA 2010

Privacy-by-design principles are supported through:

- Data minimization
- In-memory processing
- PII sanitization
- Reduced exposure of sensitive invoice information

### 🏦 BNM RMiT Principles

The architecture incorporates security practices including:

- Segregation of duties
- Access control
- Human authorization
- Auditability
- Incident response
- Fail-closed controls

### 📜 Evidence Integrity

Security events and authorization actions can be preserved through cryptographic hashing to support tamper-evident audit records.

### 🚨 Scam Response

The platform provides structured incident information to support emergency scam-response workflows.

> **SME-ScamGuard-AI is a technical security prototype and does not represent formal regulatory certification or legal advice.**

---

# 🚀 Getting Started

## Requirements

- Python 3.10+
- Python 3.12 recommended
- Node.js 18+
- npm
- Optional Gemini API key

## Clone

```bash
git clone https://github.com/YXLEE0912/SME-ScamGuard-AI.git
cd SME-ScamGuard-AI
```

## Backend

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -e .
```

## Frontend

```bash
cd frontend
npm install
cd ..
```

## Environment

Create `.env`:

```env
ENVIRONMENT=development
RISK_THRESHOLD=50.0
GEMINI_API_KEY="your_gemini_api_key_here"
```

The system can operate using its deterministic processing path when the Gemini API is unavailable.

## Run Backend

```bash
uv run uvicorn backend.app.main:app --reload --port 8000
```

## Run Frontend

```bash
cd frontend
npm run dev
```

---

# 🧪 Verification & Testing

### 1. Run Automated Security Unit Tests (94 Tests)
```bash
uv run pytest
```

### 2. Run 400-Scenario AP Forensic Benchmark
```bash
uv run python benchmark_eval.py
```

---

# 🗺️ Roadmap

### ✅ Phase 1 — Core Defense

- Email/document ingestion
- Privacy sanitization
- Deterministic document analysis
- AI-assisted extraction
- Financial reconciliation

### ✅ Phase 2 — Fraud Intelligence

- Threat-intelligence cache
- Vendor dormancy detection
- Payment velocity monitoring
- PO validation
- 400-scenario benchmark suite

### 🚧 Phase 3 — Enterprise Integration

- Microsoft 365 / Exchange Live Mailbox integration `[ON HOLD / DO NOT IMPLEMENT FIRST — SCOPE NOT FINALIZED]`
- AutoCount Cloud
- SQL Account
- Xero
- Enterprise ERP integrations
- Enhanced banking verification

### 📅 Phase 4 — Advanced Computer Vision

- Error Level Analysis (ELA)
- Advanced invoice manipulation detection
- Image-level document forensics

---

# 🏆 Competition

### UTAR Agentic AI Cybersecurity Hackathon 2026

- **Team:** Team halo
- **Track:** Scam Defence & Awareness

SME-ScamGuard-AI focuses on one critical principle:

> ### **Don't just detect the scam. Stop the payment.**

---

<p align="center">

**🛡️ SME-ScamGuard-AI**

**AI-assisted. Deterministic by design. Human-controlled.**

</p>
