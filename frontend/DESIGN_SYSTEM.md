# SME-ScamGuard-AI — Authoritative Design System Specification

**Design System Name:** SME-ScamGuard Enterprise Defense Design System (EDDS)  
**Contract Version:** 3.0.0 (Immutable Production Contract)  
**Architecture:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript 5  
**Core Aesthetic:** High-Density Fintech Defense Cockpit · Hairline Precision · Single-Font Harmony · Zero Cognitive Clutter  
**Target Viewports:** 1920×1080 / 1440×900 / 1366×768 Desktop Operations Console & Responsive Handhelds (≥320px)

---

## 1. Executive Summary & Design Philosophy

The **SME-ScamGuard-AI Design System** establishes a high-contrast, zero-clutter fintech defense cockpit architecture engineered for SME Accounts Payable (AP) finance teams, controllers, and forensic fraud investigators.

Adapted from the human-in-the-loop operational ergonomics of the benchmark DocuVerify and Grabbers platforms, this system prioritizes:
1. **Zero-Confusion Information Density**: Critical financial forensics and security signals are delivered with razor-sharp contrast and balanced negative space, preventing operational fatigue during high-volume invoice reconciliation shifts.
2. **Hairline Structural Depth**: Heavy drop shadows and thick 2px borders are eliminated in favor of clean 1px hairline dividers (`border-zinc-200/80` in light mode, `border-white/10` in dark mode) and subtle elevation (`shadow-[0_1px_2px_rgba(0,0,0,0.03)]`).
3. **Deterministic Single-Font Harmony**: Font chaos is abolished. The interface strictly standardizes on a single grotesque sans-serif family (**Inter** / system-ui) for 95% of the UI with tight letter-tracking, reserving monospace strictly for machine-verifiable technical data.
4. **Locked Semantic Fraud Triage**: Visual indicators for fraud disposition (Verified, Needs Review, Defect Detected) are cryptographically immutable tokens that cannot be tinted, muted, or overridden by brand themes.

---

## 2. Typography Scale & Font Contract

### 2.1 The Single Font Rule
- **Primary Typeface (95% of UI)**: **Inter** (`var(--font-sans)`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif).
- **Tabular Numbers**: Tabular numeral layout (`font-variant-numeric: tabular-nums`) is applied while retaining the primary sans-serif typeface. Monospace is **never** applied to headings, metric titles, or vendor counts.
- **Monospace Typeface (`font-mono`)**: Reserved **exclusively** for technical identifiers:
  - Case / Email IDs (`email_001`)
  - Cryptographic Hashes (`SHA256: 7f8a91b...4c2d89e1`)
  - Timestamps & Event Clocks (`Oct 31, 2026, 20:24:03 UTC`)
  - Raw JSON submission payloads and email header blocks
  - Sender email domain subtext (`billing@company.com`)

### 2.2 Strict Typographic Hierarchy
| Hierarchy Level | Classes | Font & Weight | Color Role (Light / Dark) | Usage |
|---|---|---|---|---|
| **Page Title** | `text-xl font-semibold tracking-tight` | Inter · Semibold (600) | `text-zinc-900` / `dark:text-zinc-100` | View headers (`AP Insights`, `Verification queue`, `Audit trail`) |
| **Hero Metric Number** | `text-4xl font-semibold tracking-tight` | Inter · Semibold (600) | `text-zinc-900` / `dark:text-zinc-100` | Cockpit primary metric (`13`, `29%`) |
| **Section Title** | `text-sm font-semibold` | Inter · Semibold (600) | `text-zinc-900` / `dark:text-zinc-100` | Card container titles, modal headers |
| **Card Eyebrow / Meta** | `text-[11px] font-semibold tracking-wider uppercase` | Inter · Semibold (600) | `text-zinc-400` / `dark:text-zinc-500` | Category labels, card meta headers, table `<th>` |
| **Table Body / Primary** | `text-xs font-medium` | Inter · Medium (500) | `text-zinc-900` / `dark:text-zinc-100` | Vendor names, action labels, primary table cell text |
| **Table Body / Secondary** | `text-xs font-normal` | Inter · Normal (400) | `text-zinc-700` / `dark:text-zinc-300` | Invoice subjects, event descriptions |
| **Technical ID / Stamp** | `font-mono text-xs` | JetBrains Mono · Regular/Medium | `text-zinc-500` / `dark:text-zinc-400` | Email IDs, timestamps, voucher hashes |
| **Technical Subtext** | `font-mono text-[11px]` | JetBrains Mono · Regular | `text-zinc-400` / `dark:text-zinc-500` | Sender email addresses under vendor name |

