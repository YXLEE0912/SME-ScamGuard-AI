# SME-ScamGuard-AI — Authoritative Design System Specification

**Design System Name:** SME-ScamGuard Enterprise Defense Design System (EDDS)  
**Version:** 2.0.0 (Production Implemented)  
**Architecture:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript 5  
**Core Aesthetic:** High-Density Forensic Security Cockpit · Hairline Precision Over Heavy Elevation · Semantic Color Discipline  
**Target Viewports:** 1920×1080 / 1440×900 / 1366×768 Desktop Operations Console & Responsive Workspaces (≥320px)

---

## 1. Executive Summary & Design Philosophy

The **SME-ScamGuard-AI Design System** establishes a cohesive, high-density, enterprise-grade interface tailored for SME Accounts Payable (AP) finance teams, forensic accountants, and commercial fraud investigators. Adapted from the proven human-in-the-loop operational ergonomics of the Grabbers Averis Hackathon platform, this design system embodies precision, restrained elevation, high information clarity, and instantaneous incident triage without spreadsheet clutter.

### 1.1 Core Principles Adapted from Grabbers

1. **Clean Composition & Generous Whitespace:** Critical operational metrics and forensic fields breathe naturally without cognitive overload. Layouts avoid nested boxes within boxes.
2. **Hairline Structural Depth:** Elevation shadows are strictly restrained (`0 1px 2px rgba(0,0,0,0.04)`). Structural separation is achieved through crisp `1px solid var(--line)` hairline borders rather than heavy drop shadows.
3. **Strong Typographic Hierarchy:** Dual-font stack pairing a neo-grotesque sans-serif (`Inter`) for UI chrome with a monospaced tabular font (`JetBrains Mono`) for financial figures, bank accounts, SWIFT/BIC codes, transaction IDs, and cryptographic hashes.
4. **Signature Uppercase Micro-Labels (`.label`):** 11px uppercase labels with wide tracking (`+0.08em`) and muted ink for table headers, metadata eyebrows, and category pill prefixes.
5. **Structured Split-View Verification:** Direct, asymmetric comparison between the immutable **Master Procurement Ledger (Source of Truth)** and inbound **Suspicious Invoice Claims**, featuring character-level inline diffing (`diffSpan`).
6. **Strict Separation of Threat Risk vs. Model Certainty:** Risk score (0–100 threat severity) is distinctly decoupled from AI model confidence (certainty in extraction and forensic parity). High model certainty is explicitly guarded against being misinterpreted as financial safety.
7. **Keyboard Triage Ergonomics:** Fast keyboard-driven incident review (`J` next incident, `K` previous incident, `A` approve voucher dialog, `X` block/escalate workflow) protected with input focus guards.

### 1.2 Brand Identity Preservation

While adopting Grabbers' structural layout and hairline minimalism, SME-ScamGuard-AI strictly preserves its established cybersecurity identity:
- **Deep Slate Navy Surfaces (`#0f172a`, `#1e293b`):** Grounded, authoritative high-contrast primary buttons, navigation chrome, and branding boxes.
- **Forest Green Accents (`#059669`, `#10b981`):** Precision financial accents representing verified parity and cryptographic guarantees, replacing Grabbers' shipping burgundy.
- **Cool Neutral Canvas (`#f8fafc` in light, `#0b0f17` in dark):** Clean, glare-free backdrop optimized for extended 8-hour forensic auditing shifts.

---

## 2. Color Tokens & Semantic Matrix

Every color in the application is derived from semantic CSS custom properties defined in `frontend/src/app/globals.css`, supporting both native light mode and high-contrast dark mode.

### 2.1 Color Tokens Specification

| Token Variable | Light Mode (Hex) | Dark Mode (Hex) | Tailwind Equivalent | Role & Semantic Purpose |
|---|---|---|---|---|
| `--paper` | `#f8fafc` | `#0b0f17` | `bg-slate-50 / dark:bg-[#0b0f17]` | Application canvas backdrop |
| `--surface` | `#ffffff` | `#111827` | `bg-white / dark:bg-slate-900` | Primary card containers, tables, modals |
| `--surface-2` | `#f1f5f9` | `#1e293b` | `bg-slate-100 / dark:bg-slate-800` | Sunken fields, table hover, code containers |
| `--line` | `#e2e8f0` | `#1e293b` | `border-slate-200 / dark:border-slate-800` | Universal 1px hairline divider lines |
| `--line-strong` | `#cbd5e1` | `#334155` | `border-slate-300 / dark:border-slate-700` | Active borders, control outlines |
| `--ink` | `#0f172a` | `#f8fafc` | `text-slate-900 / dark:text-white` | Primary display titles, values, headings |
| `--ink-2` | `#334155` | `#cbd5e1` | `text-slate-700 / dark:text-slate-300` | Secondary body text, table row primary |
| `--ink-3` | `#64748b` | `#94a3b8` | `text-slate-500 / dark:text-slate-400` | Metadata timestamps, labels, helper text |
| `--brand-navy` | `#0f172a` | `#1e293b` | `bg-slate-900 / dark:bg-slate-800` | High-contrast branding mark, active tab |
| `--brand-green` | `#059669` | `#10b981` | `bg-emerald-600 / dark:bg-emerald-500` | Verified badges, primary success triggers |
| `--focus` | `#059669` | `#10b981` | `outline-emerald-600 / dark:outline-emerald-400` | Accessible keyboard focus outline ring |

