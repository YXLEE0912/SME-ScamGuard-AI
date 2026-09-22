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
---

### 5. Getting Started (Local Setup)
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

CASE_MY_LEGIT_01 (Safe): Standard 30-day managed IT service billing matching historical procurement accounts.

CASE_MY_EDGE_FALSE_POSITIVE_01 (Safe / Edge Case): Urgent Port Klang demurrage payment. Contains urgency phrasing, but passes all domain and banking checks, confirming resilience against naive keyword flagging.

CASE_MY_TAX_PHISH_03 (High): Fraudulent tax notice from a .org address threatening corporate bank freezes and director travel bans.


## 🛡️ Business Threat Context: Why SME Invoice Redirection & BEC?

### The Vulnerability of Southeast Asian SMEs
In B2B commerce, transactions cannot be settled with credit cards or consumer eWallets due to high merchant fees (1.5%–2%) and high transaction values (RM 10,000 to RM 200,000+). Instead, over 70% of Malaysian SMEs rely on:
1. Inbound PDF invoices sent via email.
2. Manual online banking transfers (Maybank2u Biz, CIMB BizChannel, DuitNow/IBG).
3. Lean finance setups (a single clerk, accountant, or the business owner).

Unlike multinational enterprises with strict multi-tier approval policies and dedicated treasury teams, an SME is highly vulnerable to **Business Email Compromise (BEC)** and **Vendor Impersonation Fraud**. Attackers use typosquatted lookalike domains (e.g., `mega-bu1ld.com.my` replacing `l` with `1`) or compromised vendor mailboxes to inject fraudulent bank accounts ("Our Maybank is under audit; please remit to this CIMB account"). A single 5-second lapse in attention can result in a loss of RM 150,000+, potentially causing an SME to collapse.

---

## 🤖 The 4-Agent Coordinated Forensic Architecture

Rather than relying on unmanaged, slow LLM chains that risk runtime errors, `SME-ScamGuard-AI` deploys a fast, deterministic multi-agent investigation pipeline running locally in memory:

[ Inbound Inbound Email / Invoice Data ]
│
▼
[ Agent 0: Privacy & Compliance Agent ]
• Local in-memory regex scrubbing (MyKad, Phone, Bank Accounts)
• Generates PDPA audit log (PIIRedactionLog)
│
▼
[ Agent 1: Identity & Wire Forensic Agent ]
• Homoglyph / typosquatting domain detection
• Bank account reconciliation against verified vendor baseline
│
▼
[ Agent 2: Psycho-Social Forensic Agent (CISA Framework) ]
• Scans for high-pressure deadlines, penalties, and communication isolation
• Differentiates operational stress from criminal coercion
│
▼
[ Agent 3: Chief Risk Arbiter & Action Agent ]
• Calculates composite Risk Score (0 - 100)
• Issues Out-of-Band Human Callback Voucher for scores >= 50
• Triggers instant mobile circuit breaker (Telegram alert)


### Agent Roles & Deliverables

| Agent | Core Functionality | Enterprise / Rubric Justification |
| :--- | :--- | :--- |
| **Agent 0: Privacy & Compliance** | In-memory PII anonymization (`sanitize_text_in_memory`). Masks MyKad, phone numbers, and accounts before downstream analysis. | **PDPA Statutory Compliance:** Zero data leakage of proprietary payroll or financial records. |
| **Agent 1: Identity & Wire** | Evaluates domain typosquatting (`SUSPICIOUS_DOMAINS`) and validates declared accounts against the internal verified vendor whitelist. | **MITRE ATT&CK T1566.002:** Stops homoglyph attacks and unauthorized payee diversion at the source. |
| **Agent 2: Psycho-Social CISA** | Lexical heuristic scanner targeting artificial urgency, threats of operational disruption, and forced secrecy. | **CISA Social Engineering Framework:** Detects coercive manipulation designed to bypass dual controls. |
| **Agent 3: Chief Risk Arbiter** | Synthesizes cues into an explainable 0–100 threat score and generates the Out-of-Band Telephone Verification Voucher. | **Human-in-the-Loop Governance:** Prevents false alarms while enforcing verified phone call verification on high-risk transfers. |

---

## 📊 Deterministic Composite Risk Scoring Model

Our composite risk scoring model derives directly from **NIST SP 800-30**, **SpamAssassin heuristic baselines**, and the **CISA Social Engineering Threat Framework**:

$$\text{Risk Score} = \text{Baseline (10.0)} + \text{Domain Anomaly (45.0)} + \text{Wire/Bank Anomaly (30.0)} + \text{Urgency Weight (10.0 or 15.0)}$$

### Scoring Weights Rationale

* **Baseline (10.0):** Standard external email metadata. In zero-trust architecture, no inbound external message carries 0 risk.
* **Lookalike / Spoofed Domain (+45.0):** Homoglyph typosquatting is deliberate criminal forgery. It immediately elevates any email past the scam threshold (10 + 45 = 55.0).
* **Unverified Bank Change (+30.0):** Mandate diversion represents direct fund exposure. When combined with baseline, it sits at 40.0 (Suspicious / Manual Review).
* **CISA Urgency (+10.0 Standalone / +15.0 Combined):**
  * *Standalone (+10.0):* Recognizes that legitimate business logistics (e.g., port demurrage penalties) can be urgent without being scams ($10 + 10 = \mathbf{20.0} \rightarrow \text{Safe}$).
  * *Combined (+15.0):* When paired with a new bank or suspicious domain, urgency serves as a coercive forcing function ($10 + 45 + 30 + 15 = \mathbf{100.0} \rightarrow \text{Critical BEC}$).

### 3-Tier Risk Threshold & Governance Matrix

0                     40                     70                    100
[────── Green ─────────][────── Yellow ────────][──────── Red ─────────]
Auto-Pass             Human Review             Hard Lock &
(Routine Queue)      (Discrepancy Sign-Off)     Human Callback


| Score Range | Threat Level | Verdict (`is_scam`) | System Enforcement Action | Human Action Required |
| :---: | :---: | :---: | :--- | :--- |
| **0 – 39** | 🟢 **SAFE** | `False` | **Auto-Approved:** Proceeds to standard 30-day accounting queue. | None. Standard business flow continues. |
| **40 – 69** | 🟡 **SUSPICIOUS** | `False` (Review) | **Payment Paused:** Generates side-by-side discrepancy card. | Accounts clerk verifies context and approves/escalates. |
| **70 – 100** | 🔴 **CRITICAL BEC** | `True` | **Hard Lock & Circuit Breaker:** Freezes transaction and pushes instant Telegram alert. | **Mandatory Out-of-Band Call:** Must dial registered switchboard to confirm. |

---

## 🚫 Why We Never "Reply to Sender" (Out-of-Band Protocol)

A common mistake in naive security tools is emailing the sender back to ask: *"Did you change your bank account?"*

* **The Trap:** If an attacker has compromised the vendor's mailbox (Vendor Email Compromise) or spoofed the domain, **the attacker will respond to your email and confirm the fake bank account.**
* **The Solution:** Agent 3 enforces an **Out-of-Band Telephone Verification Protocol**:
  1. Payment is locked locally.
  2. The system pulls the **verified telephone number** from internal procurement records (`+60-3-7722-8888`), completely ignoring any contact details inside the suspicious email.
  3. The finance officer reads a pre-formatted verification prompt over the phone to confirm t