---

## 3. Component Geometry & Border Standards

All UI components adhere strictly to a 3-tier geometry contract:

```
┌────────────────────────────────────────────────────────┐
│  Outer Cards & Containers: rounded-xl (12px)          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Form Controls & Buttons: rounded-lg (8px)       │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Status Badges & Pills: rounded-full (999px)│  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1. **Outer Surfaces & Structural Cards**:
   - Corner Radius: `rounded-xl` (12px)
   - Hairline Border: `border border-zinc-200/80` (Light) / `border border-white/10` (Dark)
   - Elevation: `shadow-[0_1px_2px_rgba(0,0,0,0.03)]` (Light) / `shadow-none` (Dark)
   - Internal Padding: Standardized to `p-5` or `p-6` (zero irregular `p-3` or `p-8` containers)
2. **Interactive Form Controls & Action Buttons**:
   - Corner Radius: `rounded-lg` (8px)
   - Standard Height: `h-9` (36px) or `h-10` (40px)
   - Border: Hairline `1px` (`border-zinc-200` in light, `border-white/10` in dark)
3. **Triage Chips, Pills & Category Tags**:
   - Semantic Status Badges: `rounded-full` (pills) with `px-2.5 py-0.5 text-xs font-semibold`
   - Category Meta Tags: `rounded-md` (tags) with `px-2 py-0.5 text-[11px] font-medium`

---

## 4. Color Token Architecture

The design system is built upon a 5-color corporate brand foundation married to high-contrast neutral backgrounds. **No muddy beige, tan, or yellow fills are permitted.**

### 4.1 Light Mode Tokens (Primary Corporate Default)
- **Application Canvas Backdrop**: `#f8fafc` (Ultra-clean, crisp neutral canvas)
- **Card & Elevated Surfaces**: `#ffffff` (Pure white card bodies)
- **Sunken Surface / Input Base**: `#f1f5f9` (Subtle recessed base)
- **Primary Action Buttons**: `#0f1225` / `#0f172a` (Midnight navy with white text)
- **Interactive Focus & Active Links**: `#1f4b8e` (Deep steel blue)
- **Dividers & Hairlines**: `border-zinc-200/80` or `rgba(226, 232, 240, 0.8)`
- **Typography Ink**:
  - Primary Display: `#0f1225` / `#0f172a` (`text-zinc-900`)
  - Secondary Body: `#334155` (`text-zinc-700`)
  - Muted Metadata: `#64748b` (`text-zinc-400` / `text-zinc-500`)

### 4.2 Dark Mode Tokens (High-Contrast True-Black Cockpit)
- **Application Canvas Backdrop**: `#090a0f` (True black backdrop)
- **Card & Elevated Surfaces**: `#11131a` (Charcoal dark card surface)
- **Sunken Input / Code Block Base**: `#0c0e14` (Deep recessed base)
- **Hover Surface Elevation**: `#161a24` (Subtle hover elevation)
- **Dividers & Hairlines**: `border-white/10` (`rgba(255, 255, 255, 0.10)`)
- **Typography Ink**:
  - Primary Display: `#f8fafc` (`text-zinc-100`)
  - Secondary Body: `#cbd5e1` (`text-zinc-300`)
  - Ice-Blue Metadata: `#94a3b8` / `#93c5fd` (`text-zinc-400`)
- **Electric Accent**: `#3b82f6` (Electric cobalt for focus rings and active states)

---

## 5. Semantic Fraud Triage Indicators (Locked Whitelist)

> [!IMPORTANT]
> The fraud triage color matrix is an immutable security whitelist. Under no circumstances may these colors be softened, muted into grayscale, or swapped with corporate brand hues. Operators rely on immediate optical recognition to prevent unauthorized wire disbursements.