### 2.2 Semantic Security States Matrix

Security status indicators adhere strictly to a 3-tier classification hierarchy across all badges, pills, alerts, and table rows:

| Security Classification | Semantic Color | Background (Light) | Background (Dark) | Text & Border Tone | Meaning & Operational Mandate |
|---|---|---|---|---|---|
| **SAFE / VERIFIED** | Emerald / Forest Green | `#ecfdf5` / `#dcfce7` | `#052e16` | Text: `#166534` / `#4ade80`<br>Border: `#bbf7d0` / `#14532d` | **Straight-Through Approved:** All 6 forensic parameters match registered Master Ledger. Safe for disbursement. |
| **SUSPICIOUS / WARNING** | Amber | `#fef3c7` | `#451a03` | Text: `#92400e` / `#fbbf24`<br>Border: `#fde68a` / `#78350f` | **Needs Human Review:** Discrepancy detected (e.g. unverified phone number, PDF metadata desync). Requires secondary signoff. |
| **CRITICAL_SCAM / THREAT** | Crimson / Rose Red | `#fee2e2` | `#450a0a` | Text: `#991b1b` / `#f87171`<br>Border: `#fecaca` / `#7f1d1d` | **Locked / Commercial Stop-Payment:** Unauthorized bank account switch, PDRM CCID mule blacklist hit, or BEC wire fraud trap. Blocks payment voucher. |

---

## 3. Typography Hierarchy

The application employs a tripartite typography system with strict tabular alignment for financial integrity:

### 3.1 Font Stacks
- **Interface & Chrome:** Inter (`var(--font-sans)`), fallback to `system-ui, -apple-system, sans-serif`.
- **Financial Monospace (`.num`):** JetBrains Mono (`var(--font-mono)`), fallback to `ui-monospace, SFMono-Regular, monospace` with `font-variant-numeric: tabular-nums`.

### 3.2 Modular Scale

| Style Token | Font Family | Size / Line-Height | Weight | Letter Spacing | Target Usage |
|---|---|---|---|---|---|
| **Page Title** | Inter | 20px / 28px (`text-lg sm:text-xl`) | 700 (Bold) | `-0.02em` | Page header titles, modal headings |
| **Section Heading** | Inter | 15px / 22px (`text-sm font-semibold`) | 600 (Semibold) | `-0.01em` | Card container titles, split-view strip |
| **Card Header** | Inter | 13px / 18px (`text-xs font-semibold`) | 600 (Semibold) | `0em` | Sub-panel titles, evidence headers |
| **Body Primary** | Inter | 13px / 20px (`text-xs`) | 400 (Regular) | `0em` | Email body text, justifications, notices |
| **Body Secondary** | Inter | 12px / 16px (`text-[12px]`) | 400 (Regular) | `0em` | Supporting explanations, descriptions |
| **Micro-Label (`.label`)** | Inter | 11px / 14px (`text-[11px]`) | 600 (Semibold) | `+0.08em` | Table column headers, field captions, tabs |
| **Financial Numeral (`.num`)** | JetBrains Mono | 13px / 18px (`text-xs`) | 600 (Semibold) | `0em` | Bank accounts, invoice sums, timestamps |
| **Metric Hero (`.num`)** | JetBrains Mono | 30px / 36px (`text-3xl font-bold`) | 700 (Bold) | `-0.02em` | Financial cockpit KPI values, risk scores |

---

## 4. Component Catalog & Implementation Specifications

### 4.1 Threat Severity Badges (`ThreatSeverityBadge.tsx`)

Reusable component normalizing application status contracts into consistent semantic geometry:
- Props: `status: ThreatSeverityStatus | string`, `size?: "sm" | "md" | "lg"`, `showIcon?: boolean`.
- Normalizes status values: `SAFE`, `VERIFIED`, `OK`, `RESOLVED`, `NEEDS_REVIEW`, `SUSPICIOUS`, `WARNING`, `DEFECT`, `LOCKED_CRITICAL`, `CRITICAL_SCAM`, `THREAT`.
- Geometry: Filled soft-tint pill with rounded-full border and geometric status icon or pulsing indicator dot.

### 4.2 Split Verification Cards (`SplitVerificationCard.tsx`)

Direct adaptation of Grabbers' 7-field discrepancy table tailored for Accounts Payable fraud prevention:
- **Columns:**
  1. `VERIFICATION FIELD`: Field label (Legal Name, Bank Name, Account Number, Official Phone, Amount, PO Number).
  2. `MASTER LEDGER · SOURCE OF TRUTH`: Registered vendor information stored in the immutable database.
  3. `INBOUND CLAIM · SUBMITTED VALUE`: Extracted invoice value with character-level inline discrepancy highlighting via `CharacterDiff`.
  4. `STATUS & MATCH`: Semantic badge indicating Match `[100]`, Disparity `[score]`, Missing `[0]`, or Corrected with override icon.
