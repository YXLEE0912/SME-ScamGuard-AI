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
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🛡️ SME-ScamGuard-AI: ZERO-TRUST AP INTEGRITY & BEC INTERDICTION PIPELINE                                        │
│     Autonomous Agentic Financial Defense Grounded on PDPA 2010 & PDRM CCID Threat Intelligence                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 ROW 1: INGESTION & PRIVACY BOUNDARY (Local Serverless Heap Memory — 0 Disk Writes)
 ┌───────────────────────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
 │ GATEWAY INGESTION                             │     │ CHECKPOINT 0: IN-MEMORY PII SANITIZER (<5ms)           │
 │ • Channel 1: Google OAuth (Gmail REST)        │ ──► │ • Volatile RAM buffer (zero disk writes to /tmp)       │
 │ • Channel 2: Ad-Hoc Upload (PDF / XLSX)       │     │ • MyKad Regex Redaction: [REDACTED_MYKAD_IDENTIFIER]   │
 │ • Evaluator Sandbox: ?mode=demo (Zero Quota)  │     │ • Phone MSISDN Redaction: [REDACTED_PHONE_NUMBER]      │
 └───────────────────────────────────────────────┘     └────────────────────────────────────────────────────────┘
                                                                           │
 ─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────
                                                                           ▼
 ROW 2: DETERMINISTIC FACT ENGINE (Runs locally BEFORE AI in <40ms — Zero API Cost)
 ┌───────────────────────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
 │ CHECKPOINT 1: BINARY FORENSICS (<35ms)        │     │ CHECKPOINT 2: REGISTRY & THREAT CACHE (<2ms)           │
 │ • ISO 32000-1 byte parsing & %EOF validation  │ ──► │ • Master Ledger Lookup: Expected Bank & BIC Matching   │
 │ • Consumer Editor Blacklist (iLovePDF, Canva) │     │ • PDRM CCID SemakMule: In-memory Mule Account Registry │
 │ • Timestamp Desync: |T_Mod - T_Create| > 1hr  │     │ • Callback Shield: Suppress mobile; expose landline    │
 └───────────────────────────────────────────────┘     └────────────────────────────────────────────────────────┘
                                                                           │
 ─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────
                                                                           ▼
 ROW 3: COGNITIVE INVESTIGATION & DUAL-PATH POLICY ARBITRATION
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────────
 │ CHECKPOINT 3: ISOLATED AI INVESTIGATOR (Gemini 2.5 Flash, 1.2s)                                      │
 │ • Sandboxed prompt delimited by <UNTRUSTED_INBOUND_DOCUMENT> tags (Zero prompt injection bypass)     │
 │ • Detects manufactured urgency ("pay within 2h"), authority intimidation & audit secrecy excuses     │
 │ • Diagnostic JSON output only (Zero direct financial disbursement authority)                         │
 └───────────────────────────────────────────────────────────────────────────────────────────────────────
                         │                                                 │
            [ NORMAL EXECUTION PATH ]                           [ EXCEPTION / TIMEOUT / HTTP 429 ]
                         ▼                                                 ▼
 ┌───────────────────────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
 │ CHECKPOINT 4A: POLICY RISK ARBITER            │     │ CHECKPOINT 4B: FAIL-CLOSED SAFETY RECOVERY             │
 │ • Formula: R = max(S_Mule, min(100, ∑ wi·Ii)) │     │ • AI API timeout or rate limit triggered               │
 │ • Ledger Mismatch (80) | SemakMule Hit (99)   │     │ • Tags: AI_COGNITIVE_UNAVAILABLE                       │
 │ • Tamper Desync (20)   | Coercive Urgency (15)│     │ • Deterministic fail-closed: FORCES LOCKED_CRITICAL    │
 └───────────────────────────────────────────────┘     └────────────────────────────────────────────────────────┘
                         │                                                 │
                         └───────────────────────┬─────────────────────────┘
 ────────────────────────────────────────────────┼─────────────────────────────────────────────────────────
                                                 ▼
 ROW 4: CONTAINMENT, DUAL GOVERNANCE & STATUTORY ARTIFACTS
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ CHECKPOINT 5: RUNTIME CONTAINMENT & DUAL-AUTHORIZATION GOVERNANCE                                    │
 │                                                                                                      │
 │  🔒 AUTOMATED ERP PAYMENT LOCK                                                                       │
 │     • Immediate voucher freeze (PAYMENT_LOCKED) in ERP database layer                                │
 │                                                                                                      │
 │  👥 4-EYES SEGREGATION OF DUTIES (SoD)                                                               │
 │     • Step 1: AP Clerk verbal callback to verified landline (+60 3-7722 8888)                        │
 │     • Step 2: Finance Manager cryptographic override (Disabled in UI until Step 1 completes)         │
 │                                                                                                      │
 │  📑 AUTONOMOUS STATUTORY ARTIFACT SYNTHESIS                                                          │
 │     • 1-Click PDRM CCID / NSRC 997 Police Complaint Dossier (AMLA 2001 Section 44 Freeze Window)    │
 │     • In-Reply Gmail Dispute Challenge Draft (Places invoice on formal compliance hold)              │
 │     • Append-Only SHA-256 Audit Trail: H = SHA-256(PDF_Bytes || Audit_State) (Evidence Act 1950)     │
 └──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
```text
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