### 5.1 Three-Tier Classification Matrix
| Status Classification | Icon Token | Light Mode Styles | Dark Mode Styles | Operational Meaning |
|---|---|---|---|---|
| **VERIFIED / CLEAN** | `✓` | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800` | Master Ledger parity confirmed. Straight-through disbursement approved. |
| **NEEDS REVIEW** | `●` | `bg-amber-50 text-amber-800 border-amber-200` | `dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800` | Confidence warning, discretionary limit exceeded, or secondary approval required. |
| **DEFECT DETECTED / WIRE SCAM** | `▲` | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800` | Bank account desync, SemakMule blacklist hit, or metadata tampering. Immediate wire freeze. |

### 5.2 Dynamic Risk Score Gauges
The horizontal risk score gauge renders an inline track (`w-14 h-1.5 rounded-full`) with a threshold indicator tick:
- **Score < 50 or DEFECT**: Red/Rose fill (`bg-rose-500 dark:bg-rose-400`). Block payment voucher.
- **Score 50–84 or NEEDS_REVIEW**: Amber fill (`bg-amber-500 dark:bg-amber-400`). Requires 4-eyes dual authorization.
- **Score ≥ 85 or VERIFIED**: Emerald fill (`bg-emerald-500 dark:bg-emerald-400`). High-confidence parity match.
- **Threshold Marker**: A `1px` vertical tick rendered at `left-[80%]` or `left-[85%]` marking the human-review boundary.

---

## 6. Layout Contracts & Core Views

### 6.1 Global Shell & Navigation Rail ([`Shell.tsx`](file:///c:/Users/SCSM11/Downloads/SME-ScamGuard-AI/frontend/src/components/shell/Shell.tsx))
- **Width**: `w-60` (240px) expanded, `68px` collapsed.
- **Surface**: `bg-white dark:bg-[#11131a]` with `border-r border-slate-200/80 dark:border-white/10`.
- **Top Brand Lockup**: ScamGuard logo with deep blue check badge (`#1f4b8e`), `ScamGuard` text, `AP` tag, and subtext `Accounts Payable Defense`.
- **Mailbox Ingestion Widget**: Inset card directly beneath logo (`bg-slate-50 dark:bg-[#11131a] rounded-xl p-2.5 mx-3 mt-3 border border-slate-200/70 dark:border-white/10`) featuring active pulsing green dot, `ap-audit@target-sme.com.my`, and sync trigger.
- **Navigation Items (Strict 3-Item Model)**:
  1. `Insights` (`/insights`) &rarr; AP Insights & Cockpit
  2. `Queue` (`/queue`) &rarr; Verification queue (with `13` unread defect count badge in `bg-amber-500/15 text-amber-700`)
  3. `Audit` (`/audit`) &rarr; Master Ledger & Audit Trail
- **Bottom Profile**: Pinned to sidebar base with `FI` circular avatar, `Finance Ops`, and role `Operator`.

### 6.2 Verification Queue ([`QueuePage.tsx`](file:///c:/Users/SCSM11/Downloads/SME-ScamGuard-AI/frontend/src/app/queue/page.tsx))
- **Summary Filter Pill Bar**: Rendered above search bar as clean outlined buttons:
  `[ 50 All emails ]` `[ 13 Needs review ]` `[ 16 Defect ]` `[ 21 Verified ]`.
  Active pill rendered with high-contrast thin border `border-zinc-900 dark:border-white text-zinc-900 dark:text-white font-semibold`.
- **Unified Search & Filter Bar**: Single cohesive card container (`bg-white dark:bg-[#11131a] border border-zinc-200/80 dark:border-white/10 rounded-xl p-2`):
  - Search Input: Absolute magnifying glass icon, `pl-9` padding to prevent text collision, clean clear `[✕]` trigger.
  - Category Dropdown: `h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/10`.
  - Status Dropdown: `h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/10`.
- **Table Data Grid (`table-fixed min-w-[960px]`)**:
  - Explicit Column Width Allocation: `EMAIL ID` (110px), `SENDER` (220px), `SUBJECT` (320px truncate), `THREAT CATEGORY` (160px), `STATUS` (170px), `RISK SCORE` (130px).
  - Vertical Centering: Strict `py-3.5 align-middle` on all table cells.
  - Initial Selection State: Initialized to `selectedId = null`. The first row (`email_001`) **must not** render with an active blue border on load.
  - Row States:
    - Unselected: `bg-white dark:bg-[#11131a] border-l-4 border-transparent hover:bg-zinc-50/60 dark:hover:bg-[#161a24]`
    - Selected / Active: `bg-zinc-50 dark:bg-white/5 border-l-4 border-zinc-900 dark:border-white`
  - Sender Cell: Vendor name in `text-xs font-medium text-zinc-900`, sender email subtext in `font-mono text-[11px] text-zinc-400`.

