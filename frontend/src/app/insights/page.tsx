"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
} from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="grid gap-5">
      {/* Top Hero: BEC Protection Banner (Full Width) */}
      <section className="card p-6 flex flex-col justify-between gap-6 w-full" aria-label="BEC Protection Summary">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AP Interdiction Active</span>
          </div>
          <div className="text-[72px] sm:text-[84px] font-semibold leading-[84px] tracking-[-0.04em] text-[var(--defect)] num">
            13
          </div>
          <p className="text-[22px] sm:text-[24px] font-semibold leading-7 tracking-[-0.01em] text-[var(--ink)]">
            <span className="text-[var(--ink-2)]">of <span className="num">50</span></span> inbound invoices flagged with banking defects.
          </p>
          <p className="text-[13px] text-[var(--ink-2)]">
            RM 486,200.00 in unauthorized wire transfers intercepted before disbursement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/queue" className="btn btn-primary self-start">
            Open the queue
            <ArrowRight size={14} />
          </Link>
          <Link href="/audit" className="btn btn-ghost text-xs">
            View Master Ledger
          </Link>
        </div>
      </section>

      {/* Middle Grid: Field Defect Breakdown & Category Mix */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: Defect Breakdown Horizontal Bars */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Field Defect Breakdown
            </h3>
            <span className="label">13 Trap Detections</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-[var(--ink-2)]">Beneficiary Bank Override</span>
                <span className="font-bold num text-[var(--defect)]">41%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div className="h-full bg-[var(--defect)] rounded-full" style={{ width: "41%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-[var(--ink-2)]">Account Number Desync</span>
                <span className="font-bold num text-[var(--defect)]">23%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div className="h-full bg-[var(--defect)] rounded-full" style={{ width: "23%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-[var(--ink-2)]">Spliced PDF Metadata (iLovePDF/Sejda)</span>
                <span className="font-bold num text-[var(--review-ink)]">18%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div className="h-full bg-[var(--review)] rounded-full" style={{ width: "18%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-[var(--ink-2)]">Domain Impersonation (Homoglyphs)</span>
                <span className="font-bold num text-[var(--review-ink)]">12%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div className="h-full bg-[var(--review)] rounded-full" style={{ width: "12%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-[var(--ink-2)]">Coercion / Artificial Urgency</span>
                <span className="font-bold num text-[var(--ink-3)]">6%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: "6%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Threat Category Distribution */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Category Distribution
            </h3>
            <span className="label">50 Inbound Claims</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
              <div className="label text-[10px]">Total Invoices</div>
              <div className="text-2xl font-bold num text-[var(--ink)] mt-1">50</div>
              <div className="text-[11px] text-[var(--ink-3)] mt-0.5">Automated queue</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--defect-tint)] border border-[var(--defect)]/20">
              <div className="label text-[10px] text-[var(--defect)]">Locked Wire BEC</div>
              <div className="text-2xl font-bold num text-[var(--defect)] mt-1">13</div>
              <div className="text-[11px] text-[var(--defect)] mt-0.5">Payment frozen</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--review-tint)] border border-[var(--review)]/20">
              <div className="label text-[10px] text-[var(--review-ink)]">Needs Review</div>
              <div className="text-2xl font-bold num text-[var(--review-ink)] mt-1">7</div>
              <div className="text-[11px] text-[var(--review-ink)] mt-0.5">4-Eyes signoff</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--ok-tint)] border border-[var(--ok)]/20">
              <div className="label text-[10px] text-[var(--ok)]">Verified Clean</div>
              <div className="text-2xl font-bold num text-[var(--ok)] mt-1">30</div>
              <div className="text-[11px] text-[var(--ok)] mt-0.5">Ledger parity matched</div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Card: SemakMule Integration Status */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Building2 size={18} />
          </div>
          <div>
            <div className="font-semibold text-xs text-[var(--ink)]">
              Royal Malaysia Police (PDRM) CCID SemakMule Blacklist
            </div>
            <p className="text-[11px] text-[var(--ink-3)]">
              Continuous bidirectional synchronisation with commercial mule account registry. Last sync 42 seconds ago.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill pill-ok text-[11px]">Direct API Active</span>
        </div>
      </div>
    </div>
  );
}
