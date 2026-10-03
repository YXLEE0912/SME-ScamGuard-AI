# 🛡️ SME-ScamGuard-AI

Local-first, privacy-preserving multi-agent defense system against Business Email Compromise (BEC) and invoice redirection fraud.

---

### 📌 Problem & Solution

Malaysian SMEs lose millions to silent invoice bank account alterations and typosquatted domains. Traditional spam filters miss these text-only attacks, while sending raw financial documents to cloud LLMs breaches statutory data privacy (PDPA).

**SME-ScamGuard-AI** combines hybrid in-memory document ingestion, statutory PII sanitization, deterministic ledger cross-verification, and structured cognitive reasoning into an asynchronous, local-first DAG pipeline:

* **Stage 0 (Hybrid Ingestion & OCR Engine):** Ingests digital invoices (`.pdf`, `.txt`) in-memory via `pypdf` (<15ms). Automatically falls back to **Gemini 2.5 Flash Native Multimodal Vision** for scanned photocopies or mobile snapshots—zero bulky C++ OCR binaries required.
* **Agent 0 (Statutory Privacy Barrier):** Locally redacts Malaysian statutory PII (NRIC, phone numbers, credit card credentials) in volatile memory prior to external inference.
* **Agent 1 (Identity & Ledger Cross-Verifier):** Computes normalized Levenshtein typo-squatting distances and constructs a **Two-Way Discrepancy Matrix** comparing declared remittance accounts directly against the immutable `KNOWN_VENDORS` master ledger.
* **Agent 2 (Cognitive Analyst — Dual-Engine):** Uses Google Gemini 2.5 Flash (`google-genai` SDK) with strict Pydantic schemas to detect subtle psychological coercion, audit secrecy pretexts, and artificial urgency. Automatically fails over to an offline sub-50ms deterministic heuristic engine if air-gapped.
* **Agent 3 (Chief Risk Arbiter):** Computes a composite threat score (0–100), halts high-risk wire transfers, and generates an immutable **Out-of-Band Call Verification Voucher** pointing strictly to the vendor's pre-registered switchboard (`+60-3-7722-8888`).
* **Async Orchestration Layer:** Leverages FastAPI `BackgroundTasks` to asynchronously push real-time Telegram incident alerts and persist forensic audit logs without blocking the UI.

---

### 🏗️ Architecture

```text
[ Inbound Email / PDF Attachment ]
│
▼
[ Stage 0: Hybrid Ingestion & OCR ] ──► Digital: pypdf (<15ms) | Scanned: Gemini Vision
│
▼
[ Agent 0: PII Scrubber ] ────────────► In-memory local redaction (PDPA compliant)
│
▼
[ Agent 1: Identity & Ledger ] ───────► Domain typosquatting + Two-Way Discrepancy Matrix
│
▼ (Sanitized context)
[ Agent 2: Gemini 2.5 Flash ] ────────► Cognitive social engineering triage (Dual-Engine)
│
▼
[ Agent 3: Chief Risk Arbiter ] ──────► Threat Score (0-100) + Out-of-Band Call Voucher
│
▼
[ Async Dispatch & Telemetry ] ───────► Telegram SOC alerts + Next.js DAG Status Monitors
```
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
