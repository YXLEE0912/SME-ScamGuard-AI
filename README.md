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

**SME-ScamGuard-AI** functions as an automated virtual security analyst for resource-constrained, zero-SOC SME environments. It intercepts invoices pre-disbursement, performs in-memory PII sanitization, extracts deterministic binary forensics, reconciles bank records against master ledgers and police mule repositories (PDRM CCID SemakMule), and enforces dual-authorization payment containment.
**SME-ScamGuard-AI** combines hybrid in-memory document ingestion, statutory PII sanitization, deterministic ledger cross-verification, and structured cognitive reasoning into an asynchronous, local-first DAG pipeline:

*Stage 0 (Hybrid Ingestion & OCR Engine): Ingests digital invoices (.pdf, .txt) in-memory via pypdf (<15ms). Automatically falls back to Gemini 2.5 Flash Native Multimodal Vision for scanned photocopies or mobile snapshots—zero bulky C++ OCR binaries required.
Agent 0 (Statutory Privacy Barrier — PDPA 2010): Locally scrubs Malaysian statutory PII (MyKad registration numbers, personal mobile MSISDNs, credit credentials) within volatile heap memory prior to external inference, guaranteeing zero disk persistence (/tmp) under Section 10.
Agent 1 (Deterministic Binary Forensics & Ledger Verifier): Performs ISO 32000-1 byte inspection and timestamp desync checks (/Producer: iLovePDF), calculates domain typosquatting distances, and generates a Two-Way Discrepancy Matrix cross-referencing remittance accounts against both the immutable KNOWN_VENDORS ledger and the PDRM CCID SemakMule mule cache.
*Agent 2 (Cognitive Analyst — Isolated ReAct Loop): Uses Google Gemini 2.5 Flash (google-genai SDK) sandboxed inside <UNTRUSTED_INBOUND_DOCUMENT> tags to detect subtle psychological coercion, audit secrecy pretexts, and artificial urgency. Automatically fails over to an offline sub-50ms deterministic heuristic engine if air-gapped or timed out (AI_COGNITIVE_UNAVAILABLE).
*Agent 3 (Chief Risk Arbiter & Containment Engine): Evaluates a composite deterministic risk score ($R \in [0, 100]$), halts unauthorized wire transfers via automated ERP locks ($R \ge 80$), and generates an Out-of-Band Call Verification Voucher strictly exposing the vendor's verified corporate landline switchboard (+60 3-7722 8888). 
*Async Orchestration & Incident Governance Layer: Employs FastAPI BackgroundTasks to synthesize 1-click NSRC 997 / AMLA Section 44 Police Complaint Dossiers, trigger automated in-reply Gmail Dispute Challenge Drafts, and commit append-only SHA-256 audit records under the Malaysian Evidence Act 1950 without blocking the UI.

---

### 🏗️ Architecture

```text

[ Inbound Email Stream / Multi-Part Invoice Upload ]
│
▼
┌──────────────────────────────────────────────────────────┐
│ STAGE 0: Volatile In-Memory PII Scrubber (<5ms)          │
│ • Scoped RAM buffer (0 disk writes to /tmp)              │
│ • Redacts MyKad (\b\d{6}-\d{2}-\d{4}\b) & MSISDN contacts│
│ • Enforces Malaysian PDPA 2010 Section 10 compliance     │
└──────────────────────────┬───────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────┐
│ STAGE 1: Deterministic Binary & Metadata Forensics (<35ms)│
│ • ISO 32000-1 byte parsing & %EOF trailer validation     │
│ • Identifies consumer web editors (iLovePDF, Canva)       │
│ • Flags timestamp desync: |T_ModDate - T_CreationDate| > 1h│
└──────────────────────────┬───────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────┐
│ STAGE 2: Ground-Truth Registry & SemakMule Cache (<2ms)  │
│ • Two-Way Discrepancy Matrix vs. KNOWN_VENDORS ledger    │
│ • Exact-match query to PDRM CCID SemakMule threat cache  │
│ • Suppresses invoice contact; retrieves official landline│
└──────────────────────────┬───────────────────────────────┘
│ (Sanitized Briefing Payload)
▼
┌──────────────────────────────────────────────────────────┐
│ STAGE 3: Cognitive Agent Analysis (Gemini 2.5 Flash)     │
│ • Sandboxed prompt delimited by <UNTRUSTED_INBOUND_DOC>  │
│ • Analyzes social engineering: urgency, authority, audit │
│ • Zero financial clearance authority (Diagnostic JSON)   │
└──────────────────────────┬───────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────┐
│ STAGE 4: Declarative Risk Arbiter & Fail-Closed Safety   │
│ • R = max(S_SemakMule, min(100, 80·I_Ledger + 20·I_Tamper│
│        + 15·I_Urgency + 25·I_AuthFailure))               │
│ • Fail-Closed: AI timeouts trigger AI_COGNITIVE_UNAVAIL  │
└──────────────────────────┬───────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────┐
│ STAGE 5: Runtime Containment & Statutory Artifacts       │
│ • Automated ERP Disbursement Lock (PAYMENT_LOCKED)       │
│ • 4-Eyes Governance: Step 1 (Clerk Call) -> Step 2 (Sign)│
│ • 1-Click PDRM CCID / NSRC 997 Police Complaint Dossier  │
│ • Append-only SHA-256 audit trail under Evidence Act 1950│
└──────────────────────────────────────────────────────────┘
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

# Gmail Inbound IMAP (Optional)
GMAIL_USER=""
GMAIL_APP_PASSWORD=""

# Telegram Incident Bot (Optional)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
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
