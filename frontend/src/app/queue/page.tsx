"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Upload,
  X,
  ChevronRight,
} from "lucide-react";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";
import { formatMYR } from "@/lib/diff";
import { uploadNewVerification, fetchMailboxInvoices, DemoInvoice } from "@/services/api";

interface UnifiedInvoice {
  id: string;
  referenceId: string;
  vendorName: string;
  sender: string;
  subject: string;
  category: "BEC_WIRE_FRAUD" | "SEMAKMULE_HIT" | "LEGIT_CLAIM" | "FAIL_CLOSED" | "COERCION" | "PROMPT_INJECTION" | "ROUTINE_AUDIT";
  categoryLabel: string;
  status: "NEEDS_REVIEW" | "DEFECT" | "VERIFIED" | "RESOLVED";
  riskScore: number;
  amountMyr: number;
  claimedBank: string;
  claimedAccount: string;
  masterBank: string;
  masterAccount: string;
  discrepancyNote: string;
  receivedTime: string;
}

const BENCHMARKS: UnifiedInvoice[] = [
  {
    id: "QAT-02",
    referenceId: "INV-2026-8841",
    vendorName: "Mega Logistics Sdn Bhd",
    sender: "billing@mega-bu1ld.com.my",
    subject: "REQUEST REVISED BANKING REMITTANCE DETAILS - INV-2026-8841",
    category: "BEC_WIRE_FRAUD",
    categoryLabel: "BEC Wire Scam",
    status: "DEFECT",
    riskScore: 99,
    amountMyr: 98500.0,
    claimedBank: "CIMB Bank",
    claimedAccount: "8009-4411-2299",
    masterBank: "Maybank",
    masterAccount: "514012998877",
    discrepancyNote: "Unauthorized bank change: Claimed CIMB vs Ledger Maybank",
    receivedTime: "Today at 09:42 AM",
  },
  {
    id: "QAT-03",
    referenceId: "INV-2026-0391",
    vendorName: "Mega Logistics Sdn Bhd",
    sender: "remit@megalogistics-corp.com",
    subject: "Statutory Trustee Account Allocation Claim #0391",
    category: "SEMAKMULE_HIT",
    categoryLabel: "PDRM SemakMule Hit",
    status: "DEFECT",
    riskScore: 100,
    amountMyr: 42000.0,
    claimedBank: "Public Bank",
    claimedAccount: "1410029000123456",
    masterBank: "Maybank",
    masterAccount: "514012998877",
    discrepancyNote: "PDRM SemakMule Blacklist: Commercial Mule Flagged",
    receivedTime: "Today at 10:15 AM",
  },
  {
    id: "QAT-01",
    referenceId: "INV-2026-1002",
    vendorName: "Apex Office Supplies Sdn Bhd",
    sender: "invoicing@apexoffice.com.my",
    subject: "Tax Invoice #INV-2026-1002 - Monthly Stationeries & Ergonomic Chairs",
    category: "ROUTINE_AUDIT",
    categoryLabel: "Routine Billing",
    status: "VERIFIED",
    riskScore: 0,
    amountMyr: 4850.0,
    claimedBank: "Maybank",
    claimedAccount: "512345678901",
    masterBank: "Maybank",
    masterAccount: "512345678901",
    discrepancyNote: "Straight-Through Match: 100% Master Ledger Parity",
    receivedTime: "Today at 08:30 AM",
  },
  {
    id: "QAT-06",
    referenceId: "INV-2026-7711",
    vendorName: "TechNova Cloud Solutions",
    sender: "billing@technova.com.my",
    subject: "Critical Hosting Overdue Notice - Suspension in 2 Hours",
    category: "COERCION",
    categoryLabel: "Coercion & Urgency",
    status: "NEEDS_REVIEW",
    riskScore: 78,
    amountMyr: 14200.0,
    claimedBank: "Hong Leong Bank",
    claimedAccount: "003001928471",
    masterBank: "Hong Leong Bank",
    masterAccount: "003001928471",
    discrepancyNote: "Artificial Urgency Trigger: 2-Hour Suspension Threat",
    receivedTime: "Yesterday at 04:15 PM",
  },
  {
    id: "QAT-07",
    referenceId: "INV-2026-6612",
    vendorName: "Southern Timber & Hardware",
    sender: "admin@southerntimber.com.my",
    subject: "Bulk Timber Shipment Milestone Claim #6612",
    category: "PROMPT_INJECTION",
    categoryLabel: "Prompt Injection",
    status: "DEFECT",
    riskScore: 95,
    amountMyr: 65000.0,
    claimedBank: "Maybank",
    claimedAccount: "514011234567",
    masterBank: "Maybank",
    masterAccount: "512345678901",
    discrepancyNote: "Adversarial Prompt Override Embedded in PDF Metadata",
    receivedTime: "Yesterday at 02:20 PM",
  },
  {
    id: "QAT-04",
    referenceId: "INV-2026-4420",
    vendorName: "City Group Engineering",
    sender: "service@citygroup.com.my",
    subject: "Commercial HVAC Quarterly Maintenance Voucher #CG-4420",
    category: "ROUTINE_AUDIT",
    categoryLabel: "Routine Billing",
    status: "VERIFIED",
    riskScore: 0,
    amountMyr: 18200.0,
    claimedBank: "Maybank",
    claimedAccount: "512345678901",
    masterBank: "Maybank",
    masterAccount: "512345678901",
    discrepancyNote: "Master Procurement Ledger matched. AutoCount signed.",
    receivedTime: "Oct 28, 2026",
  },
];

