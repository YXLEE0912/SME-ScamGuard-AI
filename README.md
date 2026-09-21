# SME-ScamGuard-AI

A local-first, zero-trust multi-agent defense system engineered to protect small and medium enterprises (SMEs) against Business Email Compromise (BEC), supplier impersonation, and fraudulent bank account redirection.

---

## 1. Problem Relevance & Cybersecurity Value

* **The Problem:** Malaysian SMEs face severe financial losses (ranging from RM250,000 to over RM6,000,000 per incident) from Business Email Compromise and invoice tampering. Attackers exploit procurement payment cycles by substituting bank accounts just before scheduled wire releases.
* **Why Traditional Defenses Fail:** BEC attacks rarely carry malicious binaries, macro attachments, or known suspicious URLs. They exploit social engineering, homoglyph domain mimicry, and psychological pressure to bypass traditional anti-spam filters.
* **The Solution:** A local-first, zero-cloud verification platform providing in-memory PII sanitization, dual domain and bank account matching against enterprise vendor registries, psychological pressure evaluation (aligned with CISA social-engineering mitigation guidelines), and automated human-in-the-loop callback vouchers before payouts can proceed.

---

## 2. Coordinated Multi-Agent Architecture

SME-ScamGuard AI coordinates four specialized internal agents via a deterministic state machine to deliver fast, explainable, and tamper-proof evaluations:

                  [ Inbound Message / Invoice ]
                   (Local IMAP / Synthetic Case)
                                │
                                ▼
   ┌────────────────────────────────────────────────────────┐
   │ Agent 0: Privacy & Compliance Agent                    │
   │ • In-memory regex scrubbing (Bank Acc, MyKad, Phone)   │
   │ • Prevents telemetry and PII leakage outside perimeter │
   └────────────────────────────┬───────────────────────────┘
                                │ Clean Text + Sanitization Logs
                                ▼
   ┌────────────────────────────────────────────────────────┐
   │ Investigative Layer (Parallel Inspection)              │
   │                                                        │
   │ Agent 1: Identity & Wire Forensic Agent                │
   │ • Typo-squatting & homoglyph domain detection          │
   │ • Enterprise procurement whitelist matching            │
   │                                                        │
   │ Agent 2: Psycho-Social Forensic Agent (CISA Framework) │
   │ • Scans for artificial urgency, coercive threats,      │
   │   and requests for communication isolation             │
   └────────────────────────────┬───────────────────────────┘
                                │ Forensic Findings & Scores
                                ▼
   ┌────────────────────────────────────────────────────────┐
   │ Agent 3: Chief Risk Arbiter & Action Agent             │
   │ • Synthesizes findings into a composite score (0-100)  │
   │ • High Risk: Circuit-breaks payout & generates out-of- │
   │   band telephone callback verification voucher         │
   │ • Verified Safe: Issues audit-approved payout notice   │
   └────────────────────────────────────────────────────────┘

---

## 3. Local Model Context Protocol (MCP) Integration

The system features a local **Model Context Protocol (MCP)** tool communicating via `stdio` JSON-RPC pipes:
* **Host Process:** FastAPI Backend (`app/services/mcp_client.py`)
* **MCP Server:** Decoupled subprocess running `app/mcp/gmail_mcp_server.py`
* **Transport:** Direct Python `imaplib` over SSL using standard Gmail App Passwords.
* **Zero Cloud Overhead:** No Google Cloud Platform (GCP) dependencies, no Pub/Sub message queues, no Cloud Run containers, and no external OAuth consent screens.

---

## 4. Repository Structure


sme-scamguard-ai/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application & route endpoints
│   ├── mcp/
│   │   ├── __init__.py
│   │   └── gmail_mcp_server.py  # Standalone stdio MCP server for IMAP inbox access
│   ├── models/
│   │   ├── __init__.py
│   │   └── schema.py            # Strict Pydantic v2 data models & contracts
│   └── services/
│       ├── __init__.py
│       ├── engine.py            # Coordinated multi-agent inspection engine
│       ├── mcp_client.py        # Subprocess stdio caller for MCP tools
│       └── pii.py               # In-memory regex PII sanitization service
├── data/
│   └── eval_cases.json          # Synthetic Malaysian BEC evaluation benchmark
├── tests/
│   ├── __init__.py
│   └── test_scam_guard.py       # Pytest suite (PII, scam detection & edge cases)
├── .env.example
├── pyproject.toml
└── README.md
5. Getting Started (Local Setup)
Prerequisites
Python 3.11 or 3.12

uv package manager (recommended) or standard pip

Node.js v18+ (for frontend dashboard)

Backend Setup
Bash
# 1. Clone repository and navigate to root directory
cd sme-scamguard-ai

# 2. Create and activate a virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 3. Install core dependencies
uv pip install fastapi uvicorn pydantic pytest requests python-dotenv

# 4. (Optional) Configure Gmail App Password for live inbox testing
cp .env.example .env
# Set GMAIL_USER and GMAIL_APP_PASSWORD in .env
Running the Test Suite
Verify that all evaluation cases, regex sanitization patterns, and false-positive boundaries pass:

Bash
pytest tests/test_scam_guard.py -v
Starting the Backend API
Bash
uvicorn app.main:app --reload --port 8000
Interactive API documentation is accessible at http://localhost:8000/docs.

Starting the Frontend Dashboard
Bash
cd frontend
npm install
npm run dev
Open http://localhost:3000 to access the SOC-style verification dashboard.

6. Synthetic Evaluation Benchmark
The evaluation dataset (data/eval_cases.json) models five realistic Malaysian enterprise scenarios:

CASE_MY_BEC_01 (Critical): Homoglyph domain attack (sunway-c0nstruction) requesting an unverified CIMB redirection under the guise of an audit freeze.

CASE_MY_CEO_FRAUD_02 (High): Impersonation of executive demanding confidential M&A escrow transfer via DuitNow while forbidding phone verification.

CASE_MY_LEGIT_01 (Safe): Standard 30-day managed IT service billing matching historical procurement accounts.

CASE_MY_EDGE_FALSE_POSITIVE_01 (Safe / Edge Case): Urgent Port Klang demurrage payment. Contains urgency phrasing, but passes all domain and banking checks, confirming resilience against naive keyword flagging.

CASE_MY_TAX_PHISH_03 (High): Fraudulent tax notice from a .org address threatening corporate bank freezes and director travel bans.