### 6.3 Case Inspection Cockpit ([`page.tsx`](file:///c:/Users/SCSM11/Downloads/SME-ScamGuard-AI/frontend/src/app/case/[id]/page.tsx))
- **Navigation Breadcrumb**: Low-profile, borderless inline back-link:
  ```tsx
  <button onClick={() => router.push('/queue')} className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors py-1 cursor-pointer">
    <ArrowLeft className="w-3.5 h-3.5" />
    <span>Queue</span>
  </button>
  ```
- **Case Stepper Pagination**: Compact inline stepper (`1 of 50 < >`) in the header for rapid serial incident review.
- **Two-Column Cockpit Layout**:
  - **Left Column (~72% Width)**: Case Header Card &rarr; Inbound Claim vs. Master Ledger Parity Card with character-level diffing &rarr; 7-Agent Defense Pipeline with expandable accordions &rarr; Collapsible `Read the email` monospace disclosure.
  - **Right Column (~28% Width, Sticky)**: Pinned `DECIDE` action card (Approve & Authorize Payment, Escalate / Freeze Wire, dual-signoff progress) and cryptographic submission evidence payload (`JSON.stringify`).
- **7-Agent Defense Pipeline ([`MultiAgentPipeline.tsx`](file:///c:/Users/SCSM11/Downloads/SME-ScamGuard-AI/frontend/src/components/MultiAgentPipeline.tsx))**:
  - Vertical connected stepper with numbered circle badges (`01` through `07`). Redundant secondary icons are removed from step titles.
  - Expandable detail accordions with embedded Status Verification Card (Score gauge, human-review threshold tick at 85, and inline `[✎ Correct...]` override trigger).

### 6.4 Master Ledger & Audit Trail ([`AuditPage.tsx`](file:///c:/Users/SCSM11/Downloads/SME-ScamGuard-AI/frontend/src/app/audit/page.tsx))
- **Header Alignment**: `Audit trail` title with event count pill, explanatory subtitle, and right-aligned `[Export CSV]` and `[Export JSON]` secondary buttons.
- **Top Metrics Grid**: 3-column grid featuring Master Ledger Health (40 Verified Vendors), Forensic Chain Hash (SHA-256 HMAC signature), and Sync Master Ledger CSV drop card.
- **Audit Filter Card**: Single full-width search card with search input, action filter dropdown, sort toggle (`[⇅ Newest first]`), and manual reload button.
- **Audit Event Rows**: Chronologically ordered events featuring `#1` sequence numbers in monospace, `System note` action headers, inline UTC timestamps, and detailed descriptions with operator justifications.

---

## 7. Negative Constraints (Strict Prohibitions)

> [!CAUTION]
> The following patterns represent architectural regressions and must never be reintroduced into the codebase:

1. **NO Muddy Beige / Tan Fills**: Never apply `#eadbd4`, `#f1ece6`, heavy amber washes, or peach backgrounds to cards, table rows, or full headers. Canvas must be crisp neutral `#f8fafc` (light) or true-black `#090a0f` (dark).
2. **NO Initial Row Highlighting**: Never hardcode `selectedIndex = 0` or pre-select `email_001` on initial page load. Rows must render unselected until explicitly clicked or navigated via `J`/`K`.
3. **NO Clashing Corner Radii**: Never mix `rounded-3xl` with `rounded-lg` on outer containers. Cards are strictly `rounded-xl` (12px), controls are `rounded-lg` (8px), chips are `rounded-full`.
4. **NO Search Icon Collision**: Never omit left padding on search inputs. Search fields with an icon must include at least `pl-9` or `pl-10`.
5. **NO Redundant Inner Step Icons**: In the 7-Agent Defense Pipeline, do not place secondary icons next to agent titles when numbered circle stepper badges (`01`–`07`) already anchor the step.
6. **NO Monospace Font on General UI**: Monospace (`font-mono`) must never be applied to general headings, metrics, button text, or vendor titles. It is strictly for technical IDs, hashes, and timestamps.
7. **NO Tampering with Fraud Triage Colors**: Never modify or theme the semantic Emerald, Amber, and Rose tokens used for security verification states.

