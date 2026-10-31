"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";
import { uploadNewVerification, fetchMailboxInvoices, DemoInvoice } from "@/services/api";

interface UnifiedInvoice {
  id: string;
  referenceId: string;
  vendorName: string;
  sender: string;
  subject: string;
  category: "BEC_WIRE_FRAUD" | "SEMAKMULE_HIT" | "LEGIT_CLAIM" | "FAIL_CLOSED" | "COERCION" | "PROMPT_INJECTION" | "ROUTINE_AUDIT" | "SPAM";
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
    id: "email_001",
    referenceId: "email_001",
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
    id: "email_002",
    referenceId: "email_002",
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
    id: "email_003",
    referenceId: "email_003",
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
    id: "email_004",
    referenceId: "email_004",
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
    id: "email_005",
    referenceId: "email_005",
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
    id: "email_006",
    referenceId: "email_006",
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
  {
    id: "email_007",
    referenceId: "email_007",
    vendorName: "Global Trade Marketing Desk",
    sender: "promotions@global-deals-direct.com",
    subject: "Unsolicited Promotion: Office Coffee Subscription Discount Voucher",
    category: "SPAM",
    categoryLabel: "Spam",
    status: "NEEDS_REVIEW",
    riskScore: 35,
    amountMyr: 350.0,
    claimedBank: "Maybank",
    claimedAccount: "512000192847",
    masterBank: "N/A",
    masterAccount: "N/A",
    discrepancyNote: "Unsolicited commercial marketing submission. Non-procurement vendor.",
    receivedTime: "Oct 27, 2026",
  },
];

