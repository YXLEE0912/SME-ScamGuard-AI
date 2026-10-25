"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ShieldAlert,
  AlertTriangle,
  Search,
  Plus,
  ChevronRight,
  Filter,
  FileText,
  Mail,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Lock,
  ArrowUpDown,
  History,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  X,
  FileUp,
  Building2,
  ChevronDown,
  BarChart3,
  Inbox,
} from "lucide-react";
import {
  DemoInvoice,
  fetchMailboxInvoices,
  uploadNewVerification,
  uploadMasterLedgerCsv,
} from "@/services/api";
import staticMailbox from "@/data/demo_mailbox.json";

function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ingestion loading illusion state
  const [showIngestionIllusion, setShowIngestionIllusion] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // Invoices & filter state
  const [invoices, setInvoices] = useState<DemoInvoice[]>(staticMailbox as DemoInvoice[]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "NEEDS_REVIEW" | "LOCKED" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isNewVerificationOpen, setIsNewVerificationOpen] = useState(false);
  const [isLedgerSyncOpen, setIsLedgerSyncOpen] = useState(false);

  // New Verification form
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  // Ledger Sync form
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [isSubmittingLedger, setIsSubmittingLedger] = useState(false);
  const [ledgerSyncNotice, setLedgerSyncNotice] = useState<string | null>(null);

  // Search input ref for Ctrl+K
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if illusion should fire
    const ingestParam = searchParams.get("ingest");
    const storedIllusion = typeof window !== "undefined" ? sessionStorage.getItem("scamguard_demo_ingestion_illusion") : null;
    if (ingestParam === "1" || storedIllusion === "true") {
      setShowIngestionIllusion(true);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("scamguard_demo_ingestion_illusion");
      }
    }

    // Hydrate from API
    async function loadData() {
      try {
        const live = await fetchMailboxInvoices();
        if (live && live.length > 0) {
          setInvoices(live);
        }
      } catch (err) {
        console.warn("Using bundled static demo mailbox:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [searchParams]);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Illusion timer: countdown from 15 to 0
  useEffect(() => {
    if (!showIngestionIllusion) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowIngestionIllusion(false);
          return 0;
        }
        return prev - 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [showIngestionIllusion]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (selectedTab === "NEEDS_REVIEW" && inv.status !== "NEEDS_REVIEW") return false;
      if (selectedTab === "LOCKED" && inv.status !== "LOCKED_CRITICAL" && inv.status !== "DEFECT") return false;
      if (selectedTab === "VERIFIED" && inv.status !== "VERIFIED") return false;

      // Status dropdown filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "VERIFIED" && inv.status !== "VERIFIED") return false;
        if (statusFilter === "NEEDS_REVIEW" && inv.status !== "NEEDS_REVIEW") return false;
        if (statusFilter === "LOCKED" && inv.status !== "LOCKED_CRITICAL" && inv.status !== "DEFECT") return false;
      }

      // Category filter
      if (categoryFilter !== "ALL" && inv.category !== categoryFilter) {
        return false;
      }

      // Search query (Ctrl+K)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = inv.subject.toLowerCase().includes(q);
        const matchSender = inv.sender_name.toLowerCase().includes(q) || inv.sender_email.toLowerCase().includes(q);
        const matchId = inv.id.toLowerCase().includes(q);
        const matchVendor = inv.comparison?.vendor_name?.draft?.toLowerCase()?.includes(q);
        const matchAccount = inv.comparison?.account_no?.draft?.toLowerCase()?.includes(q);
        if (!matchSubject && !matchSender && !matchId && !matchVendor && !matchAccount) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedTab, statusFilter, categoryFilter, searchQuery]);

  // Unique categories for dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [invoices]);

  // New Verification submission handler
  const handleRunNewVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFile) return;
    setIsSubmittingNew(true);
    setSubmissionNotice(null);
    try {
      const res = await uploadNewVerification(primaryFile, supportingFile || undefined);
      if (res.record) {
        setInvoices((prev) => [res.record, ...prev]);
        setSubmissionNotice(`Successfully ingested ${res.record.id} (${res.record.status})`);
        setTimeout(() => {
          setIsNewVerificationOpen(false);
          setIsSubmittingNew(false);
          setPrimaryFile(null);
          setSupportingFile(null);
          setSubmissionNotice(null);
          router.push(`/queue/${res.record.id}`);
        }, 800);
      }
    } catch (err: any) {
      setSubmissionNotice(`Ingestion error: ${err.message}`);
      setIsSubmittingNew(false);
    }
  };

  // Ledger Sync submission handler
  const handleUploadLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerFile) return;
    setIsSubmittingLedger(true);
    setLedgerSyncNotice(null);
    try {
      const res = await uploadMasterLedgerCsv(ledgerFile);
      setLedgerSyncNotice(`Synchronized ${res.vendors_loaded} vendors in volatile memory. SHA-256: ${res.ledger_sha256.slice(0, 12)}...`);
      setTimeout(() => {
        setIsLedgerSyncOpen(false);
        setIsSubmittingLedger(false);
        setLedgerFile(null);
        setLedgerSyncNotice(null);
      }, 1500);
    } catch (err: any) {
      setLedgerSyncNotice(`Sync rejected: ${err.message}`);
      setIsSubmittingLedger(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-slate-900/10 selection:text-slate-900 pb-16">
      {/* ==================================================================== */}
      {/* 1. TOP GLOBAL APP BAR (From image_4.png)                             */}
      {/* ==================================================================== */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Brand badge + AP Inbound Invoices dropdown */}
        <div className="flex items-center gap-3">
          <Link href="/queue" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center text-white shadow-2xs group-hover:bg-slate-800 transition-colors">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight flex items-center">
              DocuVerify<span className="text-[#1e293b] ml-0.5 font-extrabold">.AI</span>
            </span>
          </Link>

          <span className="text-slate-300 hidden sm:inline">/</span>

          {/* AP Inbound Invoices Select Dropdown */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs cursor-pointer hover:bg-slate-100 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-800">AP Inbound Invoices</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Center: Universal Search Input (From image_4.png) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
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

        {/* Right: Connection status badge, + New verification, User profile 'AT' */}
        <div className="flex items-center gap-3">
          {/* Circular Connection Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-mono shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium">Demo Mailbox: ap-audit@target-sme.com.my</span>
            <button
              type="button"
              onClick={() => {
                setIsLoadingData(true);
                fetchMailboxInvoices().then((res) => {
                  if (res) setInvoices(res);
                  setIsLoadingData(false);
                });
              }}
              title="Sync Mailbox"
              className="text-amber-800 hover:rotate-180 transition-transform duration-300 ml-0.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingData ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Sync Ledger Button */}
          <button
            onClick={() => setIsLedgerSyncOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Sync AutoCount / SQL Account Master Ledger CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sync Ledger</span>
          </button>

          {/* Deep Navy/Slate Button: + New verification */}
          <button
            id="btn-new-verification"
            onClick={() => setIsNewVerificationOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1e293b] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New verification</span>
          </button>

          {/* User Profile 'AT' Circular Badge */}
          <Link
            href="/login"
            title="Switch Authentication Mode (Operator: Alex Tan)"
            className="w-8 h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-slate-800 transition-colors shadow-2xs"
          >
            AT
          </Link>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. UNIFIED TITLE BANNER & COCKPIT HEADER (From image_4.png)          */}
      {/* ==================================================================== */}
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
          <Link
            href="/queue"
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs text-xs"
          >
            <span>Open Verification Cockpit</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
          <Link
            href="/audit"
            className="text-slate-300 hover:text-white underline text-xs font-medium"
          >
            Audit Trail
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. BODY CONTAINER: SLIM LEFT SIDEBAR + WORKSPACE (image_4.png)        */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1720px] mx-auto overflow-hidden">
        {/* Left Navigation Sidebar (From image_4.png) */}
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
                  onClick={() => {
                    setIsLoadingData(true);
                    fetchMailboxInvoices().then((res) => {
                      if (res) setInvoices(res);
                      setIsLoadingData(false);
                    });
                  }}
                  title="Re-fetch / Sync Active Mailbox"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin text-slate-900" : ""}`} />
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                ACCOUNTS PAYABLE
              </div>
              <nav className="space-y-1 text-xs">
                {/* 1. Insights */}
                <Link
                  href="/"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Insights</span>
                </Link>

                {/* 2. Queue (1 Active) with badge */}
                <Link
                  href="/queue"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4" />
                    <span>Queue</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1e293b] text-white">
                    1 Active
                  </span>
                </Link>

                {/* 3. Reconciliation */}
                <Link
                  href="/"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Reconciliation</span>
                </Link>

                {/* 4. Audit Log */}
                <Link
                  href="/audit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Audit Log</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Footer connection dots & custom 'N' avatar on bottom left */}
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
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* SECTION 6.2: Mailbox Ingestion Loading Illusion Banner */}
          {showIngestionIllusion && (
            <div className="bg-[#1e293b] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 animate-pulse">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">
                      Reading the mailbox and extracting every attachment.
                    </h3>
                    <p className="text-xs text-slate-300">
                      The first load can take up to 15 seconds. Initializing OCR parsers and threat feeds...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono text-xl font-bold bg-white/20 px-3 py-1 rounded-xl">
                    {countdown}s
                  </span>
                  <button
                    onClick={() => setShowIngestionIllusion(false)}
                    className="text-xs bg-white text-slate-900 font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Accelerate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feature Headline: Title "Verification queue" with muted sub-label (From image_4.png) */}
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
              Showing {filteredInvoices.length} emails
            </div>
          </div>

          {/* Status Filter Row: Pill-shaped toggle filters (From image_4.png) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedTab("ALL");
                setStatusFilter("ALL");
              }}
              className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${
                selectedTab === "ALL" && statusFilter === "ALL"
                  ? "bg-[#1e293b] text-white border-[#1e293b] shadow-2xs font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All emails 528
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTab("NEEDS_REVIEW");
                setStatusFilter("NEEDS_REVIEW");
              }}
              className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${
                statusFilter === "NEEDS_REVIEW"
                  ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs font-bold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              27 Needs review
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTab("LOCKED");
                setStatusFilter("LOCKED");
              }}
              className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${
                statusFilter === "LOCKED"
                  ? "bg-rose-100 text-rose-800 border-rose-300 shadow-2xs font-bold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              65 Defect
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTab("VERIFIED");
                setStatusFilter("VERIFIED");
              }}
              className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${
                statusFilter === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs font-bold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              37 Verified
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTab("ALL");
                setStatusFilter("RESOLVED");
              }}
              className={`px-3.5 py-1.5 rounded-full font-medium border transition-all cursor-pointer ${
                statusFilter === "RESOLVED"
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
                {/* Skeleton Illusion Rows if loading */}
                {showIngestionIllusion ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 rounded w-3/4 mb-1" />
                        <div className="h-3 bg-slate-50 rounded w-1/2" />
                      </td>
                      <td className="py-3.5 px-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 bg-slate-100 rounded-full w-24" /></td>
                      <td className="py-3.5 px-4 text-right pr-6"><div className="h-4 bg-slate-100 rounded w-14 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No invoices found matching current search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isDefect = inv.status === "LOCKED_CRITICAL" || inv.status === "DEFECT";
                    const isReview = inv.status === "NEEDS_REVIEW";
                    const isVerified = inv.status === "VERIFIED";

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/queue/${inv.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        {/* 1. INVOICE / EMAIL */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {isDefect && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-900 group-hover:text-slate-900 transition-colors text-xs">
                              {inv.subject}
                            </span>
                            {isDefect && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                BEC Alert
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                            <span className="font-medium text-slate-500">{inv.id}</span>
                            <span>•</span>
                            <span>{inv.received_date}</span>
                            {inv.files && inv.files.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">📎 {inv.files[0]}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 2. SENDER */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-slate-800">
                            {inv.sender_name || "Vendor Accounts"}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">
                            {inv.sender_email}
                          </div>
                        </td>

                        {/* 3. CATEGORY */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[11px] font-medium">
                            {inv.category === "BEC_WIRE_FRAUD"
                              ? "Raw Materials"
                              : inv.category === "SEMAKMULE_HIT"
                              ? "Logistics"
                              : inv.category === "PROMPT_INJECTION"
                              ? "Engineering"
                              : inv.category === "FAIL_CLOSED"
                              ? "Fail-Closed Recovery"
                              : inv.category || "Operations"}
                          </span>
                        </td>

                        {/* 4. STATUS */}
                        <td className="py-3.5 px-4">
                          {isReview && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              NEEDS_REVIEW
                            </span>
                          )}
                          {isDefect && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              LOCKED_CRITICAL
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              VERIFIED
                            </span>
                          )}
                          {!isReview && !isDefect && !isVerified && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              RESOLVED
                            </span>
                          )}
                        </td>

                        {/* 5. RISK / SCORE */}
                        <td className="py-3.5 px-4 text-right pr-6 font-mono text-xs font-bold">
                          {inv.risk_score >= 80 ? (
                            <span className="text-rose-600">
                              {inv.risk_score}%
                            </span>
                          ) : inv.risk_score > 20 ? (
                            <span className="text-amber-600">
                              {inv.risk_score}%
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              {inv.risk_score || 0}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* SECTION 6.6: "New Verification" Modal (Two-Tier Ingestion) */}
      {isNewVerificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 relative">
            <button
              onClick={() => setIsNewVerificationOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                New verification
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Upload an invoice email as JSON, EML, text, document, or image. Standard formats stay local; Gemini Flash normalizes formats the local parser cannot read.
              </p>
            </div>

            <form onSubmit={handleRunNewVerification} className="space-y-4">
              {/* Dropzone 1 */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Choose the invoice / email input
                </label>
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#1e293b] dark:hover:border-slate-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-800/30 relative">
                  <input
                    type="file"
                    required
                    onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileUp className="w-6 h-6 text-[#1e293b] dark:text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {primaryFile ? primaryFile.name : "Select or drag invoice (.eml, .txt, .json, .pdf, images)"}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Standard formats stay local with 0ms latency.
                  </p>
                </div>
              </div>

              {/* Dropzone 2 */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Optional PO / Supporting attachments
                </label>
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800/50 text-center relative cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => setSupportingFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    {supportingFile ? supportingFile.name : "Attach Purchase Order / GRN / E-mail trail (Optional)"}
                  </p>
                </div>
              </div>

              {submissionNotice && (
                <div className="p-3 text-xs rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {submissionNotice}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewVerificationOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!primaryFile || isSubmittingNew}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1e293b] hover:bg-[#0f172a] text-white transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmittingNew ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Run verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Ledger CSV Upload Modal */}
      {isLedgerSyncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 relative">
            <button
              onClick={() => setIsLedgerSyncOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Sync Master Procurement Ledger
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Upload your AutoCount or SQL Account CSV export. Parses in volatile heap RAM with zero disk writes adhering to PDPA 2010.
              </p>
            </div>

            <form onSubmit={handleUploadLedger} className="space-y-4">
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer relative bg-neutral-50/50 dark:bg-neutral-800/30">
                <input
                  type="file"
                  accept=".csv,.txt"
                  required
                  onChange={(e) => setLedgerFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {ledgerFile ? ledgerFile.name : "Select AutoCount / SQL Account CSV"}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Headers: vendor_name, ssm_no, bank_name, account_no, etc.
                </p>
              </div>

              {ledgerSyncNotice && (
                <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {ledgerSyncNotice}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsLedgerSyncOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!ledgerFile || isSubmittingLedger}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingLedger && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sync In-Memory Ledger</span>
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
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-neutral-500 font-medium">
            <div className="w-5 h-5 border-2 border-[#1e293b] border-t-transparent rounded-full animate-spin" />
            <span>Loading verification queue...</span>
          </div>
        </div>
      }
    >
      <QueueContent />
    </React.Suspense>
  );
}
