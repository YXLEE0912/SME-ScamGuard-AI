"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  RefreshCw,
  Upload,
  X,
  ChevronRight,
} from "lucide-react";
import { HeaderActions } from "@/components/shell/Shell";
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

    // Auth Session State
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
    const [invoices, setInvoices] = useState<UnifiedInvoice[]>(BENCHMARKS);
    const [activeScope, setActiveScope] = useState<"ALL" | "NEEDS_REVIEW" | "DEFECT" | "VERIFIED">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Queue State
    const [queue] = useState<VerificationRecord[]>(EVALUATION_BENCHMARKS);
    const [selectedItem, setSelectedItem] = useState<VerificationRecord>(EVALUATION_BENCHMARKS[0]);
    const [queueFilter, setQueueFilter] = useState<"ALL" | "NEEDS_REVIEW" | "DEFECT" | "VERIFIED" | "RESOLVED">("NEEDS_REVIEW");
    const [searchQuery, setSearchQuery] = useState<string>("");
    // Upload modal state
    const [uploadOpen, setUploadOpen] = useState(false);
    const [primaryFile, setPrimaryFile] = useState<File | null>(null);
    const [supportingFile, setSupportingFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    // 4-Eyes Dual Authorization State
    const [clerkSigned, setClerkSigned] = useState<boolean>(false);
    const [managerSigned, setManagerSigned] = useState<boolean>(false);
    const [voucherReleased, setVoucherReleased] = useState<boolean>(false);
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

              // Modals
              const [activeModal, setActiveModal] = useState<"dossier" | "print" | "gmail" | "escalate" | "new_verification" | null>(null);
              const [rawJsonExpanded, setRawJsonExpanded] = useState<boolean>(false);
              const [copiedCode, setCopiedCode] = useState<boolean>(false);
              const [isSyncing, setIsSyncing] = useState<boolean>(false);
              const claimedB = inv.comparison?.bank_name?.draft || "Maybank";
              const masterB = inv.comparison?.bank_name?.truth || "Maybank";
              const claimedA = inv.comparison?.account_no?.draft || "514012345678";
              const masterA = inv.comparison?.account_no?.truth || "514012345678";

              // Simplified Role-Agnostic Escalation State
              const [escalationPriority, setEscalationPriority] = useState<"Low" | "Medium" | "High">("Medium");
              const [escalationNote, setEscalationNote] = useState<string>("");
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

            const getPrimaryDiscrepancyNote = (item: VerificationRecord): string => {
              if (item.category === "BEC_WIRE_FRAUD") {
                return `Discrepancy Trap: Email body requests payment to ${item.claimedBank} ${item.claimedAccount} while attached invoice states Maybank 514011234567. Master ledger verifies Maybank.`;
              }
              if (item.category === "SEMAKMULE_HIT") {
                return `🚨 PDRM CCID SemakMule Alert: Beneficiary account ${item.claimedAccount} flagged in commercial mule blacklist. Master ledger verifies Maybank ${item.masterAccount}.`;
              }
              if (item.claimedAccount !== item.masterAccount) {
                return `Unauthorized Bank Change: Inbound invoice requests payment to ${item.claimedBank} ${item.claimedAccount} while master ledger verifies ${item.masterBank} ${item.masterAccount}.`;
              }
              if (item.isTampered) {
                return `PDF Metadata Anomaly: Document produced with ${item.producerTool}. Bank account parity verified with master ledger.`;
              }
              return `Review Request: Inbound invoice ${item.emailId} for ${item.vendorName} requires verification.`;
            };

            // Sync auth on load
            useEffect(() => {
              const timer = setTimeout(() => {
                if (typeof window !== "undefined") {
                  const urlParams = new URLSearchParams(window.location.search);
                  const modeParam = urlParams.get("mode");
                  if (modeParam === "google_connected") {
                    setIsDemoMode(false);
                    const googleUser: AuthUser = {
                      email: "finance.controller@corporate.com.my",
                      name: "Finance Controller",
                      mode: "google",
                    };
                    setCurrentUser(googleUser);
                    localStorage.setItem("scamguard_auth_mode", "google");
                  } else {
                    const session = getActiveAuthSession();
                    if (session && session.mode === "google") {
                      setIsDemoMode(false);
                      setCurrentUser(session);
                    } else {
                      setIsDemoMode(true);
                      setCurrentUser({
                        email: "ap-audit@target-sme.com.my",
                        name: "AP Lead Auditor",
                        mode: "demo",
                      });
                    }
                    // Combine benchmarks with live data, avoiding duplicates
                    const seen = new Set(BENCHMARKS.map((b) => b.id));
                    const uniqueExtra = adapted.filter((a) => !seen.has(a.id));
                    setInvoices([...BENCHMARKS, ...uniqueExtra]);
                  }
                } catch {
                  // Fallback to static benchmarks
                }
              }, 0);
              return () => clearTimeout(timer);
            }
    loadMailbox();
          }, []);

    // Keyboard Triage Shortcuts (J, K, A, X)
    useIncidentKeyboardShortcuts({
      onNext: () => {
        const currentIndex = queue.findIndex((x) => x.id === selectedItem.id);
        const nextIndex = Math.min(currentIndex + 1, queue.length - 1);
        handleSelectCase(queue[nextIndex]);
      },
      onPrev: () => {
        const currentIndex = queue.findIndex((x) => x.id === selectedItem.id);
        const prevIndex = Math.max(currentIndex - 1, 0);
        handleSelectCase(queue[prevIndex]);
      },
      onApprove: () => {
        if (activeTab === "detail") {
          setClerkSigned(true);
          setManagerSigned(true);
          setVoucherReleased(true);
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
            },
              onEscalate: () => {
                setActiveModal("escalate");
              },
  });

          const handleSelectCase = (item: VerificationRecord) => {
            setSelectedItem(item);
            setActiveTab("detail");
            setEscalationNote(getPrimaryDiscrepancyNote(item));
            setEscalationPriority(item.riskScore >= 80 ? "High" : item.riskScore > 20 ? "Medium" : "Low");
            if (item.status === "VERIFIED" || item.status === "RESOLVED") {
              setClerkSigned(true);
              setManagerSigned(true);
              setVoucherReleased(true);
            } else {
              setClerkSigned(false);
              setManagerSigned(false);
              setVoucherReleased(false);
            }
          };
          return true;
        });
  }, [invoices, activeScope, categoryFilter, searchQuery]);

  const handleSyncMailbox = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };
  // Counts
  const counts = useMemo(() => {
    return {
      all: invoices.length,
      needsReview: invoices.filter((x) => x.status === "NEEDS_REVIEW").length,
      defect: invoices.filter((x) => x.status === "DEFECT").length,
      verified: invoices.filter((x) => x.status === "VERIFIED").length,
    };
  }, [invoices]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  // Keyboard navigation: J/K to traverse, Enter to inspect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable) return;

      const handleExportCsv = () => {
        const csvContent =
          "data:text/csv;charset=utf-8," +
          "ID,Email ID,Vendor,Claimed Bank,Claimed Account,Risk Score,Status,Amount MYR\n" +
          queue
            .map(
              (q) =>
                `${q.id},${q.emailId},${q.vendorName},${q.claimedBank},${q.claimedAccount},${q.riskScore},${q.status},${q.amountMyr}`
            )
            .join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `DocuVerify-Audit-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      const handleExportJson = () => {
        const jsonRecord = {
          audit_protocol: "Malaysian Evidence Act 1950 Section 90A Compliance",
          session_timestamp: new Date().toISOString(),
          mailbox: currentUser?.email || "ap-audit@target-sme.com.my",
          records: queue,
          if(e.key === "j" || e.key === "ArrowDown") {
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
const blob = new Blob([JSON.stringify(jsonRecord, null, 2)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `DocuVerify-Audit-${new Date().toISOString().slice(0, 10)}.json`;
a.click();
URL.revokeObjectURL(url);
  };
window.addEventListener("keydown", handleKeyDown);
return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredRows, selectedIndex, router]);

// Filter queue
const filteredQueue = queue.filter((item) => {
  if (queueFilter === "NEEDS_REVIEW" && item.status !== "NEEDS_REVIEW") return false;
  if (queueFilter === "DEFECT" && item.status !== "DEFECT") return false;
  if (queueFilter === "VERIFIED" && item.status !== "VERIFIED") return false;
  if (queueFilter === "RESOLVED" && item.status !== "RESOLVED") return false;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    return (
      item.emailId.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.sender.toLowerCase().includes(q) ||
      item.claimedAccount.toLowerCase().includes(q)
    );
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
      return true;
    });
  };

return (
  <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-slate-900/10 selection:text-slate-900">
    {/* ==================================================================== */}
    {/* 1. TOP GLOBAL APP BAR (image_4.png)                                  */}
    {/* ==================================================================== */}
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Brand badge + AP Inbound Invoices dropdown */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center text-white shadow-2xs group-hover:bg-slate-800 transition-colors">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight flex items-center">
            DocuVerify<span className="text-[#1e293b] ml-0.5 font-extrabold">.AI</span>
          </span>
        </Link>
        <div className="grid gap-5">
          {/* Top Header Actions (Injected into Shell Sticky Header) */}
          <HeaderActions>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} aria-hidden="true" />
              <span>New verification</span>
            </button>
          </HeaderActions>

          <span className="text-slate-300 hidden sm:inline">/</span>

          {/* AP Inbound Invoices Select Dropdown */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs cursor-pointer hover:bg-slate-100 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-800">AP Inbound Invoices</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
          {/* Subtitle Description */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="max-w-3xl text-[14px] text-[var(--ink-2)]">
                Review inbound invoices, inspect banking discrepancies, and resolve BEC exceptions.
                Master Procurement Ledger cross-referenced in real-time with PDRM CCID SemakMule.
              </p>
            </div>
          </div>

          {/* Center: Universal Search Input (image_4.png) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails, vendors, account numbers..."
                className="w-full pl-9 pr-14 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-2xs transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 text-slate-400 rounded shadow-2xs font-medium">
                  ⌘K
                </kbd>
              </div>
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

            {/* Right: Connection status badge, + New verification, User profile 'AT' */}
            <div className="flex items-center gap-3">
              {/* Circular Connection Status Badge */}
              {isDemoMode ? (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-mono shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-medium">Demo Mailbox: ap-audit@target-sme.com.my</span>
                  <button
                    type="button"
                    onClick={handleSyncMailbox}
                    title="Sync Mailbox"
                    className="text-amber-800 hover:rotate-180 transition-transform duration-300 ml-0.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-medium">Connected: {currentUser?.email}</span>
                  <button
                    type="button"
                    onClick={handleSyncMailbox}
                    title="Sync Live Mailbox"
                    className="text-emerald-700 hover:rotate-180 transition-transform duration-300 ml-0.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
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

              <KeyboardShortcutsHelp />
              <ThemeToggle />
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

              {/* Deep Navy/Slate Button: + New verification */}
              <button
                type="button"
                id="btn-new-verification"
                onClick={() => setActiveModal("new_verification")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New verification</span>
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

            {/* User Profile 'AT' Circular Badge */}
            <Link
              href="/login"
              title="Switch Authentication Mode (Operator: Alex Tan)"
              className="w-8 h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-slate-800 transition-colors shadow-2xs"
            >
              AT
            </Link>
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
            </header>

            {/* Unified Title Banner & Cockpit Header (High-visibility dark blue horizontal ribbon) */}
            <div className="bg-[#0f172a] text-white px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs shadow-xs gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="bg-white/15 text-white font-bold text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 uppercase">
                  DOCUVERIFY ERGONOMICS
                </span>
                <span className="text-slate-200 font-medium">
                  Unified Accounts Payable Verification Cockpit: 50 Ground-Truth Malaysian Invoices &amp; 40-Vendor Master Ledger
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs text-xs"
                >
                  <span>Open Verification Cockpit</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("audit")}
                  className="text-slate-300 hover:text-white underline text-xs font-medium"
                >
                  Audit Trail
                </button>
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

            {/* ==================================================================== */}
            {/* 2. BODY CONTAINER: SLIM LEFT SIDEBAR + WORKSPACE                     */}
            {/* ==================================================================== */}
            <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1720px] mx-auto overflow-hidden">
              {/* Left Navigation Sidebar (image_4.png) */}
              <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-3.5 flex flex-col justify-between flex-shrink-0 shadow-2xs">
                <div className="space-y-4">
                  {/* Connection Card: Mailbox label 'Demo Mailbox (7 cases ready)' with amber alert icon */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span>Demo Mailbox</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            (7 cases ready)
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncMailbox}
                        title="Re-fetch / Sync Active Mailbox"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-slate-900" : ""}`} />
                      </button>
                    </div>
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

                                  <div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                                      ACCOUNTS PAYABLE
                                    </div>
                                    <nav className="space-y-1 text-xs">
                                      {/* 1. Insights */}
                                      <button
                                        type="button"
                                        id="tab-insights"
                                        onClick={() => setActiveTab("insights")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-colors ${activeTab === "insights"
                                            ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                          }`}
                                      >
                                        <BarChart3 className="w-4 h-4" />
                                        <span>Insights</span>
                                      </button>
                                      {/* Vendor & Sender */}
                                      <td className="py-3 px-4">
                                        <div className="font-semibold text-[var(--ink)] truncate max-w-[200px]">
                                          {item.vendorName}
                                        </div>
                                        <div className="text-[11px] text-[var(--ink-3)] truncate max-w-[220px]">
                                          {item.sender}
                                        </div>
                                      </td>

                                      {/* 2. Queue (1 Active) with badge */}
                                      <button
                                        type="button"
                                        id="tab-queue"
                                        onClick={() => setActiveTab("queue")}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors ${activeTab === "queue"
                                            ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                          }`}
                                      >
                                        <span className="flex items-center gap-2.5">
                                          <Inbox className="w-4 h-4" />
                                          <span>Queue</span>
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${activeTab === "queue"
                                              ? "bg-[#1e293b] text-white"
                                              : "bg-slate-100 text-slate-600 border border-slate-200"
                                            }`}
                                        >
                                          1 Active
                                        </span>
                                      </button>

                                      {/* 3. Reconciliation */}
                                      <button
                                        type="button"
                                        id="tab-detail"
                                        onClick={() => setActiveTab("detail")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-colors ${activeTab === "detail"
                                            ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                          }`}
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>Reconciliation</span>
                                      </button>

                                      {/* 4. Audit Log */}
                                      <button
                                        type="button"
                                        id="tab-audit"
                                        onClick={() => setActiveTab("audit")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-colors ${activeTab === "audit"
                                            ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                          }`}
                                      >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Audit Log</span>
                                      </button>
                                    </nav>
                                  </div>
                                </div>

          {/* Footer connection dots & custom 'N' avatar on bottom left */ }
                              <div className="pt-4 border-t border-slate-200 space-y-3">
                                <div className="space-y-1.5 text-[11px] font-medium text-slate-500">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
                                    <span>142 Approved Vendors in Master Ledger</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
                                    <span>PDRM CCID SemakMule Cache Online (2ms)</span>
                                  </div>
                                </div>

                                {/* Custom 'N' avatar on bottom left */}
                                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                                  <div className="w-8 h-8 rounded-lg bg-[#1e293b] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                    N
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate">AP Approver</div>
                                    <div className="text-[10px] text-slate-400 font-mono">Operator ID: N-904</div>
                                  </div>
                                </div>
                              </div>
        </aside>

                        {/* Workspace Container */}
                        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                          {/* ================================================================ */}
                          {/* TAB 1: INSIGHTS VIEW                                             */}
                          {/* ================================================================ */}
                          {activeTab === "insights" && (
                            <div className="space-y-6">
                              <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                  AP Reconciliation Insights
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Real-time straight-through processing rates and field defect distribution across inbound supplier claims.
                                </p>
                              </div>

                              {/* Hero Straight-Through Rate Card */}
                              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                  <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">
                                    Straight-Through Processing
                                  </div>
                                  <div className="text-5xl font-black text-[#1e293b] tracking-tight">
                                    29%
                                  </div>
                                  <p className="text-xs text-slate-600 mt-2 font-medium">
                                    37 of 129 comparisons matched their Master Ledger; 92 had a defect or mismatch.
                                  </p>
                                </div>

                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab("queue")}
                                    className="px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
                                  >
                                    Inspect Exceptions Queue →
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Grid: Field Defect Rate + Category Mix */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Field Defect Rate Horizontal Bars */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900">
                                      Field defect rate
                                    </h3>
                                    <span className="text-[11px] font-mono text-slate-400">129 Invoices</span>
                                  </div>

                                  <div className="space-y-3.5 text-xs">
                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-medium text-slate-700">
                                          Beneficiary Bank Account
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
                                            <span className="font-bold text-[#1e293b]">41%</span>
                                          </div>
                                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-[#1e293b] rounded-full" style={{ width: "41%" }} />
                                          </div>
                                      </div>
                                    </td>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-medium text-neutral-700">
                                          Bank Branch / Destination
                                        </span>
                                        <span className="font-bold text-neutral-900">23%</span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: "23%" }} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-medium text-neutral-700">
                                          Tampered PDF Metadata / iLovePDF
                                        </span>
                                        <span className="font-bold text-neutral-900">18%</span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                        <div className="h-full bg-neutral-800 rounded-full" style={{ width: "18%" }} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-medium text-neutral-700">
                                          Domain Typosquatting
                                        </span>
                                        <span className="font-bold text-neutral-900">12%</span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                        <div className="h-full bg-neutral-500 rounded-full" style={{ width: "12%" }} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-medium text-neutral-700">
                                          Contact Phone Mismatch
                                        </span>
                                        <span className="font-bold text-neutral-900">6%</span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "6%" }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Category Mix Distribution */}
                                <div className="bg-white border border-neutral-200/90 rounded-xl p-6 shadow-xs space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-neutral-900">
                                      Category mix
                                    </h3>
                                    <span className="text-[11px] font-mono text-neutral-400">Total: 528 Inbound</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                                      <div className="text-[11px] text-neutral-500 uppercase font-medium">
                                        Total Inbound Invoices
                                      </div>
                                      <div className="text-2xl font-bold text-neutral-900 mt-1">528</div>
                                      <div className="text-[11px] text-neutral-400 mt-0.5">Automated queue</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
                                      <div className="text-[11px] text-rose-700 uppercase font-medium">
                                        Locked Critical Defect
                                      </div>
                                      <div className="text-2xl font-bold text-rose-700 mt-1">65</div>
                                      <div className="text-[11px] text-rose-600 mt-0.5">Wire frozen</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                                      <div className="text-[11px] text-amber-800 uppercase font-medium">
                                        Needs Review
                                      </div>
                                      <div className="text-2xl font-bold text-amber-700 mt-1">27</div>
                                      <div className="text-[11px] text-amber-600 mt-0.5">Awaiting clerk call</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                                      <div className="text-[11px] text-emerald-800 uppercase font-medium">
                                        Verified Clean
                                      </div>
                                      <div className="text-2xl font-bold text-emerald-700 mt-1">391</div>
                                      <div className="text-[11px] text-emerald-600 mt-0.5">Ledger parity matched</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ================================================================ */}
                          {/* ================================================================ */}
                          {/* TAB 2: VERIFICATION QUEUE VIEW (image_4.png + image_5.png)        */}
                          {/* ================================================================ */}
                          {activeTab === "queue" && (
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                    Verification queue
                                  </h2>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Review classified emails, inspect document differences, and resolve exceptions.
                                  </p>
                                </div>
                                <div className="text-xs font-mono text-slate-500">
                                  Showing {filteredQueue.length} emails
                                </div>
                              </div>

                              {/* Status Filter Row: Pill-shaped toggle filters (From image_4.png) */}
                              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setQueueFilter("ALL")}
                                  className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${queueFilter === "ALL"
                                      ? "bg-[#1e293b] text-white border-[#1e293b] shadow-2xs font-semibold"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                  All emails 528
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQueueFilter("NEEDS_REVIEW")}
                                  className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${queueFilter === "NEEDS_REVIEW"
                                      ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs font-bold"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                  27 Needs review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQueueFilter("DEFECT")}
                                  className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${queueFilter === "DEFECT"
                                      ? "bg-rose-100 text-rose-800 border-rose-300 shadow-2xs font-bold"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                  65 Defect
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQueueFilter("VERIFIED")}
                                  className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${queueFilter === "VERIFIED"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs font-bold"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                  37 Verified
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQueueFilter("RESOLVED")}
                                  className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${queueFilter === "RESOLVED"
                                      ? "bg-slate-200 text-slate-900 border-slate-400 shadow-2xs font-bold"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                  8 Resolved
                                </button>
                              </div>

                              {/* High Density Data Table (image_5.png Visual Polish) */}
                              <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
                                <table className="w-full text-left text-xs min-w-[760px]">
                                  <thead className="bg-white border-b border-slate-200 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                                    <tr>
                                      <th className="py-3 px-4">INVOICE / EMAIL</th>
                                      <th className="py-3 px-4 w-52">SENDER</th>
                                      <th className="py-3 px-4 w-36">CATEGORY</th>
                                      <th className="py-3 px-4 w-36">STATUS</th>
                                      <th className="py-3 px-4 w-32 text-right pr-6">RISK / SCORE</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-sans">
                                    {filteredQueue.map((item) => {
                                      const isDefect = item.status === "DEFECT" || item.riskScore >= 80;

                                      return (
                                        <tr
                                          key={item.id}
                                          onClick={() => handleSelectCase(item)}
                                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                                        >
                                          {/* 1. INVOICE / EMAIL */}
                                          <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                              {isDefect && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                              )}
                                              <span className="font-semibold text-slate-900 group-hover:text-slate-900 transition-colors text-xs">
                                                {item.subject}
                                              </span>
                                              {isDefect && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                                  BEC Alert
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                                              <span className="font-medium text-slate-500">{item.emailId}</span>
                                              <span>•</span>
                                              <span>{item.receivedTime}</span>
                                              {item.attachedFiles && item.attachedFiles.length > 0 && (
                                                <>
                                                  <span>•</span>
                                                  <span className="text-slate-400">📎 {item.attachedFiles[0]}</span>
                                                </>
                                              )}
                                            </div>
                                          </td>

                                          {/* 2. SENDER */}
                                          <td className="py-3.5 px-4">
                                            <div className="text-xs font-medium text-slate-800">
                                              {item.vendorName || "Vendor Accounts"}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">
                                              {item.sender}
                                            </div>
                                          </td>

                                          {/* 3. CATEGORY */}
                                          <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[11px] font-medium">
                                              {item.category === "BEC_WIRE_FRAUD"
                                                ? "Raw Materials"
                                                : item.category === "SEMAKMULE_HIT"
                                                  ? "Logistics"
                                                  : item.category === "PROMPT_INJECTION"
                                                    ? "Engineering"
                                                    : item.category === "FAIL_CLOSED"
                                                      ? "Fail-Closed Recovery"
                                                      : item.categoryLabel || "Operations"}
                                            </span>
                                          </td>

                                          {/* 4. STATUS */}
                                          <td className="py-3.5 px-4">
                                            <ThreatSeverityBadge status={item.status} size="sm" />
                                          </td>

                                          {/* 5. RISK / SCORE */}
                                          <td className="py-3.5 px-4 text-right pr-6 font-mono text-xs font-bold">
                                            {item.riskScore >= 80 ? (
                                              <span className="text-rose-600">
                                                {item.riskScore}%
                                              </span>
                                            ) : item.riskScore > 20 ? (
                                              <span className="text-amber-600">
                                                {item.riskScore}%
                                              </span>
                                            ) : (
                                              <span className="text-emerald-600">
                                                {item.riskScore || 0}%
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* ================================================================ */}
                          {/* TAB 3: DETAIL RECONCILIATION WORKSPACE (Split-Pane View)          */}
                          {/* ================================================================ */}
                          {activeTab === "detail" && (
                            <div className="space-y-5">
                              {/* Top Bar: Back to Queue */}
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  id="btn-back-to-queue"
                                  onClick={() => setActiveTab("queue")}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 transition-colors"
                                >
                                  <ArrowLeft className="w-4 h-4" />
                                  <span>Queue</span>
                                </button>

                                <div className="text-xs text-slate-500 font-mono">
                                  Face Value Claimed:{" "}
                                  <strong className="text-slate-900 font-sans text-sm">
                                    MYR {selectedItem.amountMyr.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </strong>
                                </div>
                              </div>

                              {/* Case Header Card */}
                              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                  <div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                      {selectedItem.subject}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-slate-500">Inbound Sender:</span>
                                      <div className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs font-mono">
                                        {selectedItem.domainHighlight ? (
                                          <>
                                            billing@
                                            <span className="text-rose-700 font-bold underline bg-rose-50 px-1 rounded">
                                              {selectedItem.domainHighlight}
                                            </span>
                                            .com.my
                                          </>
                                        ) : (
                                          <span className="text-emerald-700">{selectedItem.sender}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Document Chips */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {selectedItem.attachedFiles.map((f) => (
                                      <span
                                        key={f}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Notice Callout Banner */}
                                {selectedItem.status !== "VERIFIED" && selectedItem.status !== "RESOLVED" && (
                                  <div className="p-3 rounded-xl border-l-4 border-l-[#1e293b] bg-slate-50 text-slate-800 text-xs flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-[#1e293b] flex-shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">
                                      <strong>Warning:</strong> Remittance bank account differs from Master Procurement Ledger.
                                      Ledger records are the immutable source of truth under Malaysian AP compliance protocols.
                                    </p>
                                  </div>
                                )}

                                {/* Live Threat Assessment Gauge */}
                                <LiveRiskGauge riskScore={selectedItem.riskScore} confidenceScore={96} />
                              </div>

                              {/* Split-Pane: Side-by-Side Table (Left) + Decide & Contain (Right) */}
                              <div className="flex flex-col lg:flex-row gap-6">
                                {/* Main Area: Side-by-Side Evidence Cards (Top Half) + Reconciliation Matrix (Bottom Half) */}
                                <div className="flex-1 space-y-5 min-w-0">
                                  {/* ========================================================== */}
                                  {/* TOP HALF: SIDE-BY-SIDE EVIDENCE CARDS (2 Columns)          */}
                                  {/* ========================================================== */}
                                  {(() => {
                                    const hasPdf = Boolean(
                                      selectedItem.attachedFiles &&
                                      selectedItem.attachedFiles.some((f) =>
                                        f.toLowerCase().endsWith(".pdf") ||
                                        f.toLowerCase().endsWith(".png") ||
                                        f.toLowerCase().endsWith(".jpg")
                                      )
                                    );
                                    const attachmentName = selectedItem.attachedFiles?.[0] || `${selectedItem.emailId}.pdf`;
                                    const isConsumerTool = Boolean(
                                      selectedItem.producerTool &&
                                      (selectedItem.producerTool.toLowerCase().includes("canva") ||
                                        selectedItem.producerTool.toLowerCase().includes("ilovepdf") ||
                                        selectedItem.producerTool.toLowerCase().includes("sejda"))
                                    );
                                    const bankMatchesLedger = selectedItem.claimedAccount === selectedItem.masterAccount;
                                    const isMuleHit = selectedItem.category === "SEMAKMULE_HIT";
                                    const isBecTrap = selectedItem.category === "BEC_WIRE_FRAUD";

                                    return (
                                      <>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                          {/* Left Card: Inbound Email Request */}
                                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
                                            <div>
                                              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                                  <Mail className="w-3.5 h-3.5 text-slate-700" />
                                                  <span>Inbound Email Request</span>
                                                </h3>
                                                {selectedItem.domainHighlight ? (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    ⚠️ Typosquatting Warning: @{selectedItem.domainHighlight}.com.my
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    ✅ SPF / DKIM Authenticated
                                                  </span>
                                                )}
                                              </div>

                                              <div className="mt-3 space-y-2 text-xs">
                                                <div>
                                                  <span className="text-slate-400 font-mono text-[11px] block">Sender Address:</span>
                                                  <span className="font-mono text-slate-800 font-medium">{selectedItem.sender}</span>
                                                </div>
                                                <div>
                                                  <span className="text-slate-400 font-mono text-[11px] block">Subject Line:</span>
                                                  <span className="font-semibold text-slate-900">{selectedItem.subject}</span>
                                                </div>
                                                <div>
                                                  <span className="text-slate-400 font-mono text-[11px] block">Raw Email Body Text:</span>
                                                  <pre className="mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                                                    {selectedItem.body}
                                                  </pre>
                                                </div>
                                              </div>
                                            </div>

                                            {hasPdf && (
                                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono">
                                                  <FileText className="w-3.5 h-3.5" />
                                                  <span>[Attachment: {attachmentName}]</span>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => alert(`Previewing original document: ${attachmentName}`)}
                                                  className="text-xs font-semibold text-slate-800 hover:text-slate-950 underline"
                                                >
                                                  Preview File →
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          {/* Right Card: Contextual Counter-Evidence */}
                                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
                                            <div>
                                              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                                  <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
                                                  <span>
                                                    {hasPdf ? "Extracted Document Evidence" : "Vendor Master Ledger Record"}
                                                  </span>
                                                </h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                  {hasPdf ? "Gemini Multimodal Native Stream" : "Source of Truth"}
                                                </span>
                                              </div>

                                              {hasPdf ? (
                                                <div className="mt-3 space-y-2.5 text-xs">
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Vendor Name</span>
                                                      <span className="font-bold text-neutral-800">{selectedItem.vendorName}</span>
                                                    </div>
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Invoice No</span>
                                                      <span className="font-mono font-bold text-neutral-800">{selectedItem.emailId}</span>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Beneficiary Bank</span>
                                                      <span className="font-bold text-neutral-800">{selectedItem.claimedBank}</span>
                                                    </div>
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Account Number</span>
                                                      <span className="font-mono font-bold text-neutral-800">{selectedItem.claimedAccount}</span>
                                                    </div>
                                                  </div>
                                                  <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Total Payable Amount</span>
                                                    <span className="text-sm font-bold text-neutral-900">
                                                      MYR {selectedItem.amountMyr.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="mt-3 space-y-2.5 text-xs">
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Registered Entity</span>
                                                      <span className="font-bold text-neutral-800">{selectedItem.vendorName}</span>
                                                    </div>
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Authorized Domains</span>
                                                      <span className="font-mono text-neutral-800">
                                                        @{selectedItem.sender.includes("@") ? selectedItem.sender.split("@")[1] : "megalogistics.com.my"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Registered Bank</span>
                                                      <span className="font-bold text-emerald-700">{selectedItem.masterBank}</span>
                                                    </div>
                                                    <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Registered Account</span>
                                                      <span className="font-mono font-bold text-emerald-700">{selectedItem.masterAccount}</span>
                                                    </div>
                                                  </div>
                                                  <div className="p-2 rounded bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                                                    <div>
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Monthly Baseline Range</span>
                                                      <span className="font-bold text-neutral-800">MYR 5,000.00 – MYR 85,000.00</span>
                                                    </div>
                                                    <div className="text-right">
                                                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Verified Switchboard</span>
                                                      <span className="font-mono font-bold text-[#1e293b]">{selectedItem.masterPhone}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Binary Forensic Flag Inspection Footer */}
                                            {hasPdf && (
                                              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                                                <span className="text-[11px] font-mono text-neutral-500">
                                                  /Producer: <strong className="text-neutral-800">{selectedItem.producerTool}</strong>
                                                </span>
                                                {isConsumerTool && !bankMatchesLedger ? (
                                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    🚨 Suspicious Metadata Tampering
                                                  </span>
                                                ) : isConsumerTool && bankMatchesLedger ? (
                                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                    ℹ️ Informal tool used by legitimate vendor (Low risk notice)
                                                  </span>
                                                ) : (
                                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    ✅ Official ERP Engine • Intact
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          {/* Discrepancy Note */}
                                          <td className="py-3 px-4 max-w-xs">
                                            <div className="truncate text-[12px] text-[var(--ink-2)]" title={item.discrepancyNote}>
                                              {item.discrepancyNote}
                                            </div>

                                            {/* ========================================================== */}
                                            {/* BOTTOM HALF: MULTI-WAY FORENSIC RECONCILIATION TABLE       */}
                                            {/* ========================================================== */}
                                            <div className="bg-white border border-neutral-200/90 rounded-xl overflow-hidden shadow-xs">
                                              <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                                  <FileCode className="w-4 h-4 text-[#1e293b]" />
                                                  <span>
                                                    {hasPdf
                                                      ? "3-Way Forensic Cross-Verification Matrix"
                                                      : "2-Way Cross-Verification Matrix (Plain Text Context)"}
                                                  </span>
                                                </h3>
                                                <span className="text-[11px] font-mono text-[#1e293b] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                                                  {hasPdf ? "Email Body vs. Attached PDF vs. Master Ledger" : "Email Body vs. Master Ledger"}
                                                </span>
                                                {item.claimedAccount !== item.masterAccount && (
                                                  <div className="text-[10px] text-[var(--defect)] font-mono mt-0.5">
                                                    Bank Desync: {item.claimedBank} {item.claimedAccount}
                                                  </div>
                                                )}
                                              </td>

                                              <div className="overflow-x-auto">
                                                {hasPdf ? (
                                                  /* 5-Column Table When PDF is Attached (3-Way Cross-Verification) */
                                                  <table className="w-full text-left text-xs min-w-[700px]">
                                                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px]">
                                                      <tr>
                                                        <th className="py-2.5 px-3 w-36">Field Name</th>
                                                        <th className="py-2.5 px-3">Source 1: Email Body Text</th>
                                                        <th className="py-2.5 px-3">Source 2: Attached Invoice (PDF)</th>
                                                        <th className="py-2.5 px-3">Source 3: Vendor Master Ledger</th>
                                                        <th className="py-2.5 px-3 w-48 text-right">Forensic Verdict</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-200/70 font-mono text-xs">
                                                      {/* Row 1: Legal Vendor Name */}
                                                      <tr className="hover:bg-neutral-50/50">
                                                        <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                                          Vendor Legal Name
                                                        </td>
                                                        <td className="py-3 px-3 text-neutral-700">{selectedItem.vendorName}</td>
                                                        <td className="py-3 px-3 text-neutral-700">{selectedItem.vendorName}</td>
                                                        <td className="py-3 px-3 text-emerald-700 font-bold">{selectedItem.vendorName}</td>
                                                        <td className="py-3 px-3 text-right">
                                                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                            <Check className="w-3 h-3" /> ✅ Verified Match
                                                          </span>
                                                        </td>
                                                      </tr>
                                                      {/* Amount */}
                                                      <td className="py-3 px-4 text-right font-mono font-bold num text-[13px] text-[var(--ink)]">
                                                        {formatMYR(item.amountMyr)}
                                                      </td>

                                                      {/* Row 2: Beneficiary Bank */}
                                                      <tr className="hover:bg-neutral-50/50">
                                                        <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                                          Beneficiary Bank
                                                        </td>
                                                        <td className="py-3 px-3">
                                                          {isBecTrap ? (
                                                            <span className="text-rose-700 font-bold">RHB Bank (Diverted)</span>
                                                          ) : (
                                                            <span className="text-neutral-700">{selectedItem.claimedBank}</span>
                                                          )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                          <span className={!bankMatchesLedger ? "text-rose-700 font-bold" : "text-neutral-700"}>
                                                            {selectedItem.claimedBank}
                                                          </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-emerald-700 font-bold">{selectedItem.masterBank}</td>
                                                        <td className="py-3 px-3 text-right">
                                                          {isBecTrap ? (
                                                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                              ❌ Email Divergence Trap
                                                            </span>
                                                          ) : !bankMatchesLedger ? (
                                                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                              ⚠️ Ledger Mismatch
                                                            </span>
                                                          ) : (
                                                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                              <Check className="w-3 h-3" /> ✅ Verified Match
                                                            </span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                      {/* Status Badge */}
                                                      <td className="py-3 px-4 text-center">
                                                        <ThreatSeverityBadge status={item.status} />
                                                      </td>

                                                      {/* Row 3: Account Number */}
                                                      <tr className="hover:bg-neutral-50/50">
                                                        <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                                          Account Number
                                                        </td>
                                                        <td className="py-3 px-3">
                                                          {isBecTrap ? (
                                                            <span className="text-rose-700 font-bold line-through">214011234567</span>
                                                          ) : (
                                                            <span className="text-neutral-700">{selectedItem.claimedAccount}</span>
                                                          )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                          <span className={!bankMatchesLedger ? "text-rose-700 font-bold" : "text-neutral-700"}>
                                                            {selectedItem.claimedAccount}
                                                          </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-emerald-700 font-bold">{selectedItem.masterAccount}</td>
                                                        <td className="py-3 px-3 text-right">
                                                          {isMuleHit ? (
                                                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-[11px] font-sans font-bold animate-pulse">
                                                              🚨 PDRM SemakMule Hit
                                                            </span>
                                                          ) : isBecTrap ? (
                                                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                              ❌ Email Divergence Trap
                                                            </span>
                                                          ) : !bankMatchesLedger ? (
                                                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                              ⚠️ Ledger Mismatch
                                                            </span>
                                                          ) : (
                                                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                              <Check className="w-3 h-3" /> ✅ Verified Match
                                                            </span>
                                                          )}
                                                        </td>
                                                      </tr>
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

                                            {/* Row 4: Payable Amount */}
                                            <tr className="hover:bg-neutral-50/50">
                                              <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                                Payable Amount
                                              </td>
                                              <td className="py-3 px-3 text-neutral-700">
                                                MYR {selectedItem.amountMyr.toLocaleString()}
                                              </td>
                                              <td className="py-3 px-3 text-neutral-700">
                                                MYR {selectedItem.amountMyr.toLocaleString()}
                                              </td>
                                              <td className="py-3 px-3 text-neutral-600 font-sans text-[11px]">
                                                Baseline Max: MYR 60,000.00
                                              </td>
                                              <td className="py-3 px-3 text-right">
                                                {selectedItem.amountMyr > 60000 ? (
                                                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                    ⚠️ Baseline Exceeded (+15 Risk)
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                    <Check className="w-3 h-3" /> ✅ Verified Match
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
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

                                        {/* Row 5: Domain & Metadata */}
                                        <tr className="hover:bg-neutral-50/50">
                                          <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                            Domain &amp; Metadata
                                          </td>
                                          <td className="py-3 px-3">
                                            {selectedItem.domainHighlight ? (
                                              <span className="text-rose-700 font-bold underline">
                                                @{selectedItem.domainHighlight}.com.my
                                              </span>
                                            ) : (
                                              <span className="text-neutral-700">
                                                @{selectedItem.sender.split("@")[1] || "megalogistics.com.my"}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3 px-3 text-neutral-700">
                                            {selectedItem.producerTool}
                                          </td>
                                          <td className="py-3 px-3 text-emerald-700">
                                            Authorized Domain Active
                                          </td>
                                          <td className="py-3 px-3 text-right">
                                            {selectedItem.domainHighlight ? (
                                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                ⚠️ Typosquatting Warning
                                              </span>
                                            ) : isConsumerTool && !bankMatchesLedger ? (
                                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                ⚠️ Splicing Detected
                                              </span>
                                            ) : isConsumerTool && bankMatchesLedger ? (
                                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                ✅ Informal Tool (Benign)
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                                <Check className="w-3 h-3" /> ✅ Verified Match
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      </tbody >
                              </table>
                                ) : (
                                /* 4-Column Table When NO PDF is Attached (Plain Text Context) */
                                <table className="w-full text-left text-xs min-w-[580px]">
                                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px]">
                                    <tr>
                                      <th className="py-2.5 px-3 w-36">Field Name</th>
                                      <th className="py-2.5 px-3">Source: Email Body</th>
                                      <th className="py-2.5 px-3">Source: Master Ledger Baseline</th>
                                      <th className="py-2.5 px-3 w-48 text-right">Forensic Verdict</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-200/70 font-mono text-xs">
                                    <tr className="hover:bg-neutral-50/50">
                                      <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                        Vendor Legal Name
                                      </td>
                                      <td className="py-3 px-3 text-neutral-700">{selectedItem.vendorName}</td>
                                      <td className="py-3 px-3 text-emerald-700 font-bold">{selectedItem.vendorName}</td>
                                      <td className="py-3 px-3 text-right">
                                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                          <Check className="w-3 h-3" /> ✅ Verified Match
                                        </span>
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-neutral-50/50">
                                      <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                        Beneficiary Bank
                                      </td>
                                      <td className="py-3 px-3">{selectedItem.claimedBank}</td>
                                      <td className="py-3 px-3 text-emerald-700 font-bold">{selectedItem.masterBank}</td>
                                      <td className="py-3 px-3 text-right">
                                        {selectedItem.claimedBank === selectedItem.masterBank ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                            <Check className="w-3 h-3" /> ✅ Verified Match
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                            ⚠️ Ledger Mismatch
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-neutral-50/50">
                                      <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                        Account Number
                                      </td>
                                      <td className="py-3 px-3">{selectedItem.claimedAccount}</td>
                                      <td className="py-3 px-3 text-emerald-700 font-bold">{selectedItem.masterAccount}</td>
                                      <td className="py-3 px-3 text-right">
                                        {isMuleHit ? (
                                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-[11px] font-sans font-bold animate-pulse">
                                            🚨 PDRM SemakMule Hit
                                          </span>
                                        ) : selectedItem.claimedAccount === selectedItem.masterAccount ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                            <Check className="w-3 h-3" /> ✅ Verified Match
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                            ⚠️ Ledger Mismatch
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-neutral-50/50">
                                      <td className="py-3 px-3 font-semibold text-neutral-800 font-sans">
                                        Payable Amount
                                      </td>
                                      <td className="py-3 px-3 text-neutral-700">MYR {selectedItem.amountMyr.toLocaleString()}</td>
                                      <td className="py-3 px-3 text-neutral-600 font-sans text-[11px]">Baseline: &lt; MYR 60k</td>
                                      <td className="py-3 px-3 text-right">
                                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                                          <Check className="w-3 h-3" /> ✅ Verified Match
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                            )}
                              </div>
                            </div>
                      </>
                        );
                  })()}

                        {/* Quarantined Text Payload */}
                        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-xs space-y-2">
                          <div className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
                            <span>Inbound Document Extract (&lt;UNTRUSTED_INBOUND_DOC&gt;)</span>
                            <span className="text-[#1e293b] text-[10px] font-mono">
                              Malaysian PDPA 2010 Sec 10 In-Memory Sanitized
                            </span>
                          </div>
                          <pre className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                            {selectedItem.body}
                          </pre>
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

                                  {/* Right Column: "DECIDE & CONTAIN" */}
                                  <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
                                    {/* Card 1: Decision Actions */}
                                    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">
                                          Decision Status
                                        </div>
                                        {voucherReleased ? (
                                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                            PAYMENT RELEASED
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold animate-pulse">
                                            🔒 PAYMENT LOCKED
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs text-neutral-600">
                                        {voucherReleased
                                          ? "4-Eyes dual verification completed. Payment voucher unlocked."
                                          : "2 fields block approval. Rectify discrepancies or escalate."}
                                      </p>

                                      <div className="space-y-2 pt-1">
                                        <button
                                          type="button"
                                          id="btn-approve-submit"
                                          disabled={!clerkSigned || !managerSigned || voucherReleased}
                                          onClick={() => setVoucherReleased(true)}
                                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors ${clerkSigned && managerSigned && !voucherReleased
                                              ? "bg-[#1e293b] hover:bg-slate-800 text-white cursor-pointer active:scale-98"
                                              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                            }`}
                                        >
                                          <Unlock className="w-3.5 h-3.5" />
                                          <span>{voucherReleased ? "Approved & Released" : "Approve & Submit"}</span>
                                        </button>

                                        <button
                                          type="button"
                                          id="btn-escalate"
                                          onClick={() => setActiveModal("escalate")}
                                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                          Escalate
                                        </button>
                                      </div>
                                    </div>

                                    {/* Card 2: 4-Eyes Dual Authorization Checklist */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                        <span>4-Eyes Dual Authorization</span>
                                        <span className="text-[10px] text-slate-500 font-mono">AMLA 2001 Sec 44</span>
                                      </div>

                                      <label className="flex items-start gap-2.5 cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={clerkSigned}
                                          onChange={(e) => {
                                            setClerkSigned(e.target.checked);
                                            if (!e.target.checked) setManagerSigned(false);
                                          }}
                                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-700 leading-snug group-hover:text-slate-900">
                                          <strong className="text-slate-900 block font-medium">Step 1 (AP Clerk):</strong>
                                          Verbal verification via official switchboard{" "}
                                          <code className="text-slate-900 font-mono text-[11px] font-bold">{selectedItem.masterPhone}</code>
                                        </span>
                                      </label>

                                      <label
                                        className={`flex items-start gap-2.5 ${clerkSigned ? "cursor-pointer group" : "cursor-not-allowed opacity-50"
                                          }`}
                                      >
                                        <input
                                          type="checkbox"
                                          disabled={!clerkSigned}
                                          checked={managerSigned}
                                          onChange={(e) => setManagerSigned(e.target.checked)}
                                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                        />
                                        <span className="text-xs text-slate-700 leading-snug">
                                          <strong className="text-slate-900 block font-medium">Step 2 (Finance Manager):</strong>
                                          Cryptographic key override
                                        </span>
                                      </label>
                                    </div>

                                    {/* Card 3: Export Artifacts */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                                      <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                                        Corporate Artifacts
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setActiveModal("dossier")}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                                      >
                                        <span className="flex items-center gap-2">
                                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                                          Export NSRC 997 Police Dossier (PDF)
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setActiveModal("print")}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                                      >
                                        <span className="flex items-center gap-2">
                                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                                          Print Verification Record
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setActiveModal("gmail")}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                                      >
                                        <span className="flex items-center gap-2">
                                          <Mail className="w-3.5 h-3.5 text-slate-600" />
                                          Insert Gmail Challenge Reply Draft
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                      </button>
                                    </div>

                                    {/* Card 4: Collapsible Raw JSON Submission */}
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={() => setRawJsonExpanded(!rawJsonExpanded)}
                                        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                      >
                                        <span className="flex items-center gap-1.5 font-mono">
                                          <FileCode className="w-3.5 h-3.5 text-slate-600" />
                                          RAW JSON SUBMISSION
                                        </span>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${rawJsonExpanded ? "rotate-180" : ""
                                            }`}
                                        />
                                      </button>

                                      {rawJsonExpanded && (
                                        <div className="p-3 border-t border-neutral-200 bg-neutral-50 font-mono text-[11px] text-neutral-600 max-h-48 overflow-y-auto">
                                          <pre className="whitespace-pre-wrap leading-tight">
                                            {JSON.stringify(
                                              {
                                                case_id: selectedItem.emailId,
                                                risk_score: selectedItem.riskScore,
                                                claimed_account: selectedItem.claimedAccount,
                                                master_account: selectedItem.masterAccount,
                                                producer_tool: selectedItem.producerTool,
                                                is_tampered: selectedItem.isTampered,
                                                clerk_signed: clerkSigned,
                                                manager_signed: managerSigned,
                                                statutory_compliance: "AMLA 2001 Sec 44 / Evidence Act 1950 Sec 90A",
                                              },
                                              null,
                                              2
                                            )}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
          )}

                              {/* ================================================================ */}
                              {/* TAB 4: AUDIT TRAIL VIEW                                          */}
                              {/* ================================================================ */}
                              {activeTab === "audit" && (
                                <div className="space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                      <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                                        Audit trail
                                      </h2>
                                      <p className="text-xs text-neutral-500 mt-0.5">
                                        Every correction, approval, and escalation from this session, in order. Held in memory, export to keep a copy.
                                        <h3 className="text-base font-bold text-[var(--ink)]">Ingest New Verification</h3>
                                        <p className="text-xs text-[var(--ink-3)]">
                                          Upload inbound invoice and optional email body for 3-way forensic verification
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={handleExportCsv}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-[#1e293b] hover:text-[#1e293b] text-neutral-700 font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Export CSV</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={handleExportJson}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-[#1e293b] hover:text-[#1e293b] text-neutral-700 font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Export JSON</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Chronological Audit Timeline */}
                                  <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4 font-mono text-xs">
                                    <div className="flex items-start gap-3 pb-3 border-b border-neutral-100">
                                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1e293b] text-[10px] font-bold">
                                        10:15:22 UTC
                                      </span>
                                      <div className="flex-1 font-sans">
                                        <p className="text-neutral-900 font-semibold">
                                          [LAYER 6] 4-Eyes Dual Authorization Override Initiated
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-0.5">
                                          Case INV-2026-8841. Clerk telephone verification logged for switchboard +60 3-7722 8888.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 pb-3 border-b border-neutral-100">
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                        09:42:18 UTC
                                      </span>
                                      <div className="flex-1 font-sans">
                                        <p className="text-neutral-900 font-semibold">
                                          [LAYER 5] Declarative Policy Arbiter: ERP Payment Locked
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-0.5">
                                          Case INV-2026-8841 scored Risk 99/100. Flags: MASTER_LEDGER_MISMATCH, SEMAKMULE_HIT, PRODUCER_TOOL_TAMPER.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 pb-3 border-b border-neutral-100">
                                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                                        09:42:15 UTC
                                      </span>
                                      <div className="flex-1 font-sans">
                                        <p className="text-neutral-900 font-semibold">
                                          [LAYER 3] PDRM CCID SemakMule Cache Positive Match
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-0.5">
                                          Inbound account 8009-4411-2299 matched blacklisted commercial mule account in memory (2ms lookup).
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 pb-3 border-b border-neutral-100">
                                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                                        09:42:12 UTC
                                      </span>
                                      <div className="flex-1 font-sans">
                                        <p className="text-neutral-900 font-semibold">
                                          [LAYER 2] ISO 32000-1 Binary Inspection: Consumer Splicing Detected
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-0.5">
                                          Invoice PDF binary contained signature of consumer tool (iLovePDF) with 48h CreationDate vs ModDate desync.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                                        09:42:10 UTC
                                      </span>
                                      <div className="flex-1 font-sans">
                                        <p className="text-neutral-900 font-semibold">
                                          [LAYER 1] Malaysian PDPA 2010 Section 10 In-Memory Privacy Scrub
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-0.5">
                                          Ephemeral heap redaction of MyKad identifiers and mobile numbers completed. Zero disk persistence.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </main>
                          </div>

      {/* ==================================================================== */}
                        {/* MODALS                                                               */}
                        {/* ==================================================================== */}

                        {/* Modal 1: NSRC 997 Police Dossier */}
                        {activeModal === "dossier" && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
                            <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                                <div className="flex items-center gap-2 text-[#1e293b]">
                                  <FileText className="w-5 h-5" />
                                  <h3 className="font-bold text-sm text-neutral-900">
                                    PDRM CCID / NSRC 997 Police Complaint Dossier
                                  </h3>
                                </div>
                                <button type="button" onClick={() => setActiveModal(null)} className="text-neutral-400 hover:text-neutral-600">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="flex-1 overflow-y-auto font-mono text-xs text-neutral-800 bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-3 leading-relaxed">
                                <div className="text-[#1e293b] font-bold border-b border-neutral-200 pb-1">
                                  ROYAL MALAYSIA POLICE (PDRM) CCID &amp; NSRC 997 INCIDENT DOSSIER
                                </div>
                                <div>
                                  <strong>Statutory Statutes:</strong> AMLA 2001 Section 44 • Penal Code Section 420 • Evidence Act 1950 Sec 90A
                                </div>
                                <div>
                                  <strong>Incident Reference ID:</strong> {selectedItem.emailId}
                                </div>
                                <div>
                                  <strong>Reporting Entity:</strong> Target SME Berhad (SSM: 201201099881)
                                </div>
                                <div>
                                  <strong>Claimed Vendor:</strong> {selectedItem.vendorName}
                                </div>
                                <div>
                                  <strong>Intercepted Wire Amount:</strong> MYR {selectedItem.amountMyr.toLocaleString()}
                                </div>
                                <div>
                                  <strong>Target Beneficiary:</strong> {selectedItem.claimedBank} / Acc: {selectedItem.claimedAccount} (PDRM SemakMule Hit)
                                </div>
                                <div>
                                  <strong>Master Ledger Parity:</strong> CRITICAL MISMATCH (Registered: {selectedItem.masterBank} / Acc: {selectedItem.masterAccount})
                                </div>
                                <div>
                                  <strong>PDF Binary Tamper:</strong> {selectedItem.producerTool}
                                </div>
                                <div>
                                  <strong>Evidence Digest SHA-256:</strong> e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                                </div>
                                <div className="text-amber-800 pt-2 border-t border-neutral-200">
                                  <strong>Statutory Relief Requested:</strong> Immediate emergency freezing order under AMLA 2001 Section 44 on beneficiary account {selectedItem.claimedAccount}.
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(`PDRM CCID DOSSIER - Case ${selectedItem.emailId} - Target Account: ${selectedItem.claimedBank} ${selectedItem.claimedAccount}`)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors"
                                  onClick={() => setUploadOpen(false)}
                                  className="icon-btn"
                                >
                                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-700" />}
                                  <span>{copiedCode ? "Copied" : "Copy Dossier Text"}</span>
                                  <X size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-xs font-bold text-white transition-colors shadow-2xs"
                                >
                                  <Printer className="w-4 h-4" />
                                  <span>Print Official PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modal 2: Print Verification Record */}
                        {activeModal === "print" && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <div className="flex items-center gap-2 text-slate-900">
                                  <Printer className="w-5 h-5 text-slate-700" />
                                  <h3 className="font-bold text-sm text-slate-900">Physical Verification Record</h3>
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
                                    <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                                      <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto text-xs bg-white text-slate-900 p-5 rounded-xl border border-slate-200 space-y-3 font-sans">
                                  <div className="border-b-2 border-slate-900 pb-2">
                                    <h4 className="font-bold text-sm uppercase">DocuVerify • Accounts Payable Audit Voucher</h4>
                                    <p className="text-[11px] text-slate-600">Physical Finance Filing &amp; Statutory Compliance Record</p>
                                    <div>
                                      <label className="label block mb-1.5">Supporting Remittance Email / Instructions (Optional)</label>
                                      <input
                                        type="file"
                                        accept=".txt,.eml,.pdf"
                                        onChange={(e) => setSupportingFile(e.target.files?.[0] || null)}
                                        className="field w-full pt-1.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                      <div><strong>Case Reference:</strong> {selectedItem.emailId}</div>
                                      <div><strong>Printed Date:</strong> {new Date().toLocaleDateString()}</div>
                                      <div><strong>Vendor:</strong> {selectedItem.vendorName}</div>
                                      <div><strong>Claimed Amount:</strong> MYR {selectedItem.amountMyr.toLocaleString()}</div>
                                      <div><strong>Audit Verdict:</strong> {selectedItem.status}</div>
                                      <div><strong>Risk Score:</strong> {selectedItem.riskScore}/100</div>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 text-[11px]">
                                      <strong>Two-Way Parity Check:</strong>
                                      <p>Ground Truth Bank: {selectedItem.masterBank} ({selectedItem.masterAccount})</p>
                                      <p>Inbound Claimed: {selectedItem.claimedBank} ({selectedItem.claimedAccount})</p>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 text-[11px]">
                                      <strong>Dual Authorization Signatures:</strong>
                                      <div className="mt-4 grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                                        <div>
                                          <p className="text-[10px] text-slate-500">AP Clerk Verbal Confirmation:</p>
                                          <div className="mt-4 border-b border-slate-400 w-32" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-slate-500">Finance Manager Key Sign-Off:</p>
                                          <div className="mt-4 border-b border-slate-400 w-32" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setActiveModal(null)}
                                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                    >
                                      Close
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => window.print()}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-xs font-bold text-white transition-colors shadow-2xs"
                                    >
                                      <Printer className="w-4 h-4" />
                                      <span>Print Document</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
      )}

                              {/* Modal 3: Gmail Challenge Reply Draft */}
                              {activeModal === "gmail" && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                                  <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                      <div className="flex items-center gap-2 text-slate-900">
                                        <Mail className="w-5 h-5 text-slate-700" />
                                        <h3 className="font-bold text-sm text-slate-900">Gmail Challenge Dispute Notice Draft</h3>
                                      </div>
                                      <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto text-xs font-mono text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                                      {`Re: ${selectedItem.subject}