- **Inline Character Diff Engine (`diffSpan`):**
  Computes precise mismatch offsets between source-of-truth and draft strings, rendering mismatched digits (e.g. single altered digit in bank accounts or IBANs) wrapped in `<mark className="bg-rose-100 text-rose-700 underline font-bold">`.
- **Audit Correction Trigger:** Inline pencil button allowing AP clerks to log manual optical character recognition overrides with mandatory audit justification.

### 4.3 Live Risk Meter vs. Confidence Gauge (`LiveRiskGauge.tsx`)

Dual-metric gauge explicitly decoupling assessed threat level from model certainty:
- **Left Metric — Assessed Threat Risk (0–100):** Visual threat progress bar and tier (`LOW THREAT`, `SUSPICIOUS / ELEVATED`, `CRITICAL WIRE THREAT`).
- **Right Metric — Model Certainty (0–100%):** Reflects the AI system's confidence in its multimodal extraction and forensic parity calculation. Features an interactive tooltip explaining that high certainty confirms the accuracy of the threat finding, not transaction safety.

### 4.4 Security Action Bar (`SecurityActionBar.tsx`)

Operational control bar exposing legitimate backend endpoints:
- **Block & Report (Stop-Payment):** Triggers modal confirmation dialog requiring AP audit justification, invoking `/api/v1/demo/escalate/{id}`.
- **Approve & Release Voucher:** Triggers 4-eyes dual authorization confirmation, invoking `/api/v1/demo/approve/{id}`.
- **Human Re-verification:** Triggers Gemini Multimodal re-extraction, invoking `/api/v1/demo/re-extract/{id}` with real-time spinner feedback.
- **Audit Logging Guarantee:** Every consequential security decision is logged with operator ID, timestamp, and justification.

### 4.5 Application Shell & Navigation (`AppNavigation.tsx`)

Unified responsive layout shell:
- **Left Fixed Sidebar (`w-64`):** Slate-navy branding block, live AP Mailbox stream status with pulsing indicator, navigation links (Queue, Financial Cockpit, Audit Trail, Sync Master Ledger modal), PDRM CCID SemakMule online indicator, and operator profile card.
- **Top Sticky Header:** Breadcrumb path, page title, Quick Search bar (`Ctrl+K`), Theme Toggle (`ThemeToggle.tsx`), Keyboard Shortcuts Modal (`KeyboardShortcutsHelp.tsx`), and Primary Action Triggers (`+ New verification`, `Sync Ledger`).

---

## 5. Keyboard Ergonomics & Power Shortcuts

Operational reviewers processing large invoice batches can navigate and triage incidents without leaving the keyboard:

| Key Binding | Scope | Action | Safety Guard |
|---|---|---|---|
| `J` / `↓` | Verification Queue / Case | Navigate to next incident | Paused when focus is inside `<input>`, `<textarea>`, or contentEditable |
| `K` / `↑` | Verification Queue / Case | Navigate to previous incident | Paused when focus is inside `<input>`, `<textarea>`, or contentEditable |
| `A` | Incident Review | Open Approve & Sign Voucher modal | Requires explicit modal confirmation; does not blindly disburse |
| `X` | Incident Review | Open Block & Escalation modal | Requires mandatory justification text before submitting stop-payment |
| `Ctrl + K` / `⌘ + K` | Universal Global | Focus search input bar | Always active across all viewports |

Implemented via `useIncidentKeyboardShortcuts.ts` with strict tag verification to prevent shortcut misfires while editing form fields.

---

## 6. Viewport Adaptation & Responsive Breakpoints

| Viewport Breakpoint | Layout Strategy | Table & Split-View Behavior |
|---|---|---|
| **Desktop (≥ 1280px)** | Full 2-column cockpit: Left navigation sidebar (256px) + main operational viewport. | Structured 4-column discrepancy table with inline diffing and side-by-side evidence cards. |
| **Tablet (768px – 1279px)** | Collapsible sidebar; sticky top navigation header. | Horizontally scrollable discrepancy table; stacked evidence containers. |
| **Mobile (< 768px)** | Full-width single column; compact top header. | Vertically stacked key-value verification cards with touch-optimized action buttons. |

---

## 7. Quality Assurance & Verification Standards

All frontend implementations in SME-ScamGuard-AI must pass four validation gates before deployment:

1. **TypeScript Strict Type Check:**
   `cd frontend && npx tsc --noEmit` — Validates complete type safety with zero errors.
2. **ESLint Code Quality Check:**
   `cd frontend && npm run lint` — Validates zero ESLint errors and zero unused variable warnings.
3. **Production Next.js Build:**
   `cd frontend && npm run build` — Validates static page compilation, route bundling, and chunk generation across all 8 application routes (`/`, `/queue`, `/queue/[id]`, `/audit`, `/login`, etc.).
4. **Backend Parity Test Suite:**
   `pytest tests/` — Validates that all 62 adversarial security tests, OSINT SemakMule ingestion, API contracts, and pentest verification suites pass with zero regressions.

