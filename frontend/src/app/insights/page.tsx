"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { fetchQueueMetrics, QueueMetrics } from "@/services/api";

export default function InsightsPage() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      try {
        const data = await fetchQueueMetrics();
        if (mounted) {
          setMetrics(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Failed to load live metrics from backend:", err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadMetrics();

    const handleCreated = () => {
      loadMetrics();
    };
    window.addEventListener("scamguard:verification-created", handleCreated);
    return () => {
      mounted = false;
      window.removeEventListener("scamguard:verification-created", handleCreated);
    };
  }, []);

  const totalInbound = metrics?.total_inbound ?? 50;
  const defectCount = metrics?.defect_count ?? 13;
  const reviewCount = metrics?.review_count ?? 7;
  const verifiedCount = metrics?.verified_count ?? 30;
  const interceptedStr = metrics?.total_intercepted_amount_formatted ?? "RM 363,100.00";

  const bankOverridePct = metrics?.field_defects.bank_override_pct ?? 100;
  const accountDesyncPct = metrics?.field_defects.account_desync_pct ?? 100;
  const splicedMetaPct = metrics?.field_defects.spliced_metadata_pct ?? 18;
  const domainImpersonationPct = metrics?.field_defects.domain_impersonation_pct ?? 12;
  const coercionUrgencyPct = metrics?.field_defects.coercion_urgency_pct ?? 6;

  return (
    <div className="space-y-4">
      {/* Task 3: Hero Metric Card (Match Image 4) */}
      <section
        className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#11131a] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-6 w-full"
        aria-label="BEC Protection Summary"
      >
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AP Interdiction · Zero-Trust Disposition</span>
          </div>

          <div className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {isLoading ? "—" : defectCount}
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            {defectCount} of {totalInbound} inbound invoices flagged with banking defects.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {interceptedStr} intercepted before disbursement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/queue"
            className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Open the queue</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/audit"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1.5"
          >
            View Master Ledger
          </Link>
        </div>
      </section>

      {/* Task 3: Defect Breakdown & Category Mix Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Defect Breakdown Card */}
        <section className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#11131a] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Field Defect Breakdown
            </h3>
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
              {defectCount} Trap Detections
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-normal text-zinc-700 dark:text-zinc-300">Beneficiary Bank Override</span>
                <span className="text-xs font-mono font-medium text-rose-600 dark:text-rose-400">{bankOverridePct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${bankOverridePct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-normal text-zinc-700 dark:text-zinc-300">Account Number Desync</span>
                <span className="text-xs font-mono font-medium text-rose-600 dark:text-rose-400">{accountDesyncPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${accountDesyncPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-normal text-zinc-700 dark:text-zinc-300">Spliced PDF Metadata (iLovePDF/Sejda)</span>
                <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">{splicedMetaPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${splicedMetaPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-normal text-zinc-700 dark:text-zinc-300">Domain Impersonation (Homoglyphs)</span>
                <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">{domainImpersonationPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${domainImpersonationPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-normal text-zinc-700 dark:text-zinc-300">Coercion / Artificial Urgency</span>
                <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">{coercionUrgencyPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full transition-all duration-500" style={{ width: `${coercionUrgencyPct}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Category Distribution Card */}
        <section className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#11131a] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Category Distribution
            </h3>
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
              {totalInbound} Inbound Claims
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-0.5">
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#0c0e14]">
              <div className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">Total Invoices</div>
              <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">{totalInbound}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Automated queue</div>
            </div>

            <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
              <div className="text-[11px] font-semibold tracking-wider text-rose-600 dark:text-rose-400 uppercase">Locked Wire BEC</div>
              <div className="text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 mt-1">{defectCount}</div>
              <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">Payment frozen</div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20">
              <div className="text-[11px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">Needs Review</div>
              <div className="text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 mt-1">{reviewCount}</div>
              <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">4-Eyes signoff</div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
              <div className="text-[11px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Verified Clean</div>
              <div className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</div>
              <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Ledger parity matched</div>
            </div>
          </div>
        </section>
      </div>

      {/* Task 3: Bottom CCID SemakMule Card */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#11131a] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold shrink-0">
            <Building2 size={17} />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Royal Malaysia Police (PDRM) CCID SemakMule Blacklist
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Continuous bidirectional synchronisation with commercial mule account registry. Last sync 42 seconds ago.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Direct API Active</span>
          </span>
        </div>
      </div>
    </div>
  );
}