function QueuePageContent() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<UnifiedInvoice[]>(BENCHMARKS);
  const [activeScope, setActiveScope] = useState<"ALL" | "NEEDS_REVIEW" | "DEFECT" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Hydrate additional mailbox data
  useEffect(() => {
    async function loadMailbox() {
      try {
        const live = await fetchMailboxInvoices();
        if (live && live.length > 0) {
          const adapted: UnifiedInvoice[] = live.map((inv: DemoInvoice) => {
            const isDefect = inv.status === "DEFECT" || inv.status === "LOCKED_CRITICAL" || inv.risk_score >= 80;
            const isReview = inv.status === "NEEDS_REVIEW" || (inv.risk_score > 20 && inv.risk_score < 80);

            const rawAmt = inv.comparison?.amount?.draft || "18500";
            const parsedAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, "")) || 18500;

            const claimedB = inv.comparison?.bank_name?.draft || "Maybank";
            const masterB = inv.comparison?.bank_name?.truth || "Maybank";
            const claimedA = inv.comparison?.account_no?.draft || "514012345678";
            const masterA = inv.comparison?.account_no?.truth || "514012345678";

            return {
              id: inv.id,
              referenceId: inv.id.toUpperCase(),
              vendorName: inv.sender_name || "Malaysian Vendor Sdn Bhd",
              sender: inv.sender_email,
              subject: inv.subject,
              category: isDefect ? "BEC_WIRE_FRAUD" : isReview ? "COERCION" : "ROUTINE_AUDIT",
              categoryLabel: inv.category || (isDefect ? "BEC Wire Scam" : "Routine Billing"),
              status: isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED",
              riskScore: inv.risk_score,
              amountMyr: parsedAmt,
              claimedBank: claimedB,
              claimedAccount: claimedA,
              masterBank: masterB,
              masterAccount: masterA,
              discrepancyNote: inv.banner_message || "Master Procurement Ledger cross-reference evaluated.",
              receivedTime: inv.received_date,
            };
          });

          // Combine benchmarks with live data, avoiding duplicates
          const seen = new Set(BENCHMARKS.map((b) => b.id));
          const uniqueExtra = adapted.filter((a) => !seen.has(a.id));
          setInvoices([...BENCHMARKS, ...uniqueExtra]);
        }
      } catch {
        // Fallback to static benchmarks
      }
    }
    loadMailbox();

    const handleCreated = () => {
      loadMailbox();
    };
    window.addEventListener("scamguard:verification-created", handleCreated);
    return () => window.removeEventListener("scamguard:verification-created", handleCreated);
  }, []);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return invoices.filter((item) => {
      // Scope filter
      if (activeScope === "NEEDS_REVIEW" && item.status !== "NEEDS_REVIEW") return false;
      if (activeScope === "DEFECT" && item.status !== "DEFECT") return false;
      if (activeScope === "VERIFIED" && item.status !== "VERIFIED") return false;

      // Category filter
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.referenceId.toLowerCase().includes(q) ||
          item.vendorName.toLowerCase().includes(q) ||
          item.sender.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.claimedAccount.toLowerCase().includes(q) ||
          item.claimedBank.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, activeScope, categoryFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: invoices.length,
      needsReview: invoices.filter((x) => x.status === "NEEDS_REVIEW").length,
      defect: invoices.filter((x) => x.status === "DEFECT").length,
      verified: invoices.filter((x) => x.status === "VERIFIED").length,
    };
  }, [invoices]);

  // Keyboard navigation: J/K to traverse, Enter to inspect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredRows.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "o") {
        e.preventDefault();
        const item = filteredRows[selectedIndex];
        if (item) {
          router.push(`/case/${encodeURIComponent(item.id)}`);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredRows, selectedIndex, router]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFile) return;
    setIsUploading(true);
    setUploadStatus(null);
    try {
      await uploadNewVerification(primaryFile, supportingFile || undefined);
      setUploadStatus("Invoice successfully ingested into verification queue.");
      setTimeout(() => {
        setUploadOpen(false);
        setPrimaryFile(null);
        setSupportingFile(null);
        setUploadStatus(null);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ingestion failed";
      setUploadStatus(`Error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-5">
      {/* Subtitle Description */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="max-w-3xl text-[14px] text-[var(--ink-2)]">
            Review inbound invoices, inspect banking discrepancies, and resolve BEC exceptions.
            Master Procurement Ledger cross-referenced in real-time with PDRM CCID SemakMule.
          </p>
        </div>
      </div>

      {/* Status Metric Pills Row (Grabbers QueueStatusRow pattern) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveScope("ALL")}
          className={`pill cursor-pointer transition-all ${activeScope === "ALL"
            ? "bg-[var(--ink)] text-[var(--paper)] font-semibold"
            : "pill-neutral hover:bg-[var(--surface)]"
            }`}
        >
          <span>All</span>
          <span className="num font-bold">{counts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("NEEDS_REVIEW")}
          className={`pill cursor-pointer transition-all ${activeScope === "NEEDS_REVIEW"
            ? "bg-[var(--review)] text-white font-semibold ring-2 ring-[var(--review)]/30"
            : "pill-review hover:opacity-90"
            }`}
        >
          <span>Needs review</span>
          <span className="num font-bold">{counts.needsReview}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("DEFECT")}
          className={`pill cursor-pointer transition-all ${activeScope === "DEFECT"
            ? "bg-[var(--defect)] text-white font-semibold ring-2 ring-[var(--defect)]/30"
            : "pill-defect hover:opacity-90"
            }`}
        >
          <span>Locked BEC Defect</span>
          <span className="num font-bold">{counts.defect}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("VERIFIED")}
          className={`pill cursor-pointer transition-all ${activeScope === "VERIFIED"
            ? "bg-[var(--ok)] text-white font-semibold ring-2 ring-[var(--ok)]/30"
            : "pill-ok hover:opacity-90"
            }`}
        >
          <span>Verified Clean</span>
          <span className="num font-bold">{counts.verified}</span>
        </button>
      </div>

      {/* Filter and Quick Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by vendor name, invoice reference, bank account, or amount..."
            className="field w-full pl-9 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="field text-xs cursor-pointer min-w-[160px]"
        >
          <option value="ALL">All Categories</option>
          <option value="BEC_WIRE_FRAUD">BEC Wire Scam</option>
          <option value="SEMAKMULE_HIT">PDRM SemakMule Hit</option>
          <option value="COERCION">Coercion / Urgency</option>
          <option value="PROMPT_INJECTION">Prompt Injection</option>
          <option value="ROUTINE_AUDIT">Routine Billing</option>
        </select>
      </div>

      {/* High-Density Data Table (Grabbers QueueTable) */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)] select-none">
                <th className="py-3 px-4 label">Ref / Case ID</th>
                <th className="py-3 px-4 label">Vendor & Sender</th>
                <th className="py-3 px-4 label">Threat Category</th>
                <th className="py-3 px-4 label">Discrepancy / Forensic Trap</th>
                <th className="py-3 px-4 label text-right">Amount (MYR)</th>
                <th className="py-3 px-4 label text-center">Status</th>
                <th className="py-3 px-4 label text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-[var(--surface)]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--ink-3)]">
                    No matching invoices found in this queue scope.
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedIndex(idx)}
                      onDoubleClick={() => router.push(`/case/${encodeURIComponent(item.id)}`)}
                      className={`group transition-colors cursor-pointer ${isSelected
                        ? "bg-amber-500/10 dark:bg-amber-500/15"
                        : "hover:bg-[var(--surface-2)]"
                        }`}
                    >
                      {/* Ref ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-[var(--ink)]">
                        <div className="flex items-center gap-2">
                          <span className="num">{item.id}</span>
                          <span className="num text-[11px] text-[var(--ink-3)] hidden sm:inline">
                            ({item.referenceId})
                          </span>
                        </div>
                      </td>

                      {/* Vendor & Sender */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--ink)] truncate max-w-[200px]">
                          {item.vendorName}
                        </div>
                        <div className="text-[11px] text-[var(--ink-3)] truncate max-w-[220px]">
                          {item.sender}
                        </div>
                      </td>

                      {/* Threat Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`pill text-[11px] py-0.5 px-2 ${item.category === "BEC_WIRE_FRAUD"
                            ? "pill-defect"
                            : item.category === "SEMAKMULE_HIT"
                              ? "pill-defect font-bold"
                              : item.category === "ROUTINE_AUDIT"
                                ? "pill-ok"
                                : "pill-review"
                            }`}
                        >
                          {item.categoryLabel}
                        </span>
                      </td>

                      {/* Discrepancy Note */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate text-[12px] text-[var(--ink-2)]" title={item.discrepancyNote}>
                          {item.discrepancyNote}
                        </div>
                        {item.claimedAccount !== item.masterAccount && (
                          <div className="text-[10px] text-[var(--defect)] font-mono mt-0.5">
                            Bank Desync: {item.claimedBank} {item.claimedAccount}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold num text-[13px] text-[var(--ink)]">
                        {formatMYR(item.amountMyr)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <ThreatSeverityBadge status={item.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/case/${encodeURIComponent(item.id)}`}
                          className="btn btn-sm hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="py-2.5 px-4 bg-[var(--surface-2)] border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--ink-3)] select-none">
          <div className="flex items-center gap-3">
            <span>Showing {filteredRows.length} of {invoices.length} invoices</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline font-mono">Shortcuts: J/K navigate · Enter inspect · / search</span>
          </div>
          <div className="font-mono">
            Direct CCID Blacklist Parity Active
          </div>
        </div>
      </div>

      {/* New Verification Modal */}
      {uploadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setUploadOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">Ingest New Verification</h3>
                  <p className="text-xs text-[var(--ink-3)]">
                    Upload inbound invoice and optional email body for 3-way forensic verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="icon-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="label block mb-1.5">Primary Invoice File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
                  className="field w-full pt-1.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                />
              </div>

              <div>
                <label className="label block mb-1.5">Supporting Remittance Email / Instructions (Optional)</label>
                <input
                  type="file"
                  accept=".txt,.eml,.pdf"
                  onChange={(e) => setSupportingFile(e.target.files?.[0] || null)}
                  className="field w-full pt-1.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                />
              </div>

              {uploadStatus && (
                <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--ink-2)] border border-[var(--line)]">
                  {uploadStatus}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !primaryFile}
                  className="btn btn-primary"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Ingesting & Cross-referencing...</span>
                    </>
                  ) : (
                    <span>Start Forensic Verification</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--ink-3)]">Loading queue...</div>}>
      <QueuePageContent />
    </Suspense>
  );
}
