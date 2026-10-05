# 🛡️ SME-ScamGuard-AI

**Autonomous Accounts Payable Integrity & Business Email Compromise (BEC) Defense Platform**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Next.js 14+](https://img.shields.io/badge/Next.js-14+-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Google Gemini 2.5 Flash](https://img.shields.io/badge/LLM-Gemini%202.5%20Flash-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![Statutory Compliance](https://img.shields.io/badge/Compliance-PDPA%202010%20%7C%20AMLA%202001-blue.svg)](https://www.pdp.gov.my/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Executive Summary

Malaysian Small and Medium Enterprises (SMEs) face severe financial risks from silent invoice bank redirection and typosquatted vendor domains. Standard email spam filters (SPF, DKIM, DMARC) pass hijacked supplier threads, while sending raw financial documents directly to public LLMs breaches statutory data privacy (Malaysian PDPA 2010).

**SME-ScamGuard-AI** functions as an automated virtual security analyst for resource-constrained, zero-SOC SME environments. Operating as an asynchronous, local-first pipeline, it intercepts invoices pre-disbursement, performs in-memory PII sanitization, extracts deterministic binary forensics, reconciles bank records against master ledgers and police mule repositories (PDRM CCID SemakMule), and enforces dual-authorization payment containment.

---

### 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🛡️ SME-ScamGuard-AI: SYSTEM ARCHITECTURE                                                                       │
│     Autonomous In-Memory Accounts Payable Integrity & Business Email Compromise (BEC) Interdiction              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

[ INGESTION GATEWAY ]
  • Enterprise Inbound: Google OAuth 2.0 (Gmail REST API — RFC 5322 MIME stream)
  • Sandbox & Ad-Hoc: Multi-Part Upload & Evaluator Test Portal (?mode=demo)
                          │
                          ▼
[ LAYER 1: In-Memory Privacy Sanitizer (<5ms) ] ──────────────► [ Driven by Agent 1 ]
  • Volatile heap memory buffer (0 persistent disk writes to /tmp)
  • Malaysian PDPA 2010 Section 10 redaction:
      - MyKad: \b\d{6}-\d{2}-\d{4}\b ────────► [REDACTED_MYKAD_IDENTIFIER]
      - Mobile: \b01[0-9]-?[0-9]{7,8}\b ─────► [REDACTED_PHONE_NUMBER]
                          │
                          ▼
[ LAYER 2: Deterministic Binary Forensics (<35ms) ] ──────────► [ Driven by Agent 2 ]
  • ISO 32000-1 structural byte validation & %EOF trailer check
  • Consumer PDF Editor Detection: Flag iLovePDF, Canva, Sejda, Foxit
  • Timestamp Desync Check: |T_ModDate - T_CreationDate| > 3600s
                          │
                          ▼
[ LAYER 3: Ground-Truth Registry & Threat Cache (<2ms) ] ──────► [ Driven by Agent 3 ]
  • Master Ledger Verification: Exact relational query against approved vendor table
  • PDRM CCID SemakMule Cache: In-memory lookup against commercial crime mule registry
  • Out-of-Band Phone Shield: Redact invoice phone; expose registered switchboard (+60 3-XXXX XXXX)
                          │
                          ▼
             ┌────────────┴────────────┐
             ▼                         ▼
   [ NORMAL EXECUTION ]     [ EXCEPTION / TIMEOUT / HTTP 429 ]
             │                         │
             ▼                         ▼
[ LAYER 4: Cognitive Investigation ]   [ LAYER 5B: Fail-Closed Safety Net ]
  • Driven by Agent 4 (Gemini Flash)    • Tag: AI_COGNITIVE_UNAVAILABLE
  • Sandboxed prompt inspection         • Deterministic Tri-Factor takes over
  • Diagnostic JSON output only         • FORCES STATUS: LOCKED_CRITICAL
             │                         │
             ▼                         │
[ LAYER 5A: Declarative Policy Arbiter ]│
  • Evaluates Risk Formula R           │
  • Driven by Agent 5                  │
             │                         │
             └────────────┬────────────┘
                          ▼
[ LAYER 6: Containment & Dual-Authorization Governance ] ─────► [ Driven by Agent 6 ]
  • Automated ERP Payment Freeze (PAYMENT_LOCKED)
  • Dual-Authorization Protocol (Segregation of Duties):
      - Step 1: AP Clerk verbal callback to verified landline (+60 3-7722 8888)
      - Step 2: Finance Manager cryptographic override (Strictly disabled until Step 1 completes)
  • Autonomous Statutory Artifact Synthesis:
      - NSRC 997 / AMLA Section 44 Emergency Police Freeze Dossier
      - In-Reply Gmail Dispute Challenge Draft
      - Malaysian Evidence Act 1950 SHA-256 Audit Trail
```
### 🏗️ Agent Workflow
```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🤖 SME-ScamGuard-AI: AGENT WORKFLOW                                                                            │
│     Autonomous Multi-Agent Architecture for Business Email Compromise (BEC) Defense                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ AGENT 1: STATUTORY PRIVACY GUARDIAN                                         │ ──► Operates Layer 1
  │ • Role: Enforces Malaysian PDPA 2010 Section 10 in volatile memory          │
  │ • Engine: In-memory regex token scrubbers (Zero disk writes to /tmp)        │
  │ • Output: Sanitized document payload with protected MyKad & contact fields  │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ AGENT 2: DETERMINISTIC BINARY FORENSIC ANALYST                              │ ──► Operates Layer 2
  │ • Role: PDF structural byte inspection & consumer editor tamper detection   │
  │ • Engine: ISO 32000-1 binary parser (<35ms at $0.00 compute)                │
  │ • Output: Forensic flag vector (iLovePDF detected, timestamp desync)        │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ AGENT 3: GROUND-TRUTH & REGISTRY CROSS-VERIFIER                             │ ──► Operates Layer 3
  │ • Role: Two-way ledger reconciliation & police threat cache interrogation   │
  │ • Engine: Exact relational SQL matcher + PDRM CCID SemakMule hash index     │
  │ • Output: Ledger Discrepancy Matrix & SemakMule Syndicate Flag              │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ AGENT 4: COGNITIVE BEHAVIORAL INVESTIGATOR                                  │ ──► Operates Layer 4
  │ • Role: Psychological coercion triage & contextual deception analysis       │
  │ • Engine: Google Gemini 2.5 Flash sandboxed via <UNTRUSTED_INBOUND_DOC>     │
  │ • Output: Urgency score, intimidation tags, and structured diagnostic JSON  │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ AGENT 5: CHIEF RISK ARBITER & POLICY ENGINE                                 │ ──► Operates Layer 5
  │ • Role: Deterministic policy evaluation, risk formula & fail-closed triage  │
  │ • Engine: R = max(S_SemakMule, min(100, 80·I_Ledger + 20·I_Tamper + ...))  │
  │ • Output: Composite Risk (0-100), ERP Payment Lock & Out-of-Band Voucher    │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ AGENT 6: INCIDENT RESPONSE & STATUTORY DISPATCHER                           │ ──► Operates Layer 6
  │ • Role: Autonomous police dossier synthesis & append-only evidence custody  │
  │ • Engine: FastAPI BackgroundTasks + ReportLab + Crypto Hash Engine          │
  │ • Output: 1-Click NSRC 997 Police Dossier, Gmail Dispute, SHA-256 Audit Log │
  │ • Enforces: Dual-Authorization (Clerk Verification ──► Manager Override)    │
  └─────────────────────────────────────────────────────────────────────────────┘
```
---
## ⚡ Key Features

* **Engine-First Pipeline:** 95% of checks execute via deterministic Python binary heuristics (<40ms) at $0.00 compute before invoking cloud LLM APIs, neutralizing prompt injection attacks.
* **Statutory PII Sanitization (PDPA 2010):** Redacts Malaysian MyKad national registration IDs and mobile phone numbers directly in volatile memory buffers with zero temporary disk persistence.
* **Strict Ground-Truth Verification:** Replaces probabilistic AI embeddings with zero-tolerance relational lookups against canonical ERP ledgers and PDRM CCID mule registries.
* **Dual-Authorization Protocol (4-Eyes Principle):** Payments require two-tier sequential approval. Step 2 cryptographic overrides remain locked until Step 1 out-of-band landline verification is recorded.
* **1-Click Police & Regulatory Dossier:** Synthesizes structured, regulator-ready incident dossiers for transmission to the **National Scam Response Centre (NSRC 997)** within the 1-hour interdiction window under AMLA 2001 Section 44.
* **Operational Unit Economics:** Designed for SME budgets (~150 invoices/month at a 5% anomaly rate results in an operating cost of **< RM 0.10 / month**).
---

### Quickstart
#### 1. Backend Setup

```bash
git clone [https://github.com/YXLEE0912/SME-ScamGuard-AI.git](https://github.com/YXLEE0912/SME-ScamGuard-AI.git)
cd SME-ScamGuard-AI
```

#### Create virtual environment & install dependencies
```bash
python -m venv venv
source venv/bin/activate
pip install -e .
```

#### 2. Environment Configuration

Create a `.env` file in the project root:

```env
RISK_THRESHOLD=50.0
ENVIRONMENT=development

# Google Gemini API
GEMINI_API_KEY=""

# Gmail Inbound IMAP 
GMAIL_USER=""
GMAIL_APP_PASSWORD=""

```
> **Note:** If API keys are omitted, the system runs on its offline deterministic heuristic engine.

#### 3. Launch Services

**Terminal 1: Backend API**
```bash
uvicorn app.main:app --reload --port 8000
```

**Terminal 2: Next.js Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to access the SOC Dashboard.

---

### 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status check |
| `POST` | `/api/scan` | Submits email text for 4-agent analysis |
| `POST` | `/api/gmail/sync` | Fetches unread inbox messages via IMAP |
| `POST` | `/api/eval/benchmark` | Runs 8-case synthetic Malaysian BEC benchmark |
| `GET` | `/api/reports` | Retrieves session audit records |

---

### 📊 Benchmark Results

Evaluated against `data/eval_cases.json` (Malaysian synthetic BEC corpus):

- **Classification Accuracy:** 100% (8/8 cases)
- **False Positive Rate:** 0.0%
- **Local Engine Latency:** ~42ms
