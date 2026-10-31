# 🛡️ SME-ScamGuard-AI

### Autonomous Accounts Payable BEC Interdiction & Multi-Agent Financial Defense Framework

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Pytest-75%2F75%20Passed-emerald)](https://docs.pytest.org/)
[![Benchmark](https://img.shields.io/badge/400--Case_Benchmark-100%25_Recall-brightgreen)](backend/scripts/benchmark_eval.py)

> **"Email authenticity ≠ Payment authenticity."**  
> *Stop Business Email Compromise (BEC) and invoice redirection fraud before the wire transfer leaves your bank.*

---

## 📑 Executive Summary & Mission

Malaysian Small and Medium Enterprises (SMEs) face a catastrophic threat vector: **Business Email Compromise (BEC) and Vendor In-Transit Diversions**. Attackers compromise a legitimate supplier's Microsoft 365 or Google Workspace account, quietly monitor email threads, and intercept payment requests. Because the email originates from the genuine, SPF/DKIM/DMARC-authenticated supplier mailbox, conventional perimeter spam filters mark it as **100% Clean**.

The attacker then attaches a subtly altered PDF invoice requesting urgent payment to an alternate commercial "mule" bank account under the pretext of an annual statutory audit, branch migration, or SST tax settlement. Without dedicated cybersecurity teams, Accounts Payable (AP) clerks disburse funds into attacker-controlled accounts. In Malaysia alone, commercial scams and BEC divert hundreds of millions of Ringgit annually.

**SME-ScamGuard-AI** is a local-first, multi-agent defense architecture that interdicts payments **between invoice receipt and bank disbursement**. By decoupling unprivileged AI perception from deterministic financial state mutation, the platform enforces strict mathematical risk invariants, sub-millisecond 3-way relational reconciliation, volatile-RAM privacy preservation, and human-in-the-loop 4-Eyes dual governance.

---

## 🏛️ Master 3-Tier Supervision Architecture

SME-ScamGuard-AI establishes an application-layer financial interdiction boundary between untrusted external communications (supplier mailboxes, inbound PDF invoices, vendor claim updates) and outbound ERP disbursement systems (AutoCount, SAP, SQL Account).

```
                              ┌────────────────────────────────────────────────────────┐
                              │                    INGESTION LAYER                     │
                              │  RFC 5322 MIME Streams · Raw PDF Payloads · CSV Ledger │
                              └───────────────────────────┬────────────────────────────┘
                                                          │
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: DETERMINISTIC ENGINE (Sub-millisecond static & relational verification; avg latency: 0.021 ms)                │
│  ├─ Agent 1: In-Memory Privacy Sanitizer (RAM Layer — volatile heap, PDPA regex redaction)                          │
│  ├─ Agent 2: Deterministic Binary Forensics (Byte Layer — ISO 32000-1 trailer/xref, %%EOF, Δt timestamp delta)       │
│  └─ Agent 3: Ground-Truth Registry & Threat Cache (Relational Layer — 3-way reconciliation & indexed SemakMule)      │
└─────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                                          │ Validated evidence & claims
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: COGNITIVE INVESTIGATION (Perception Layer — Gemini 2.5 Flash)                                                │
│  ├─ Agent 4: Cognitive Behavioral Investigator (Unprivileged sandbox, prompt injection fences, urgency extraction)   │
│  └─ Agent 7: OSINT Police Threat Intelligence Ingestion (Hydration Layer — provenance validation, atomic cache update)│
└─────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                                          │ Structured claims (no execution authority)
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: POLICY ARBITRATION & INCIDENT RESPONSE (Governance & Response Layers)                                       │
│  ├─ Agent 5: Declarative Policy Arbiter & Fail-Closed Safety Net (Formal Risk Scoring R, State Machine)             │
│  └─ Agent 6: Containment & Statutory Artifact Synthesis (ERP lock request, NSRC 997 dossier, SHA-256 audit chain)   │
└─────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
                              ┌────────────────────────────────────────────────────────┐
                              │         HUMAN-IN-THE-LOOP 4-EYES GOVERNANCE            │
                              │  Registered Switchboard Callback · Manager Dual-Sign   │
                              └───────────┬────────────────────────────────┬───────────┘
                                          │                                │
                                          ▼                                ▼
                              ┌──────────────────────┐         ┌───────────────────────┐
                              │       VERIFIED       │         │    LOCKED_CRITICAL    │
                              │  Ledger Parity Match │         │ Voucher Frozen in ERP │
                              │ Standard AP Release  │         │ NSRC 997 Referral Pkg │
                              └──────────────────────┘         └───────────────────────┘
```

### Strict Separation of Authority (The Core Safety Invariant)

1. **Zero Financial Mutation Privileges for LLMs**: Large Language Models (LLMs) extract behavioral claims, detect coercive phrasing, and measure artificial urgency, but possess **ZERO authority** to approve payment vouchers, alter supplier bank details, waive compliance checks, or clear locked state flags.
2. **Deterministic Governance**: Disposition decisions (`VERIFIED`, `NEEDS_REVIEW`, `LOCKED_CRITICAL`) are computed exclusively by deterministic policy code evaluating immutable mathematical invariants.
3. **Fail-Closed Invariant**: Probabilistic models cannot override a confirmed ledger mismatch or a SemakMule police blacklist hit. In the event of an AI timeout, API rate limit, or malformed schema output, the supervisor triggers `AI_COGNITIVE_UNAVAILABLE` which deterministically forces `LOCKED_CRITICAL`. An error condition **never** results in a silent approval.

---

## 🤖 The 7 Defense Agents

| Agent | Name & Layer | Operational Mandate | SLA / Latency |
|---|---|---|---|
| **Agent 1** | **In-Memory Privacy Sanitizer** *(RAM Layer)* | Strips Malaysian MyKad (`\b\d{6}-\d{2}-\d{4}\b`) and mobile numbers (`\b01[0-9]-?[0-9]{7,8}\b`) in volatile heap buffers (`io.BytesIO`). Strictly zero persistence to physical disk storage, fully complying with Section 10 of Malaysia's Personal Data Protection Act 2010 (Act 709). | $< 5\text{ ms}$ |
| **Agent 2** | **Deterministic Binary Forensics** *(Byte Layer)* | Conducts ISO 32000-1 static inspection of invoice PDF byte streams using `pypdf` and byte offsets. Detects modification timestamp desync ($\Delta t > 3600\text{s}$), multiple `%%EOF` incremental splicing, and applies the **Dual-Factor Benign Tooling Invariant** (`Canva`/`iLovePDF` penalty neutralized *only* if bank account matches Master Ledger). | $< 35\text{ ms}$ |
| **Agent 3** | **Ground-Truth Registry & Threat Cache** *(Relational Layer)* | Executes 3-way relational reconciliation between Email Body Claims, PDF Remittance Instructions, and the Master Procurement Ledger snapshot. Queries destination accounts against the local PDRM CCID SemakMule commercial mule cache ($O(1)$ lookup, $S=99$ override). | $< 2\text{ ms}$ (Lookup: $<0.003\text{ ms}$) |
| **Agent 4** | **Cognitive Behavioral Investigator** *(Perception Layer)* | Analyzes natural language in email bodies and invoice notes for contextual deception, social engineering, and artificial urgency. Sandboxed inside `<UNTRUSTED_INBOUND_DOC>` demarcated XML blocks to defeat OWASP LLM01 Prompt Injections. Output restricted to strict Pydantic JSON schema. | $\sim 800\text{ ms}$ (Offline fallback: $<1\text{ ms}$) |
| **Agent 5** | **Declarative Policy Arbiter & Fail-Closed Safety Net** *(Governance Layer)* | Evaluates multi-factor risk formula $R \in [0, 100]$ across deterministic checks, cognitive scores, temporal markers, and velocity metrics. Enforces strict finite state machine boundaries:
$R < 50 \implies \text{VERIFIED}$
$50 \le R < 80 \implies \text{NEEDS\_REVIEW}$
$R \ge 80 \implies \text{LOCKED\_CRITICAL}$ | $< 1\text{ ms}$ |
| **Agent 6** | **Containment & Statutory Artifact Synthesis** *(Response Layer)* | Synthesizes immediate ERP disbursement hold requests, generates pre-filled Royal Malaysia Police (PDRM) NSRC 997 referral packages, drafts in-thread vendor dispute notices, and records tamper-evident SHA-256 HMAC cryptographic event chains (Evidence Act 1950 Section 90A). | $< 15\text{ ms}$ |
| **Agent 7** | **OSINT Police Threat Intelligence Ingestion** *(Hydration Layer)* | Ingests real-time PDRM CCID scam news advisories via a 2-stage provenance gate (`POST /api/v1/intel/ingest-police-alert`), normalizes account digits, and atomically updates `semakmule_cache.json` without downtime. | $< 50\text{ ms}$ |

---

## 📐 Formal Mathematical Risk Scoring Model

The Policy Arbiter (Agent 5) evaluates the totality of deterministic signals, cognitive scores, temporal markers, and velocity metrics through an immutable mathematical risk formula:

$$R = \max\Big(S_{\text{SemakMule}}, \min\big(100, w_1 \cdot I_{\text{Ledger}} + w_2 \cdot I_{\text{Tool}} + w_3 \cdot I_{\text{Urgency}} + w_4 \cdot I_{\text{Auth}} + w_5 \cdot I_{\text{Context}}\big)\Big)$$

### Configured Parameter Weights

| Parameter | Weight | Indicator Description | Evaluation Condition |
|---|---:|---|---|
| **$w_1$ ($I_{\text{Ledger}}$)** | **75** | Master Procurement Ledger Parity Breach | $1$ if inbound PDF bank account does not match Master Ledger; $0$ if exact match. |
| **$w_2$ ($I_{\text{Tool}}$)** | **20** | PDF Tooling Anomaly or Splicing Marker | $1$ if anomalous tool without ledger match or incremental trailer splicing detected; $0$ otherwise. |
| **$w_3$ ($I_{\text{Urgency}}$)** | **15** | Cognitive Coercion & Urgency Threshold | $1$ if normalized urgency score $> 70$; $0$ otherwise. |
| **$w_4$ ($I_{\text{Auth}}$)** | **25** | In-Transit Transport / Channel Divergence | $1$ if Email Claim contradicts PDF Document (`BEC_IN_TRANSIT_DIVERSION`); $0$ otherwise. |
| **$w_5$ ($I_{\text{Context}}$)** | **20** | Temporal & Velocity Spend Breach | $1$ if vendor dormant $> 180\text{d}$, 7-day spend cap breached, or PO missing/invalid; $0$ otherwise. |
| **$S_{\text{SemakMule}}$** | **99** | PDRM CCID Commercial Mule Account Hit | Confirmed match in local threat cache forces immediate voucher freeze ($R=99$). |

### State Transitions & Disposition Invariants

```
                             [ INCOMING INVOICE CLAIMS ]
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │ Compute R &   │
                                  │ Mandatory Invs│
                                  └───────┬───────┘
                                          │
                       ┌──────────────────┼──────────────────┐
                       ▼                  ▼                  ▼
                   [ R < 50 ]     [ 50 <= R < 80 ]       [ R >= 80 ]
                All Checks Pass   Discrepancy / Risk   Mule Hit / Mismatch
                       │                  │                  │
                       ▼                  ▼                  ▼
                 ┌───────────┐     ┌──────────────┐   ┌────────────────┐
                 │ VERIFIED  │     │ NEEDS_REVIEW │   │LOCKED_CRITICAL │
                 └───────────┘     └──────────────┘   └────────────────┘
                Standard Release    Dual Sign-off      Voucher Quarantined
                                    Required           Police Dossier
```

---

## 🖥️ Live Verification Cockpit (Zero-Clutter High-Contrast UI)

The frontend is crafted strictly according to [`frontend/DESIGN_SYSTEM.md`](frontend/DESIGN_SYSTEM.md) — a high-contrast corporate defense cockpit using Geist/Inter sans-serif, tight tracking, locked column geometries, and true-black OLED dark mode (`#090a0f`).

### 1. Verification Queue (`/queue`)
- **Summary Scope Pill Bar**: Instant one-click filtering by operational status (`All Emails`, `Needs Review`, `Defect`, `Verified`).
- **Unified Search & Category Filter**: Search by vendor name, invoice reference, bank account, or amount. Dynamic category filter derives business categories directly from backend records (`Logistics`, `Hardware`, `Manufacturing`, `Raw Materials`).
- **Locked Column Grid (`table-fixed min-w-[960px]`)**:
  - `EMAIL ID` (110px, monospace `font-mono text-xs`)
  - `SENDER` (220px, vendor title + monospace email subtext)
  - `SUBJECT` (320px, clean truncation with tooltip)
  - `CATEGORY` (160px, neutral slate badges `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`)
  - `STATUS` (170px, high-contrast semantic triage badges: `VERIFIED ✓`, `NEEDS REVIEW ●`, `DEFECT DETECTED ▲`)
  - `RISK SCORE` (130px, horizontal gauge with threshold tick marker at 80%)

### 2. Case Inspection Cockpit (`/case/[id]`)
- **2-Column Layout**: Left column (~72% width) for deep forensic investigation; right column (~28% sticky) for decision governance.
- **Inbound Claim vs. Master Ledger Parity**: Character-level diffing highlighting exact bank account discrepancies in amber/rose.
- **Interactive 7-Agent Defense Stepper**: Numbered status accordions (`01` through `07`) with individual confidence gauges and inline `[✎ Correct...]` human override workflows.
- **Out-of-Band Switchboard Shield**: The cockpit suppresses untrusted phone numbers printed on invoices and presents exclusively the verified corporate switchboard number from the Master Ledger (e.g., `+60 3-7722 8841`).
- **4-Eyes Dual Authorization**: Mandatory maker-checker workflow requiring AP Clerk callback confirmation and Finance Controller dual sign-off before releasing frozen vouchers.

### 3. Master Ledger & Cryptographic Audit Trail (`/audit`)
- **Master Ledger Health**: Real-time synchronization card tracking approved supplier records (40 canonical Malaysian vendors) with SHA-256 fingerprint verification.
- **Tamper-Evident Hash Chain**: Every operator inspection, field override, and decision action is chained into an immutable SHA-256 HMAC event ledger ($E_n = \text{SHA256}(E_n \mathbin{\Vert} E_{n-1})$).
- **Statutory Export**: One-click export to CSV and JSON for external regulatory audits.

### 4. AP Insights Dashboard (`/insights`)
- Real-time intercepted financial fraud loss counter (`RM 420,000+ Prevented`).
- Defect breakdown radar: Bank overrides (38%), Account desyncs (44%), Spliced metadata (19%), Domain homoglyphs (12%), Coercion/Urgency (19%).

---

## 📊 Benchmark Evaluation (400 Scenarios · 100% Recall · 0.00% FPR)

The core deterministic engine was evaluated against a comprehensive 400-scenario operational and adversarial test matrix across 8 declared cohorts:

| Cohort | Scenarios | Attack / Claim Type | Expected Verdict | Result | Target Assertion |
|---|---:|---|---|:---:|---|
| **Cohort 1** | 100 | Legitimate Routine Billing Invoices | `VERIFIED` | ✅ | 100% Straight-Through Pass Rate |
| **Cohort 2** | 50 | Legitimate Canva / iLovePDF Micro-SME Invoices | `VERIFIED` | ✅ | 0.00% False Positive Rate (Dual-Factor Rule) |
| **Cohort 3** | 50 | BEC In-Transit Email Diversions (Email $\neq$ PDF) | `LOCKED_CRITICAL` | 🚨 | 100% Intercepted (`BEC_IN_TRANSIT_DIVERSION`) |
| **Cohort 4** | 50 | Tampered PDF Invoices (Unauthorized Bank Redirect) | `LOCKED_CRITICAL` | 🚨 | 100% Intercepted (`UNAUTHORIZED_BANK_CHANGE`) |
| **Cohort 5** | 50 | PDRM CCID SemakMule Blacklisted Accounts | `LOCKED_CRITICAL` | 🚨 | 100% Intercepted ($S=99$ Override) |
| **Cohort 6** | 35 | Dormant Vendor Hijacks (>180 Days Inactivity) | `NEEDS_REVIEW` | ⚠️ | 100% Escalated for Dual Reauthorization |
| **Cohort 7** | 35 | Velocity Smurfing / Split-Invoice Structuring | `NEEDS_REVIEW` | ⚠️ | 100% Escalated (7-Day Rolling Cap Breach) |
| **Cohort 8** | 30 | Ghost Invoices / Missing PO / Invalid GRN Prefix | `NEEDS_REVIEW` | ⚠️ | 100% Held for Procurement Reconciliation |
| **TOTAL** | **400** | **150 Benign / 250 Attack Scenarios** | — | **100%** | **Accuracy: 100%, Recall: 100%, FPR: 0.00%** |

- **Deterministic Core Decision Latency**: Mean **0.021 ms** per invoice (Benchmark target SLA: $<0.05\text{ ms}$).
- **Pytest Suite**: **75 / 75 Tests Passed (100%)** across all layers, services, schemas, and API routers.

---

## 📁 Repository Structure & Directory Isolation

```
SME-ScamGuard-AI/
├── .agent/                             # Antigravity skill definitions (ap-audit)
├── backend/                            # Isolated Backend Service (FastAPI)
│   ├── app/                            # Application entry point & API routers
│   │   ├── main.py                     # FastAPI application factory & CORS configuration
│   │   ├── config.py                   # System thresholds & known constants
│   │   ├── models.py                   # Request & response Pydantic schemas
│   │   ├── orchestrator.py             # 7-Agent execution pipeline coordinator
│   │   ├── layers/                     # Core forensic & cognitive layers (Layers 1-6)
│   │   ├── routers/                    # Canonical REST API routes
│   │   │   ├── queue.py                # Queue inspection, override, decide endpoints
│   │   │   ├── ledger.py               # Master Ledger CSV sync & status endpoints
│   │   │   ├── demo.py                 # Simulated operational mailbox & live audit
│   │   │   └── mule_intel.py           # PDRM OSINT police alert ingestion endpoint
│   │   ├── schemas/                    # Pydantic v2 domain schemas
│   │   └── services/                   # Business logic & services
│   ├── data/                           # Canonical ground-truth datasets & caches
│   │   ├── vendor_ledger.csv           # 40-vendor Master Procurement Ledger snapshot
│   │   ├── demo_mailbox.json           # 50 operational Malaysian demo cases
│   │   ├── semakmule_cache.json        # Indexed PDRM CCID commercial mule account cache
│   │   ├── audits.json                 # Active cryptographic HMAC SHA-256 audit log
│   │   ├── benchmark_results.json      # 400-case evaluation benchmark results
│   │   └── eval_cases.json             # Synthetic test cases for regression testing
│   ├── models/                         # Domain models & schema validators
│   ├── scripts/                        # Automated benchmark & evaluation runners
│   │   ├── benchmark_eval.py           # 400-scenario evaluation benchmark suite
│   │   └── generate_demo_mailbox.py    # Synthetic operational demo generator
│   ├── services/                       # Standalone forensic, audit & policy engines
│   │   ├── audit_service.py            # Cryptographic event chaining (Evidence Act 1950)
│   │   ├── incident_response.py        # NSRC 997 dossier & dispute synthesis
│   │   ├── ledger_sync.py              # On-premise CSV zero-disk parser
│   │   ├── osint_mule_ingestion.py     # 2-stage PDRM alert ingestion pipeline
│   │   ├── pdf_forensics.py            # ISO 32000-1 binary structural inspector
│   │   ├── policy_arbiter.py           # Mathematical risk scoring engine & state machine
│   │   ├── privacy_sanitizer.py        # Volatile RAM regex PII redaction (PDPA 2010)
│   │   ├── reconciliation.py           # 3-way forensic relational reconciliation
│   │   ├── threat_cache.py             # In-memory SemakMule fast-lookup hash table
│   │   └── velocity_store.py           # 7-day rolling window spend velocity tracker
│   ├── tests/                          # 75-suite Pytest verification tests
│   ├── pyproject.toml                  # Backend project specification & pytest config
│   └── requirements.txt                # Python package dependencies
├── frontend/                           # Isolated Frontend Application (Next.js 15)
│   ├── public/                         # Static icons & brand assets
│   ├── src/                            # Next.js App Router source
│   │   ├── app/                        # Route pages (/queue, /case/[id], /audit, /insights)
│   │   ├── components/                 # Unified cockpit components & design system UI
│   │   ├── hooks/                      # Hotkey navigation & custom hooks
│   │   ├── lib/                        # Diff algorithms & formatters
│   │   └── services/                   # REST API client & auth layer
│   ├── DESIGN_SYSTEM.md                # Authoritative Frontend Design Contract
│   ├── next.config.ts                  # Next.js runtime configuration
│   ├── package.json                    # Frontend package dependencies & scripts
│   └── tsconfig.json                   # TypeScript strict compiler configuration
├── .env.example                        # Template environment variables
├── .gitignore                          # Repository exclusion definitions
├── AGENTS.md                           # Authoritative 7-Agent Architecture Specification
├── IMPLEMENTATION_PLAN.md              # Authoritative Master Roadmap & Phase Tracking
├── pyproject.toml                      # Root-level Python tool configuration
├── README.md                           # Authoritative Project Documentation (This Document)
├── requirements.txt                    # Root-level Python requirements
└── uv.lock                             # Hermetic lockfile
```

---

## ⚡ Quickstart Guide for Judges & Developers

### Prerequisites
- **Python 3.11+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** & **npm**
- Modern Web Browser (Chrome, Firefox, Edge, Safari)

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/YXLEE0912/SME-ScamGuard-AI.git
cd SME-ScamGuard-AI

# Create and activate Python virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate

# macOS / Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` (optional — offline deterministic fallback operates automatically if `GEMINI_API_KEY` is omitted):
```env
ENVIRONMENT=development
RISK_THRESHOLD=50.0
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Launch Backend Service

```bash
# Start FastAPI backend on http://127.0.0.1:8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Interactive API Swagger Documentation is accessible at: `http://127.0.0.1:8000/docs`*

### 4. Launch Frontend Cockpit

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

*Open your browser and navigate to: `http://localhost:3000` (or `http://localhost:3000/queue`)*

---

## 🧪 Comprehensive Verification & Test Execution

### 1. Execute Full Backend Pytest Suite (75/75 Tests)

```bash
python -m pytest -c pyproject.toml backend/tests/ -v
```
*Expected: 75 passed in < 1.5 seconds with 100% pass rate.*

### 2. Execute 400-Scenario Evaluation Benchmark

```bash
python backend/scripts/benchmark_eval.py
```
*Expected: 400 scenarios evaluated, 100% accuracy, 100% recall, 0.00% FPR, mean latency 0.021 ms.*

### 3. Execute Frontend TypeScript & ESLint Check

```bash
cd frontend
npx tsc --noEmit
npm run lint
```
*Expected: 0 type errors, 0 lint warnings.*

---

## 🇲🇾 Malaysian Statutory Compliance & Regulatory Alignment

SME-ScamGuard-AI is engineered specifically to satisfy Malaysian statutory and financial-crime regulatory standards:

1. **Personal Data Protection Act 2010 (PDPA, Act 709, Section 10)**:
   - Evaluates the Security Principle by guaranteeing that Malaysian MyKad identity numbers and employee mobile numbers are sanitized strictly in volatile RAM buffers (`io.BytesIO`). Raw unredacted personal data is never written to disk or transmitted to unauthenticated endpoints.
2. **Bank Negara Malaysia (BNM) Risk Management in Technology (RMiT)**:
   - Enforces **Segregation of Duties** through 4-Eyes Governance: an AP Clerk must dial the registered landline switchboard before a Finance Manager can execute a cryptographic payment release.
3. **National Scam Response Centre (NSRC 997) Direct Referral**:
   - Synthesizes pre-filled statutory incident reporting packets containing perpetrator banking credentials, SSM entity numbers, file SHA-256 digests, and forensic timelines formatted for rapid submission to NSRC hotline 997 and the Royal Malaysia Police CCID.
4. **Evidence Act 1950 (Act 56, Section 90A)**:
   - Produces computer-generated evidence certificates backed by recursive SHA-256 HMAC cryptographic audit chains to ensure statutory admissibility in Malaysian courts.

---

## 🏆 Hackathon Submission Metadata

- **Competition:** UTAR Agentic AI Cybersecurity Hackathon 2026
- **Team Name:** Team halo
- **Track:** Scam Defence & Awareness
- **Authoritative Specifications:**
  - Architecture & Agent Topology: [`AGENTS.md`](AGENTS.md)
  - Master Implementation Plan: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
  - Frontend Design Contract: [`frontend/DESIGN_SYSTEM.md`](frontend/DESIGN_SYSTEM.md)

---

<p align="center">
  <b>🛡️ SME-ScamGuard-AI</b><br>
  <i>AI-Assisted · Deterministic by Design · Human-Controlled · Local-First</i>
</p>
