# 🛡️ SME-ScamGuard-AI

### Autonomous Accounts Payable Integrity & Business Email Compromise (BEC) Defense Platform

**Empowering Malaysian SMEs with zero-trust, privacy-first financial fraud defense.**

<p align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110_Async-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-PDPA_2010_%7C_BNM_RMiT-blue)](#-statutory--regulatory-compliance)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</p>

<p align="center">

**Zero-Disk Processing • Deterministic Risk Controls • Human-in-the-Loop Governance**

</p>

---

## 🔗 Links & Resources

| Resource | Link |
|---|---|
| 📽️ **Demo Video** | [Watch System Demonstration](https://drive.google.com/drive/folders/YOUR_DEMO_FOLDER_LINK) |
| 📊 **Presentation Slides** | [View Canva Presentation Deck](https://www.canva.com/design/DAG5KB75PwE/pYzvfDQ8524BDjRDIAS-8A/edit) |
| 🌐 **Live Verification Cockpit** | [sme-scamguard.vercel.app](https://sme-scamguard.vercel.app) |

---

## 📑 Table of Contents

- [🎯 The Challenge](#-the-challenge)
- [💡 Our Solution](#-our-solution)
- [🏗️ Technical Architecture](#️-technical-architecture)
- [🛠️ Key Technologies](#️-key-technologies)
- [🌟 Key Features](#-key-features)
- [📊 Empirical Evaluation](#-empirical-evaluation-400-scenarios)
- [🚀 Getting Started](#-getting-started)
- [📖 Operational Walkthrough](#-operational-walkthrough)
- [🗂️ Project Structure](#️-project-structure)
- [⚖️ Statutory & Regulatory Compliance](#️-statutory--regulatory-compliance)
- [🚧 Roadmap](#-roadmap)
- [👥 Contributors](#-contributors)
- [📄 License](#-license)

---

# 🎯 The Challenge

Malaysian Small & Medium Enterprises (SMEs) face critical solvency risks from **silent invoice bank-redirection and supplier thread-hijacking fraud**.

### 💸 The 8-Minute Laundering Window

Once an Accounts Payable (AP) clerk releases a payment via **DuitNow or Interbank GIRO (IBG)**, funds can be rapidly dispersed across multiple organized-crime mule tiers.

### 🛑 Perimeter Filters Fail

Traditional email authentication mechanisms such as **SPF, DKIM and DMARC** cannot determine whether an otherwise authentic supplier account has been compromised.

When attackers control the legitimate supplier mailbox:

- SPF can still pass.
- DKIM can still pass.
- DMARC can still pass.
- The malicious invoice can still arrive from a trusted account.

The problem therefore moves beyond **email authenticity** into **financial transaction integrity**.

### 📞 The Printed Phone Number Trap

Attackers can replace the contact number printed on an invoice with a fraudulent mobile number.

When an AP clerk calls the number shown on the invoice, the attacker can simply confirm the fraudulent bank account.

### ⚖️ Data Privacy Risk

Corporate invoices may contain sensitive information such as:

- MyKad / national identification numbers
- Phone numbers
- Employee or vendor information
- Banking information

Sending unredacted documents to public commercial AI services can introduce additional privacy and governance risks.

### 🎨 The Micro-SME False-Alarm Problem

Many Malaysian micro-vendors create or compress invoices using consumer tools such as:

- Canva
- iLovePDF
- Other PDF conversion/compression software

Rigid enterprise fraud systems may interpret unusual PDF metadata or production tools as malicious activity, creating unnecessary false alarms and disrupting legitimate commerce.

---

## 🌍 The Real-World Impact

### 🏢 Zero-SOC Reality

Many SMEs operate without a dedicated security operations team.

### 👤 Single Point of Failure

A single AP clerk may need to manually review dozens of invoices under tight payment-clearing deadlines.

This creates a dangerous gap between:

> **Email delivery → Invoice verification → Payment authorization**

SME-ScamGuard-AI is designed to close this gap **before funds are released**.

---

# 💡 Our Solution

**SME-ScamGuard-AI** functions as an automated virtual security analyst for Accounts Payable workflows.

The platform operates using a **zero-disk, in-memory processing model** and intercepts suspicious invoices before payment disbursement.

The system is built around three core defense pillars:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SME-SCAMGUARD-AI SOLUTION                            │
├──────────────────────────────┬──────────────────────────┬────────────────────┤
│ 🔍 1. Forensic Guard         │ ⚡ 2. Velocity & Context  │ 🛡️ 3. HITL 4-Eyes  │
│                              │                          │    Cockpit         │
│ • ISO 32000-1 binary parser  │ • 7-day spend window     │ • Burner number    │
│ • In-memory PDPA redaction   │ • >180-day dormancy      │   suppression      │
│ • PDRM CCID SemakMule check  │ • PO binding validation  │ • Verified         │
│ • Canva/iLovePDF heuristic   │ • AutoCount CSV sync     │   landline call    │
│                              │   in RAM                 │ • Visual           │
│                              │                          │   strikethrough    │
│                              │                          │ • NSRC 997 dossier │
└──────────────────────────────┴──────────────────────────┴────────────────────┘
```

---

# 🔍 1. Forensic Guard

### Deterministic Binary & Threat Intelligence Layer

#### 🔒 Zero-Disk PII Sanitizer

Redacts Malaysian MyKad identifiers:

```text
\d{6}-\d{2}-\d{4}
```

and mobile numbers directly in volatile heap memory.

The intended design avoids temporary `/tmp` persistence.

#### 📄 ISO 32000-1 Binary Forensics

Inspects PDF structural and metadata indicators including:

- `%EOF` trailer information
- Creation dates
- `/Producer` tool tags
- PDF structural characteristics

#### 🛡️ PDRM CCID SemakMule Check

Performs lookup against an indexed registry/cache of known police-flagged commercial-crime mule accounts.

#### 🎨 Dual-Factor Benign Tooling Rule

Consumer PDF tools such as Canva/iLovePDF are not automatically treated as malicious.

The system combines:

```text
PDF Tool Indicator
        +
Matching Ledger Bank Account
        ↓
CONSUMER_PDF_TOOL_BENIGN
```

This prevents legitimate invoice-generation tools from becoming automatic fraud verdicts.

---

# ⚡ 2. Velocity & Procurement Context Engine

### Financial Behavior & Procurement Validation

#### 📊 In-Memory Spend Window

Tracks cumulative spending over a **7-day sliding window** to identify:

- Payment bursts
- Micro-structuring
- Attempts to remain below approval thresholds

#### 🕒 Dormancy Recency Monitor

Vendor accounts that have been inactive for more than **180 days** can be flagged when they suddenly attempt new payment activity.

Example:

```text
DORMANT_VENDOR_ACTIVITY_DETECTED
```

#### 📦 Ghost Goods Interdiction

Invoices must satisfy canonical Purchase Order requirements.

Example:

```text
PO-ML-XXXXXX
```

Missing or invalid PO references can trigger additional review.

#### 🔐 Zero-Disk CSV Ingestion

AutoCount and SQL Account vendor exports are streamed into memory.

SHA-256 fingerprinting is used to help detect registry changes or unexpected data drift.

---

# 🛡️ 3. HITL 4-Eyes Verification Cockpit

### Human-in-the-Loop Governance

The system deliberately keeps final payment authorization under human control.

#### 📞 Out-of-Band Switchboard Shield

Attacker-controlled mobile numbers printed on invoices are suppressed.

The cockpit instead surfaces the verified corporate switchboard stored in the master ledger.

Example:

```text
+60 3-XXXX XXXX
```

#### ✏️ Inline Field Correction

AP clerks can correct OCR/extraction results only with a mandatory verification justification.

The interface preserves the original machine-extracted value using visual strikethrough:

```text
Verified Value
~~Machine Extracted Value~~
• Corrected
```

#### 🚨 1-Click Police Dossier Synthesis

The platform can compile a structured incident dossier for emergency escalation workflows involving:

- NSRC 997
- PDRM
- Relevant AMLA incident information

#### 📧 Automated Dispute Drafting

The system can prepare formal dispute notifications for active Gmail threads.

---

# 🏗️ Technical Architecture

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                         SME-SCAMGUARD-AI PIPELINE                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [ INGESTION GATEWAY ]                                                       │
│                                                                               │
│  ├─ Gmail REST API (RFC 5322 Inbound MIME Stream)                            │
│  ├─ AutoCount / SQL Account CSV Ingestion                                    │
│  │  └─ Volatile Heap Memory Buffer                                           │
│  └─ Interactive Enterprise Mailbox                                           │
│     └─ 50 Pre-Staged SME Invoices                                            │
│                                                                               │
│  [ TIER 1: DETERMINISTIC IN-MEMORY FORENSICS ]                              │
│                                                                               │
│  ├─ Stage 0: PDPA 2010 PII Sanitizer                                         │
│  │           └─ MyKad & Mobile Regex Token Scrubbers                        │
│  │                                                                           │
│  ├─ Stage 1: ISO 32000-1 Binary Structural & Metadata Inspector              │
│  │                                                                           │
│  ├─ Stage 2: 3-Way Relational Match                                          │
│  │           └─ Email Body vs Invoice PDF vs Master Ledger                   │
│  │                                                                           │
│  ├─ Stage 3: PDRM CCID SemakMule Syndicate Cache Lookup                      │
│  │                                                                           │
│  └─ Stage 4: In-Memory Velocity Tracker                                      │
│             └─ 7-Day Sliding Window + >180d Dormancy Check                   │
│                                                                               │
│  [ TIER 2: COGNITIVE INVESTIGATION & POLICY ARBITRATION ]                    │
│                                                                               │
│  ├─ Stage 5: Google Gemini 2.5 Flash                                         │
│  │           └─ Sandboxed Untrusted Document Analysis                        │
│  │           └─ Extracts urgency & pressure cues                             │
│  │           └─ No payment approval authority                                │
│  │                                                                           │
│  └─ Stage 6: Deterministic Risk Formula Arbiter                              │
│             └─ R = 0 to 100                                                  │
│             └─ Fail-Closed Safety Net                                        │
│                                                                               │
│  [ TIER 3: HITL GOVERNANCE & CONTAINMENT ]                                   │
│                                                                               │
│  ├─ Stage 7: Dual-Authorization Approval Gate                                │
│  │           └─ Clerk landline callback + Manager override                   │
│  │                                                                           │
│  ├─ Stage 8: Automated ERP Payment Lock                                      │
│  │           └─ Drops line from Maybank2E/CIMB batch files                    │
│  │                                                                           │
│  └─ Stage 9: NSRC 997 Police Dossier                                         │
│             └─ SHA-256 Audit Trail                                           │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                  ENTERPRISE VERIFICATION COCKPIT                             │
│                              NEXT.JS 14                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ 📥 Triage Queue                                                              │
│    520 All Invoices | 27 Review | 18 Locked | 475 Verified                   │
│                                                                               │
│ ⏱️ Mailbox Ingestion Loading / Skeleton Hydration                            │
│                                                                               │
│ 🔍 Side-by-Side Reconciliation Inspector                                     │
│    Ledger Truth vs Invoice Draft                                             │
│                                                                               │
│ ✏️ Field Correction Modal                                                    │
│    Mandatory Landline Justification + Strikethrough                          │
│                                                                               │
│ 📤 Two-Tier Document Ingestion                                                │
│    Local Regex → Multimodal Vision Fallback                                  │
│                                                                               │
│ 📜 Tamper-Evident Session Audit Trail                                        │
│    CSV / JSON Export                                                         │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

# 🛠️ Key Technologies

| Component | Technology | Purpose |
|---|---|---|
| **Backend API** | FastAPI + Uvicorn / Python 3.12 | Asynchronous, low-latency service pipeline |
| **Cognitive Vision AI** | Google Gemini 2.5 Flash | Unstructured invoice normalization & coercion detection |
| **Binary Forensics** | Python `pypdf` + binary scanners | PDF structural & metadata inspection |
| **In-Memory Store** | Python `defaultdict` / volatile heap | Sliding-window spend tracking & token scrubbing |
| **Threat Intelligence** | PDRM CCID SemakMule cache | Commercial-crime mule detection |
| **Frontend Cockpit** | Next.js 14 + TypeScript | Enterprise AP verification cockpit |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Responsive enterprise interface |
| **Dossier Generator** | Python ReportLab | Structured incident dossier generation |
| **Audit Hashing** | Python `hashlib` / SHA-256 HMAC | Tamper-evident audit integrity |

---

# 🌟 Key Features

## 🔒 Zero-Disk In-Memory Processing

The platform is designed to process sensitive invoice information in volatile memory.

Capabilities include:

- Malaysian MyKad redaction
- Phone-number redaction
- In-memory ledger ingestion
- No intentional temporary `/tmp` persistence

---

## 🛡️ Prompt Injection Shield

Inbound invoice content is treated as **untrusted input**.

Conceptually:

```text
<UNTRUSTED_INBOUND_DOC>
    Invoice / Email / OCR Content
</UNTRUSTED_INBOUND_DOC>
```

Gemini operates as an **entity and context extraction layer**.

The final payment decision remains under deterministic application logic rather than being delegated to the LLM.

---

## 📞 Out-of-Band Landline Switchboard Shield

The platform separates:

```text
Attacker-Controlled Invoice Contact
                ↓
          DO NOT TRUST
                │
                ▼
Verified Corporate Switchboard
                ↓
       Independent Verification
```

This prevents an attacker from controlling both the invoice and the verification channel.

---

## ⏱️ Fail-Closed Safety Architecture

If the cognitive AI service becomes unavailable, times out, or returns an error such as HTTP `429`:

```text
AI unavailable
      ↓
AI_COGNITIVE_UNAVAILABLE
      ↓
LOCKED_CRITICAL
      ↓
Human verification required
```

The system therefore does **not** automatically fail open and release the payment.

---

## 📊 In-Cell Audit Strikethrough

Corrected values preserve the original machine extraction.

Example:

```text
Verified:
MAYBANK — 5142XXXXXX

Original extraction:
~~CIMB — 5142XXXXXX~~

Status:
• Corrected
```

This improves traceability and helps auditors understand what was changed and why.

---

# 📊 Empirical Evaluation — 400 Scenarios

The defense pipeline was evaluated against an automated test suite of **400 synthetic operational and adversarial scenarios** based on an authentic 40-vendor Malaysian ledger.

> **Important:** These metrics represent the project's controlled benchmark evaluation and should not be interpreted as production-world fraud detection accuracy.

### Benchmark Summary

```text
================================================================================
SME-SCAMGUARD-AI: 400-SCENARIO BENCHMARK SUMMARY
================================================================================

Total Scenarios Evaluated : 400 / 400
Evaluation Completion     : 100.00%

Classification Accuracy   : 100.00%

Adversarial Attack Recall : 100.00%
                            250 / 250 threat vectors intercepted

False Positive Rate       : 0.00%
                            0 / 150 legitimate invoices falsely blocked

Average Core Engine
Latency                    : 0.021 ms / invoice

================================================================================
```

### Detailed Results

| # | Test Cohort | Volume | Target Verdict | Actual Result | Success Rate | Primary Interdiction Engine |
|:-:|---|---:|---|---|---:|---|
| **1** | Legitimate Clean Invoices | 100 | `VERIFIED` | 100 Cleared | 100.0% | 3-Way Relational Ledger Match |
| **2** | Micro-SME Canva / iLovePDF Bills | 50 | `VERIFIED` | 50 Cleared | 100.0% | Dual-Factor Benign Tooling Rule |
| **3** | In-Transit BEC Redirection Attacks | 50 | `LOCKED_CRITICAL` | 50 Blocked | 100.0% | Email Body vs PDF Bank Cross-Check |
| **4** | Tampered Invoices / PDF Bank Splicing | 50 | `LOCKED_CRITICAL` | 50 Blocked | 100.0% | Master Ledger Mismatch + Metadata Skew |
| **5** | PDRM CCID SemakMule Blacklist Hits | 50 | `LOCKED_CRITICAL` | 50 Blocked | 100.0% | CCID Threat Intelligence Match |
| **6** | Dormant Vendor Resurrections >180d | 35 | `NEEDS_REVIEW` | 35 Flagged | 100.0% | Inactivity Recency Delta Trigger |
| **7** | Micro-Structuring / Velocity Bursts | 35 | `NEEDS_REVIEW` | 35 Flagged | 100.0% | 7-Day Spend Cap & Burst Tracker |
| **8** | Ghost Goods / Missing or Bad PO | 30 | `NEEDS_REVIEW` | 30 Flagged | 100.0% | Mandatory PO Prefix Validation |
| **∑** | **TOTAL BENCHMARK BATTERY** | **400** | — | **400 Passed** | **100.00%** | **Zero-Defect Baseline** |

---

# 🚀 Getting Started

## Prerequisites

- **Python 3.10+**  
  Python 3.12 recommended
- **Node.js 18+**
- **npm**
- Optional: Google Gemini API key

> If no Gemini API key is provided, the project can operate using its offline deterministic heuristic engine and in-memory ledger database.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YXLEE0912/SME-ScamGuard-AI.git
cd SME-ScamGuard-AI
```

### 2. Create the Python virtual environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS / Linux

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -e .
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

---

# ⚙️ Environment Configuration

Create a `.env` file in the project root:

```env
ENVIRONMENT=development
RISK_THRESHOLD=50.0

# Optional: Google Gemini API
# Required for multimodal scan normalization
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: Gmail REST API / IMAP Listener
GMAIL_USER=""
GMAIL_APP_PASSWORD=""
```

If `GEMINI_API_KEY` is omitted, the system executes using the offline deterministic heuristic engine and in-memory ledger database.

---

# 🧪 Run Benchmark Suite

Verify system integrity and rule enforcement across all 400 benchmark scenarios:

```bash
python backend/scripts/benchmark_eval.py
```

---

# ▶️ Run Development Servers

### Terminal 1 — FastAPI Backend

```bash
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Next.js Enterprise Cockpit

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 📖 Operational Walkthrough

## 1. Inbound Triage Queue

Navigate to:

```text
/queue
```

Select:

> **Continue with demo mailbox**

The demo mailbox contains **50 pre-staged Malaysian corporate invoices**.

Users can:

- Search invoices
- Filter by category
- Filter by triage status
- Observe the mailbox ingestion interface
- Review suspicious invoices

Example categories:

```text
Logistics
Packaging
Hardware
Utilities
```

---

## 2. Side-by-Side Reconciliation Inspector

Navigate to:

```text
/queue/[id]
```

The inspector compares:

| Field | Master Ledger | Invoice |
|---|---|---|
| Vendor Name | ✅ | 🔍 |
| Bank Name | ✅ | 🔍 |
| Account Number | ✅ | 🔍 |
| Official Landline | ✅ | 🔍 |
| Amount | ✅ | 🔍 |
| PO Number | ✅ | 🔍 |

Users can trigger:

```text
⚡ Extract with Gemini
```

to perform live AI entity normalization.

---

## 3. Human-in-the-Loop Field Correction

Click:

```text
✏️ Correct...
```

on a flagged field.

The user must:

1. Enter the verified value.
2. Provide the required landline callback justification.
3. Confirm the correction.
4. Review the visual audit trail.

The interface preserves the original extracted value using strikethrough notation.

---

## 4. Containment & Statutory Response

For blocked fraud invoices, users can review the generated:

```text
PDRM CCID / NSRC 997 Incident Dossier
```

The system also provides:

- Dispute email drafting
- Incident evidence
- Audit history
- CSV / JSON audit export

Navigate to:

```text
/audit
```

to inspect the session audit trail.

---

# 🗂️ Project Structure

```text
SME-ScamGuard-AI/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── demo.py
│   │   │   │   └── Demo mailbox, re-extraction & HITL correction endpoints
│   │   │   │
│   │   │   ├── ledger.py
│   │   │   │   └── AutoCount / SQL Account CSV ingestion
│   │   │   │
│   │   │   └── scan.py
│   │   │       └── Email MIME & document verification endpoints
│   │   │
│   │   ├── schemas/
│   │   │   ├── invoice.py
│   │   │   └── ledger.py
│   │   │
│   │   └── main.py
│   │       └── FastAPI service entrypoint
│   │
│   ├── services/
│   │   ├── binary_forensics.py
│   │   │   └── ISO 32000-1 PDF byte scanner
│   │   │
│   │   ├── document_extractor.py
│   │   │   └── Gemini multimodal vision normalizer
│   │   │
│   │   ├── ledger_sync.py
│   │   │   └── Volatile CSV streaming & SHA-256 drift guard
│   │   │
│   │   ├── privacy_sanitizer.py
│   │   │   └── In-memory MyKad & phone redaction
│   │   │
│   │   ├── reconciliation.py
│   │   │   └── 3-way match, SemakMule & policy arbiter
│   │   │
│   │   └── velocity_store.py
│   │       └── 7-day spend tracker & dormancy checker
│   │
│   ├── data/
│   │   ├── demo_mailbox.json
│   │   ├── semakmule_cache.json
│   │   └── vendor_ledger.csv
│   │
│   └── scripts/
│       ├── benchmark_eval.py
│       └── generate_demo_mailbox.py
│
├── frontend/
│   ├── app/
│   │   ├── queue/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── audit/
│   │   │   └── page.tsx
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── CorrectFieldModal.tsx
│   │   ├── NewVerificationModal.tsx
│   │   └── ReconciliationTable.tsx
│   │
│   └── tailwind.config.ts
│
├── .env.example
├── pyproject.toml
├── requirements.txt
├── LICENSE
└── README.md
```

---

# ⚖️ Statutory & Regulatory Compliance

> **Note:** The controls below are implemented as technical design mappings and should not be interpreted as legal certification or formal regulatory approval.

### 🇲🇾 Personal Data Protection Act 2010

The platform applies data-minimization controls by scrubbing MyKad identifiers and phone numbers in volatile processing buffers.

### 🏦 Bank Negara Malaysia Risk Management in Technology

The architecture incorporates controls aligned with principles such as:

- Segregation of duties
- Human approval
- Out-of-band verification
- Access control
- Auditability
- Fail-closed behavior

### 📜 Evidence Act 1950

Diagnostic events, clerk justifications and manager overrides are recorded in the application's audit trail with cryptographic integrity mechanisms.

### 🚨 Anti-Money Laundering Act 2001

The system supports structured incident information and emergency response dossier generation for suspected fraudulent payment incidents.

---

# 🚧 Roadmap

## Phase 1 — Ingestion Expansion ✅

- Gmail REST API inbound MIME stream parser
- In-memory CSV synchronization for AutoCount / SQL Account
- Two-tier parsing:
  - Local deterministic regex
  - Multimodal Gemini 2.5 Flash

---

## Phase 2 — Forensic Hardening ✅

- ISO 32000-1 binary inspection
- Dual-factor Canva/iLovePDF exception
- PDRM CCID SemakMule threat cache
- Rolling 7-day velocity tracking
- Dormancy detection
- PO prefix validation
- 400-scenario automated benchmark suite

---

## Phase 3 — Enterprise Integrations 🚧

- Microsoft 365 Exchange Online Graph API adapter
- Native bi-directional ERP webhooks
- AutoCount Cloud integration
- SQL Account integration
- Xero integration
- PayNet Zero-Knowledge Proof verification for bank-account queries

---

## Phase 4 — Advanced Computer Vision 📅

- Computer Vision Error Level Analysis (ELA)
- Detection of potentially spliced text in printed and rescanned invoices

---

zz
## 🏆 Competition

**Submitted for the UTAR Agentic AI Cybersecurity Hackathon 2026**

**Track:** Scam Defence & Awareness

---

# 📄 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for details.
