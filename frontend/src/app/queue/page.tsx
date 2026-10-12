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
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] text-neutral-900 dark:text-slate-100 font-sans pb-16">
      {/* Top Application Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/queue" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#3D5A80] flex items-center justify-center text-white shadow-xs group-hover:bg-[#2E4665] transition-colors">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                  SME-ScamGuard
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Cockpit
                  </span>
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Accounts Payable Defense
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-neutral-200 dark:border-neutral-800 pl-4">
              <Link
                href="/queue"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                Queue
              </Link>
              <Link
                href="/audit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Audit Trail
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLedgerSyncOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              title="Sync AutoCount / SQL Account Master Ledger CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sync Ledger</span>
            </button>

            <button
              id="btn-new-verification"
              onClick={() => setIsNewVerificationOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3D5A80] hover:bg-[#2E4665] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New verification</span>
            </button>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">AP-CLERK-MY01</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* SECTION 6.2: Mailbox Ingestion Loading Illusion Banner */}
        {showIngestionIllusion && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white p-4 sm:p-5 rounded-2xl shadow-md animate-pulse">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold">
                    Reading the mailbox and extracting every attachment.
                  </h3>
                  <p className="text-xs text-white/80">
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
                  className="text-xs bg-white text-blue-900 font-semibold px-3 py-1.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
                >
                  Accelerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6.3: Top Volume Metric Tabs (Enterprise Aggregates) */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTab("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                selectedTab === "ALL"
                  ? "bg-[#3D5A80] text-white shadow-xs"
                  : "bg-white dark:bg-[#111827] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <span>520 All invoices</span>
            </button>

            <button
              onClick={() => setSelectedTab("NEEDS_REVIEW")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                selectedTab === "NEEDS_REVIEW"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white dark:bg-[#111827] text-amber-700 dark:text-amber-400 border border-neutral-200 dark:border-neutral-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>27 Needs review</span>
            </button>

            <button
              onClick={() => setSelectedTab("LOCKED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                selectedTab === "LOCKED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white dark:bg-[#111827] text-rose-700 dark:text-rose-400 border border-neutral-200 dark:border-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>18 Defect / Locked</span>
            </button>

            <button
              onClick={() => setSelectedTab("VERIFIED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                selectedTab === "VERIFIED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-[#111827] text-emerald-700 dark:text-emerald-400 border border-neutral-200 dark:border-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>475 Verified</span>
            </button>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 self-end sm:self-auto">
            <span>Showing</span>
            <span className="font-semibold text-neutral-900 dark:text-white font-mono">
              {filteredInvoices.length}
            </span>
            <span>of 50 active interactive records</span>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <section className="bg-white dark:bg-[#111827] p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input (Ctrl+K) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails, senders, fields... (Ctrl+K)"
              className="w-full pl-9 pr-16 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3D5A80]"
            />
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-600">
              Ctrl+K
            </kbd>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3D5A80] cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3D5A80] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="NEEDS_REVIEW">Needs review</option>
                <option value="LOCKED">Defect / Locked</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* SECTION 6.3: Queue Table */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[38%]">Invoice / Email</th>
                  <th className="py-3 px-4 w-[24%]">Sender</th>
                  <th className="py-3 px-4 w-[12%]">Category</th>
                  <th className="py-3 px-4 w-[12%]">Status</th>
                  <th className="py-3 px-4 w-[8%] text-center">Risk / Score</th>
                  <th className="py-3 px-4 w-[6%] text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {/* Skeleton Illusion Rows if loading */}
                {showIngestionIllusion ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-1.5" />
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-1" />
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded-md w-16" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded-full w-20" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded-full w-10 mx-auto" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-6 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
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
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                      >
                        {/* 1. Invoice / Email */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {inv.subject}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
                            <span>{inv.id}</span>
                            <span>•</span>
                            <span>{inv.received_date}</span>
                            {inv.files && inv.files.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-neutral-500">
                                  📎 {inv.files[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 2. Sender */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-800 dark:text-neutral-200">
                            {inv.sender_name}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                            {inv.sender_email}
                          </div>
                        </td>

                        {/* 3. Category */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {inv.category}
                          </span>
                        </td>

                        {/* 4. Status Pill */}
                        <td className="py-3.5 px-4">
                          {isVerified && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Verified
                            </span>
                          )}
                          {isReview && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Needs review
                            </span>
                          )}
                          {isDefect && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Defect / Locked
                            </span>
                          )}
                        </td>

                        {/* 5. Risk / Match Score */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                              inv.risk_score >= 80
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : inv.risk_score >= 50
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {inv.risk_score}
                          </span>
                        </td>

                        {/* 6. Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/queue/${inv.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
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
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#3D5A80] dark:hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-800/30 relative">
                  <input
                    type="file"
                    required
                    onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileUp className="w-6 h-6 text-[#3D5A80] dark:text-blue-400 mx-auto mb-1.5" />
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3D5A80] hover:bg-[#2E4665] text-white transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
            <div className="w-5 h-5 border-2 border-[#3D5A80] border-t-transparent rounded-full animate-spin" />
            <span>Loading verification queue...</span>
          </div>
        </div>
      }
    >
      <QueueContent />
    </React.Suspense>
  );
}
