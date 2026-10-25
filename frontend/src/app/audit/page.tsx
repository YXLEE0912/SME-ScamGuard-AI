"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileCode,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Edit2,
  RefreshCw,
  Search,
} from "lucide-react";
import { AuditEvent, fetchAuditTrail } from "@/services/api";

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditTrail();
      if (data && data.length > 0) {
        setEvents(data);
      } else {
        // Fallback default
        setEvents([
          {
            id: "evt_init01",
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
            action: "System note",
            badge_color: "neutral",
            description: "Initialized enterprise verification cockpit session with 50 operational Malaysian invoices.",
            justification: "Master Procurement Ledger parity synchronized (40 vendors).",
            operator_id: "OP-MY-KL01",
          },
        ]);
      }
    } catch {
      // Fallback
      setEvents([
        {
          id: "evt_init01",
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          action: "System note",
          badge_color: "neutral",
          description: "Initialized enterprise verification cockpit session with 50 operational Malaysian invoices.",
          justification: "Master Procurement Ledger parity synchronized (40 vendors).",
          operator_id: "OP-MY-KL01",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      e.action.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.justification.toLowerCase().includes(q) ||
      e.operator_id.toLowerCase().includes(q)
    );
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["ID", "Timestamp", "Action", "Description", "Justification", "Operator ID"];
    const rows = events.map((e) => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.action}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.justification.replace(/"/g, '""')}"`,
      `"${e.operator_id}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scamguard_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scamguard_audit_trail_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] text-neutral-900 dark:text-slate-100 font-sans pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/queue"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Link href="/queue" className="hover:underline">
                Work
              </Link>
              <span>/</span>
              <span className="font-semibold text-neutral-900 dark:text-white">Audit Trail</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAuditData}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Refresh audit events"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              id="btn-export-csv"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-export-json"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* SECTION 6.7: Header & Subtitle */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                <History className="w-6 h-6 text-[#1e293b] dark:text-blue-400" />
                Audit Trail
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Every correction, approval, and escalation from this session, in order. Held in memory; export to keep a copy.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">Total Events:</span>
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                {events.length}
              </span>
            </div>
          </div>

          {/* Search Filter */}
          <div className="mt-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search audit actions, descriptions, justifications, or operator IDs..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
            />
          </div>
        </div>

        {/* Chronological Event Table */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[16%]">Timestamp</th>
                  <th className="py-3 px-4 w-[16%]">Action Badge</th>
                  <th className="py-3 px-4 w-[48%]">Description & Justification</th>
                  <th className="py-3 px-4 w-[20%] text-right">Cryptographic / Operator ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-neutral-400">
                      Loading session audit logs...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-neutral-400">
                      No audit events match your search.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt, idx) => {
                    let badgeClass = "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
                    if (evt.action === "Payment Approved") {
                      badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                    } else if (evt.action === "Clerk Correction") {
                      badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
                    } else if (evt.action === "Re-extracted with Gemini" || evt.action === "New Ingestion") {
                      badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
                    } else if (evt.action === "Escalated") {
                      badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
                    }

                    return (
                      <tr key={evt.id || idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        {/* 1. Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {evt.timestamp}
                        </td>

                        {/* 2. Action Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                            {evt.action}
                          </span>
                        </td>

                        {/* 3. Description & Justification */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-900 dark:text-white leading-relaxed">
                            {evt.description}
                          </div>
                          {evt.justification && (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 italic">
                              Justification: {evt.justification}
                            </div>
                          )}
                        </td>

                        {/* 4. Operator ID */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                            {evt.operator_id}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
