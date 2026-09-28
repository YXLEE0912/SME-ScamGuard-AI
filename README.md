# 🛡️ SME-ScamGuard-AI

Local-first, privacy-preserving multi-agent defense system against Business Email Compromise (BEC) and invoice redirection fraud.

---

### 📌 Problem & Solution

Malaysian SMEs lose millions to silent invoice bank account alterations and typosquatted domains. Traditional spam filters miss these text-only attacks, while sending raw financial documents to cloud LLMs breaches statutory data privacy (PDPA).

**SME-ScamGuard-AI** uses an in-memory, privacy-preserving 4-agent pipeline:

1. **Agent 0 (Privacy Barrier):** Locally redacts Malaysian statutory PII (IC numbers, phone numbers, bank accounts) in-memory before external processing.
2. **Agent 1 (Identity & Ledger):** Performs sub-5ms Levenshtein typosquatting checks and internal vendor ledger matching.
3. **Agent 2 (Cognitive Analyst):** Leverages **Google Gemini 2.5 Flash** to identify psychological urgency, audit secrecy, and executive coercion, backed by an offline heuristic fallback.
4. **Agent 3 (Chief Risk Arbiter):** Halts suspicious wire payments and issues an **Out-of-Band Call Verification Voucher** pointing strictly to the vendor's pre-registered switchboard (`+60-3-7722-8888`).

---

### 🏗️ Architecture

```text
[ Inbound Invoice / Gmail IMAP ]
               │
               ▼
   [ Agent 0: PII Scrubber ] ──────────► In-memory local redaction (PDPA compliant)
               │
               ▼
   [ Agent 1: Identity & Ledger ] ─────► Levenshtein domain checks & ledger matching
               │
               ▼ (Sanitized context)
   [ Agent 2: Gemini 2.5 Flash ] ──────► Cognitive social engineering triage
               │
               ▼
   [ Agent 3: Chief Risk Arbiter ] ────► Composite scoring & Out-of-Band Call Voucher
               │
               ▼
   [ Dispatch & Alerting ] ────────────► Telegram mobile alerts + Next.js SOC Dashboard

---

###⚡ Quickstart1. Backend SetupBash# Clone and enter repo
git clone [https://github.com/YXLEE0912/SME-ScamGuard-AI.git](https://github.com/YXLEE0912/SME-ScamGuard-AI.git)
cd SME-ScamGuard-AI

# Create virtual environment & install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
2. Environment ConfigurationCreate a .env file in the project root:Code snippetRISK_THRESHOLD=50.0
ENVIRONMENT=development

# Google Gemini API
GEMINI_API_KEY=""

# Gmail Inbound IMAP (Optional)
GMAIL_USER=""
GMAIL_APP_PASSWORD=""

# Telegram Incident Bot (Optional)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
Note: If API keys are omitted, the system runs on its offline deterministic heuristic engine.3. Launch ServicesTerminal 1: Backend APIBashuvicorn app.main:app --reload --port 8000
Terminal 2: Next.js FrontendBashcd frontend
npm install
npm run dev
Open http://localhost:3000 to access the SOC Dashboard.🔌 API EndpointsMethodEndpointDescriptionGET/api/healthService status checkPOST/api/scanSubmits email text for 4-agent analysisPOST/api/gmail/syncFetches unread inbox messages via IMAPPOST/api/eval/benchmarkRuns 8-case synthetic Malaysian BEC benchmarkGET/api/reportsRetrieves session audit records📊 Benchmark ResultsEvaluated against data/eval_cases.json (Malaysian synthetic BEC corpus):Classification Accuracy: 100% (8/8 cases)False Positive Rate: 0.0%Local Engine Latency: ~42ms