Dear Accounts Department / Remittance Contact,

This email serves as formal notification that payment voucher for MYR ${selectedItem.amountMyr.toLocaleString()} has been placed under MANDATORY STATUTORY SECURITY HOLD by our Accounts Payable Integrity Department.

REASON FOR PAYMENT DISBURSEMENT HOLD:
Our automated AP defense system detected discrepancies between the beneficiary banking details indicated in your communication (${selectedItem.claimedBank} / Acc: ${selectedItem.claimedAccount}) and our Master Procurement Ledger records on file for ${selectedItem.vendorName}.

MANDATORY CORPORATE COMPLIANCE PROTOCOL:
In accordance with Malaysian anti-fraud controls (AMLA 2001 & PDPA 2010 Section 10), all banking detail modifications require:
1. Out-of-band verbal confirmation via the registered corporate switchboard (${selectedItem.masterPhone}).
2. Formal corporate letterhead signed by authorized company directors with verified SSM registration.

No funds will be released to new or modified accounts without completed 4-Eyes dual sign-off.

Accounts Payable Fraud & Integrity Operations
Reference Case ID: ${selectedItem.emailId}`}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                      <span className="text-[10px] text-slate-500">Pre-populated polite corporate dispute draft</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          copyToClipboard(
                                            `Re: ${selectedItem.subject}\n\nDear Accounts Department,\nPayment voucher for MYR ${selectedItem.amountMyr} placed on mandatory security hold pending out-of-band verification via official switchboard ${selectedItem.masterPhone}.\n\nReference: ${selectedItem.emailId}`
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-xs font-bold text-white transition-colors shadow-2xs"
                                      >
                                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>{copiedCode ? "Copied" : "Copy Reply Draft"}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Modal 4: Simplified Role-Agnostic Escalation Modal */}
                              {activeModal === "escalate" && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                                  <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        Escalate Exception for Forensic Review
                                      </h3>
                                      <button
                                        type="button"
                                        onClick={() => setActiveModal(null)}
                                        className="text-slate-400 hover:text-slate-600"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      Flags multi-way verification anomalies and routes this invoice directly to the AP exception review queue.
                                    </p>

                                    {/* Priority Selector: 3 clean toggle pills (Low, Medium, High) */}
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                                        Priority Tier
                                      </label>
                                      <div className="grid grid-cols-3 gap-2">
                                        {(["Low", "Medium", "High"] as const).map((p) => {
                                          const isSelected = escalationPriority === p;
                                          return (
                                            <button
                                              key={p}
                                              type="button"
                                              onClick={() => setEscalationPriority(p)}
                                              className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                                                  ? p === "High"
                                                    ? "bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-2xs"
                                                    : p === "Medium"
                                                      ? "bg-amber-50 border-amber-300 text-amber-800 font-bold shadow-2xs"
                                                      : "bg-slate-100 border-slate-400 text-slate-900 font-bold shadow-2xs"
                                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                              <span>
                                                {p === "High" ? "🚨" : p === "Medium" ? "⚠️" : "ℹ️"}
                                              </span>
                                              <span>{p}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Reviewer Note labeled WHAT SHOULD THE REVIEWER LOOK AT? */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-800 mb-1.5 tracking-tight uppercase">
                                        WHAT SHOULD THE REVIEWER LOOK AT?
                                      </label>
                                      <textarea
                                        rows={4}
                                        value={escalationNote}
                                        onChange={(e) => setEscalationNote(e.target.value)}
                                        placeholder="Describe key discrepancies for reviewer inspection..."
                                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
                                      />
                                      <span className="text-[10px] text-slate-400 mt-1 block">
                                        Pre-populated with primary detected discrepancy. Editable by AP reviewer.
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => setActiveModal(null)}
                                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveModal(null);
                                          alert(
                                            `Case ${selectedItem.emailId} escalated [Priority: ${escalationPriority}]. Review note dispatched to backend.`
                                          );
                                        }}
                                        className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                                      >
                                        Escalate
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Modal 5: New Verification */}
                              {activeModal === "new_verification" && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                                  <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-slate-800" />
                                        New Inbound AP Verification
                                      </h3>
                                      <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                          Upload Invoice PDF (Max 4.5MB Serverless Limit)
                                        </label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-slate-500 transition-colors cursor-pointer bg-slate-50/50">
                                          <UploadCloud className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                          <p className="text-xs text-slate-700 font-medium">
                                            Click to browse or drag and drop invoice PDF
                                          </p>
                                          <p className="text-[10px] text-slate-400 mt-1">
                                            Inspected strictly in volatile RAM with zero disk persistence under PDPA 2010.
                                          </p>
                                          {uploadStatus && (
                                            <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--ink-2)] border border-[var(--line)]">
                                              {uploadStatus}
                                            </div>
              </div>
              )}

                                        <div>
                                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Or Paste Suspicious Email / Inbound Claims
                                          </label>
                                          <textarea
                                            rows={3}
                                            placeholder="Paste email headers or remittance bank account claim..."
                                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                          />
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
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                          <button
                                            type="button"
                                            onClick={() => setActiveModal(null)}
                                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveModal(null);
                                              alert("Invoice ingested and analyzed. Results loaded into Queue.");
                                              setActiveTab("queue");
                                            }}
                                            className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                                          >
                                            Run Verification
                                          </button>
                                        </div>
                                      </form>
                                    </div>
                                  </div>
      )}
                                </div>
                              );
}

                              export default function Page() {
  return (
                              <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--ink-3)]">Loading queue...</div>}>
                                <QueuePageContent />
                              </Suspense>
                              );
}