function QueuePageContent() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<UnifiedInvoice[]>(BENCHMARKS);
  const [activeScope, setActiveScope] = useState<"ALL" | "NEEDS_REVIEW" | "DEFECT" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          const adapted: UnifiedInvoice[] = live.map((inv: DemoInvoice, idx: number) => {
            const isSpam = inv.category?.toLowerCase() === "spam" || inv.subject?.toLowerCase().includes("spam");
            const isDefect = !isSpam && (inv.status === "DEFECT" || inv.status === "LOCKED_CRITICAL" || inv.risk_score >= 80);
            const isReview = !isSpam && (inv.status === "NEEDS_REVIEW" || (inv.risk_score > 20 && inv.risk_score < 80));

            const rawAmt = inv.comparison?.amount?.draft || "18500";
            const parsedAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, "")) || 18500;

            const claimedB = inv.comparison?.bank_name?.draft || "Maybank";
            const masterB = inv.comparison?.bank_name?.truth || "Maybank";
            const claimedA = inv.comparison?.account_no?.draft || "514012345678";
            const masterA = inv.comparison?.account_no?.truth || "514012345678";

            const numMatch = inv.id.match(/\d+/);
            const num = numMatch ? parseInt(numMatch[0], 10) : idx + 8;
            const emailId = inv.id.startsWith("email_") ? inv.id : `email_${String(num).padStart(3, "0")}`;

            return {
              id: emailId,
              referenceId: emailId,
              vendorName: inv.sender_name || "Malaysian Vendor Sdn Bhd",
              sender: inv.sender_email,
              subject: inv.subject,
              category: isSpam ? "SPAM" : isDefect ? "BEC_WIRE_FRAUD" : isReview ? "COERCION" : "ROUTINE_AUDIT",
              categoryLabel: isSpam ? "Spam" : inv.category || (isDefect ? "BEC Wire Scam" : "Routine Billing"),
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
        const curIdx = selectedId ? filteredRows.findIndex((r) => r.id === selectedId) : -1;
        const nextIdx = Math.min(curIdx + 1, filteredRows.length - 1);
        if (filteredRows[nextIdx]) setSelectedId(filteredRows[nextIdx].id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const curIdx = selectedId ? filteredRows.findIndex((r) => r.id === selectedId) : 1;
        const prevIdx = Math.max(curIdx - 1, 0);
        if (filteredRows[prevIdx]) setSelectedId(filteredRows[prevIdx].id);
      } else if (e.key === "Enter" || e.key === "o") {
        e.preventDefault();
        if (selectedId) {
          router.push(`/case/${encodeURIComponent(selectedId)}`);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredRows, selectedId, router]);

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
    <div className="space-y-4">
      {/* Subtitle Description */}
      <div>
        <p className="max-w-3xl text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
          Review inbound invoices, inspect banking discrepancies, and resolve BEC exceptions.
          Master Procurement Ledger cross-referenced in real-time with PDRM CCID SemakMule.
        </p>
      </div>

      {/* Task 4: Summary Filter Pill Bar (Match Image 5) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveScope("ALL")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeScope === "ALL"
              ? "border-zinc-900 dark:border-white bg-white dark:bg-[#11131a] text-zinc-900 dark:text-white font-semibold shadow-xs"
              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11131a] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#161a24]"
            }`}
        >
          <span className="font-mono text-zinc-400 dark:text-zinc-500">{counts.all}</span>
          <span>All emails</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("NEEDS_REVIEW")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeScope === "NEEDS_REVIEW"
              ? "border-zinc-900 dark:border-white bg-white dark:bg-[#11131a] text-zinc-900 dark:text-white font-semibold shadow-xs"
              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11131a] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#161a24]"
            }`}
        >
          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{counts.needsReview}</span>
          <span>Needs review</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("DEFECT")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeScope === "DEFECT"
              ? "border-zinc-900 dark:border-white bg-white dark:bg-[#11131a] text-zinc-900 dark:text-white font-semibold shadow-xs"
              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11131a] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#161a24]"
            }`}
        >
          <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{counts.defect}</span>
          <span>Defect</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("VERIFIED")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${activeScope === "VERIFIED"
              ? "border-zinc-900 dark:border-white bg-white dark:bg-[#11131a] text-zinc-900 dark:text-white font-semibold shadow-xs"
              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11131a] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#161a24]"
            }`}
        >
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{counts.verified}</span>
          <span>Verified</span>
        </button>
      </div>

      {/* Task 4: Unified Search & Filter Bar (Match Image 5) */}
      <div className="bg-white dark:bg-[#11131a] border border-zinc-200/80 dark:border-white/10 rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, invoice reference, bank account, or amount..."
            className="w-full h-9 bg-transparent border-0 pl-9 pr-8 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11131a] text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="BEC_WIRE_FRAUD">BEC Wire Scam</option>
          <option value="SEMAKMULE_HIT">PDRM SemakMule Hit</option>
          <option value="COERCION">Coercion / Urgency</option>
          <option value="PROMPT_INJECTION">Prompt Injection</option>
          <option value="ROUTINE_AUDIT">Routine Billing</option>
          <option value="SPAM">Spam</option>
        </select>

        <select
          value={activeScope}
          onChange={(e) => setActiveScope(e.target.value as Scope)}
          className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#11131a] text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
          <option value="DEFECT">Defect Detected</option>
          <option value="VERIFIED">Verified Clean</option>
        </select>
      </div>

      {/* High-Density Data Table */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#11131a] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#0c0e14] select-none">
                <th className="py-3 pl-4 pr-3 w-[110px] text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase text-left">Email ID</th>
                <th className="py-3 px-3 w-[220px] text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase text-left">Sender</th>
                <th className="py-3 px-3 w-[320px] text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase text-left">Subject</th>
                <th className="py-3 px-3 w-[160px] text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase text-left">Threat Category</th>
                <th className="py-3 px-3 w-[170px] text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase text-left">Status</th>
                <th className="py-3 pl-3 pr-4 w-[130px] text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase text-left">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5 bg-white dark:bg-[#11131a]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 text-xs">
                    No matching invoices found in this queue scope.
                  </td>
                </tr>
              ) : (
                filteredRows.map((item) => {
                  const isSelected = selectedId !== null && selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      role="row"
                      onClick={() => {
                        setSelectedId(item.id);
                        router.push(`/case/${encodeURIComponent(item.id)}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(item.id);
                          router.push(`/case/${encodeURIComponent(item.id)}`);
                        }
                      }}
                      className={`group transition-colors cursor-pointer select-none focus:outline-none border-b border-zinc-100 dark:border-white/5 ${isSelected
                        ? "bg-zinc-50 dark:bg-white/5 border-l-4 border-zinc-900 dark:border-white"
                        : "bg-white dark:bg-[#11131a] border-l-4 border-transparent hover:bg-zinc-50/60 dark:hover:bg-[#161a24]"
                        }`}
                    >
                      {/* Email ID */}
                      <td className="py-3.5 pl-4 pr-3 align-middle whitespace-nowrap">
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                          {item.id}
                        </span>
                      </td>

                      {/* Sender */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[210px] leading-tight">
                          {item.vendorName}
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[210px] mt-0.5 leading-tight">
                          {item.sender}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-3 align-middle max-w-[320px]">
                        <div
                          className="text-xs font-normal text-zinc-700 dark:text-zinc-300 truncate leading-normal"
                          title={item.subject}
                        >
                          {item.subject}
                        </div>
                      </td>

                      {/* Threat Category */}
                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        {item.category === "SPAM" ? (
                          <span className="rounded-md text-[11px] py-0.5 px-2 bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 inline-flex items-center gap-1.5 font-medium">
                            <span className="text-[10px] leading-none opacity-80" aria-hidden="true">○</span>
                            <span>Spam</span>
                          </span>
                        ) : (
                          <span
                            className={`rounded-md text-[11px] py-0.5 px-2 inline-flex items-center gap-1 font-medium ${item.category === "BEC_WIRE_FRAUD"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                              : item.category === "SEMAKMULE_HIT"
                                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 font-semibold"
                                : item.category === "ROUTINE_AUDIT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                              }`}
                          >
                            {item.categoryLabel}
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 align-middle text-left whitespace-nowrap">
                        <ThreatSeverityBadge status={item.status} />
                      </td>

                      {/* Risk Score Column with Gauge Indicator */}
                      <td className="py-3.5 pl-3 pr-4 align-middle text-left whitespace-nowrap">
                        {(() => {
                          const isClean = item.status === "VERIFIED";
                          const isDefect = item.status === "DEFECT" || item.riskScore >= 80;
                          const scoreVal = isClean ? 100 : item.riskScore || (isDefect ? 95 : 70);
                          const colorClass = isClean
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : isDefect
                              ? "bg-rose-500 dark:bg-rose-400"
                              : "bg-amber-500 dark:bg-amber-400";

                          return (
                            <div className="flex items-center justify-start gap-2.5 text-left">
                              <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100 text-left min-w-[24px]">
                                {scoreVal}
                              </span>
                              <div className="w-14 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative inline-block align-middle border border-zinc-200 dark:border-zinc-700">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                                  style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                                />
                                {/* Subtle threshold marker at 80% */}
                                <span className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-zinc-400 dark:bg-zinc-500 opacity-60 pointer-events-none" />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="py-2.5 px-4 bg-zinc-50/50 dark:bg-[#0c0e14] border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 select-none">
          <div className="flex items-center gap-3">
            <span>Showing {filteredRows.length} of {invoices.length} invoices</span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
            <span className="hidden sm:inline font-mono text-[10px]">Shortcuts: J/K navigate · Enter inspect · / search</span>
          </div>
          <div className="font-mono text-[10px]">
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
