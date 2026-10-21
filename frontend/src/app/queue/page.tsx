"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  X,
  UploadCloud,
  Menu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import QueueTable from "@/components/QueueTable";
import InvoiceDetailDrawer from "@/components/InvoiceDetailDrawer";
import NewVerificationModal from "@/components/NewVerificationModal";
import {
  DemoInvoice,
  fetchMailboxInvoices,
  uploadMasterLedgerCsv,
} from "@/services/api";
import { MOCK_USER } from "@/services/auth";
import staticMailbox from "@/data/demo_mailbox.json";

function QueueContent() {
  const searchParams = useSearchParams();

  // Responsive mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Ingestion illusion state
  const [showIngestionIllusion, setShowIngestionIllusion] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // Invoices & filter state
  // Prioritize defect and locked examples so they are immediately visible on screen
  const initialSortedMailbox = useMemo(() => {
    const list = [...(staticMailbox as DemoInvoice[])];
    return list.sort((a, b) => {
      const order: Record<string, number> = {
        LOCKED_CRITICAL: 1,
        DEFECT: 2,
        NEEDS_REVIEW: 3,
        VERIFIED: 4,
      };
      const orderA = order[a.status] || 99;
      const orderB = order[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (b.risk_score || 0) - (a.risk_score || 0);
    });
  }, []);

  const [invoices, setInvoices] = useState<DemoInvoice[]>(initialSortedMailbox);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "NEEDS_REVIEW" | "LOCKED" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Inspection Drawer state (0ms instant optimistic open)
  const [selectedInvoice, setSelectedInvoice] = useState<DemoInvoice | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Success toast for newly verified invoice
  const [verificationToast, setVerificationToast] = useState<{
    id: string;
    status: string;
    subject: string;
  } | null>(null);

  // Modals state
  const [isNewVerificationOpen, setIsNewVerificationOpen] = useState(false);
  const [isLedgerSyncOpen, setIsLedgerSyncOpen] = useState(false);

  // Ledger Sync form state
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [isSubmittingLedger, setIsSubmittingLedger] = useState(false);
  const [ledgerSyncNotice, setLedgerSyncNotice] = useState<string | null>(null);

  // Search input ref for Ctrl+K
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if illusion should fire
    const ingestParam = searchParams.get("ingest");
    const storedIllusion =
      typeof window !== "undefined"
        ? sessionStorage.getItem("scamguard_demo_ingestion_illusion")
        : null;
    if (ingestParam === "1" || storedIllusion === "true") {
      setShowIngestionIllusion(true);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("scamguard_demo_ingestion_illusion");
      }
    }

    // Hydrate from live backend API if available, preserving high-risk sorting
    async function loadData() {
      try {
        const live = await fetchMailboxInvoices();
        if (live && live.length > 0) {
          const sortedLive = [...live].sort((a, b) => {
            const order: Record<string, number> = {
              LOCKED_CRITICAL: 1,
              DEFECT: 2,
              NEEDS_REVIEW: 3,
              VERIFIED: 4,
            };
            const orderA = order[a.status] || 99;
            const orderB = order[b.status] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return (b.risk_score || 0) - (a.risk_score || 0);
          });
          setInvoices(sortedLive);
        }
      } catch (err) {
        console.warn("Using bundled high-risk sorted demo mailbox:", err);
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

  // Row selection handler: Optimistic Instant Drawer Open (0ms lag)
  const handleSelectInvoice = (invoice: DemoInvoice) => {
    setSelectedInvoice(invoice);
    setIsDrawerOpen(true);
  };

  // Handle successful invoice verification from modal
  const handleVerificationSuccess = (newInvoice: DemoInvoice) => {
    // Prepend to top of queue
    setInvoices((prev) => [newInvoice, ...prev]);
    setVerificationToast({
      id: newInvoice.id,
      status: newInvoice.status,
      subject: newInvoice.subject,
    });
    // Optimistically open its inspection drawer right away
    setSelectedInvoice(newInvoice);
    setIsDrawerOpen(true);

    setTimeout(() => {
      setVerificationToast(null);
    }, 6000);
  };

  // Dynamic status counts for filter pills
  const counts = useMemo(() => {
    let needsReview = 0;
    let locked = 0;
    let verified = 0;
    invoices.forEach((inv) => {
      if (inv.status === "NEEDS_REVIEW") needsReview++;
      else if (inv.status === "LOCKED_CRITICAL" || inv.status === "DEFECT") locked++;
      else if (inv.status === "VERIFIED") verified++;
    });
    return {
      total: invoices.length,
      needsReview,
      locked,
      verified,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (selectedTab === "NEEDS_REVIEW" && inv.status !== "NEEDS_REVIEW") return false;
      if (
        selectedTab === "LOCKED" &&
        inv.status !== "LOCKED_CRITICAL" &&
        inv.status !== "DEFECT"
      )
        return false;
      if (selectedTab === "VERIFIED" && inv.status !== "VERIFIED") return false;

      // Status dropdown filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "VERIFIED" && inv.status !== "VERIFIED") return false;
        if (statusFilter === "NEEDS_REVIEW" && inv.status !== "NEEDS_REVIEW") return false;
        if (
          statusFilter === "LOCKED" &&
          inv.status !== "LOCKED_CRITICAL" &&
          inv.status !== "DEFECT"
        )
          return false;
      }

      // Category filter
      if (categoryFilter !== "ALL" && inv.category !== categoryFilter) {
        return false;
      }

      // Search query (Ctrl+K)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = inv.subject.toLowerCase().includes(q);
        const matchSender =
          inv.sender_name.toLowerCase().includes(q) ||
          inv.sender_email.toLowerCase().includes(q);
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

  // Ledger Sync submission handler
  const handleUploadLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerFile) return;
    setIsSubmittingLedger(true);
    setLedgerSyncNotice(null);
    try {
      const res = await uploadMasterLedgerCsv(ledgerFile);
      setLedgerSyncNotice(
        `Synchronized ${res.vendors_loaded} vendors in volatile memory. SHA-256: ${res.ledger_sha256.slice(
          0,
          12
        )}...`
      );
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
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col md:flex-row overflow-x-hidden text-neutral-900 font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onOpenLedgerSync={() => setIsLedgerSyncOpen(true)}
        totalCount={invoices.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger menu */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 truncate">
                Accounts Payable Verification Queue
              </h1>
              <p className="text-xs text-neutral-500 hidden sm:block truncate">
                Continuous 3-way matching vs. Master Procurement Ledger
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsLedgerSyncOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
              title="Sync AutoCount / SQL Account Master Ledger CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sync Ledger</span>
            </button>

            {/* "+ New verification" Modal Trigger: Primary color #3D5A80 */}
            <button
              type="button"
              id="btn-new-verification"
              onClick={() => setIsNewVerificationOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3D5A80] hover:bg-[#2E4665] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="whitespace-nowrap">+ New verification</span>
            </button>

            <div className="h-6 w-px bg-neutral-200 mx-1 hidden sm:block" />

            {/* Static Operator User Profile Avatar / Badge (Zero Google OAuth triggers) */}
            <div className="flex items-center gap-2 pl-1">
              <div
                className="w-8 h-8 rounded-xl bg-[#3D5A80] text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0"
                title={`${MOCK_USER.name} (${MOCK_USER.email})`}
              >
                SD
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-neutral-800 leading-tight">
                  {MOCK_USER.name}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {MOCK_USER.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl w-full mx-auto">
          {/* Newly Ingested Toast Banner */}
          {verificationToast && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  <strong>Verification complete:</strong> {verificationToast.subject} (Status:{" "}
                  <span className="font-semibold">{verificationToast.status}</span>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = invoices.find((i) => i.id === verificationToast.id);
                  if (target) handleSelectInvoice(target);
                }}
                className="text-emerald-700 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
              >
                View in Drawer →
              </button>
            </div>
          )}

          {/* Mailbox Ingestion Loading Illusion Banner */}
          {showIngestionIllusion && (
            <div className="bg-gradient-to-r from-[#2E4665] via-[#3D5A80] to-[#2E4665] text-white p-4 sm:p-5 rounded-2xl shadow-md animate-pulse">
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
                    type="button"
                    onClick={() => setShowIngestionIllusion(false)}
                    className="text-xs bg-white text-[#3D5A80] font-semibold px-3 py-1.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Accelerate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Volume Metric Filter Pills Bar */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full py-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedTab("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedTab === "ALL"
                    ? "bg-[#3D5A80] text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <span>All invoices ({counts.total})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("LOCKED")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedTab === "LOCKED"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>🚨 Defect / Locked ({counts.locked})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("NEEDS_REVIEW")}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedTab === "NEEDS_REVIEW"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Needs review ({counts.needsReview})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("VERIFIED")}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedTab === "VERIFIED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-emerald-800 border border-neutral-200 hover:bg-emerald-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Verified ({counts.verified})</span>
              </button>
            </div>

            <div className="text-xs text-neutral-500 flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <span>Showing</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {filteredInvoices.length}
              </span>
              <span>of {invoices.length} active records</span>
            </div>
          </section>

          {/* Search & Filter Controls Card */}
          <section className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input (Ctrl+K) */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails, senders, fields, vendors, bank accounts... (Ctrl+K)"
                className="w-full pl-9 pr-16 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3D5A80]"
              />
              <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 bg-neutral-200 px-1.5 py-0.5 rounded border border-neutral-300">
                Ctrl+K
              </kbd>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3D5A80] cursor-pointer"
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
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3D5A80] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="LOCKED">Defect / Locked</option>
                  <option value="NEEDS_REVIEW">Needs review</option>
                  <option value="VERIFIED">Verified</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </section>

          {/* High-Performance Memoized Queue Table with 0ms Row Click */}
          <QueueTable
            invoices={filteredInvoices}
            selectedInvoiceId={selectedInvoice?.id}
            onSelectInvoice={handleSelectInvoice}
            isLoading={isLoadingData}
          />
        </main>
      </div>

      {/* Instant 0ms Slide-out Inspection Drawer */}
      <InvoiceDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoice={selectedInvoice}
        onApprove={(id) => {
          setInvoices((prev) =>
            prev.map((inv) => (inv.id === id ? { ...inv, status: "VERIFIED" } : inv))
          );
        }}
        onEscalate={(id) => {
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.id === id ? { ...inv, status: "LOCKED_CRITICAL" } : inv
            )
          );
        }}
      />

      {/* New Verification Modal */}
      <NewVerificationModal
        isOpen={isNewVerificationOpen}
        onClose={() => setIsNewVerificationOpen(false)}
        onVerificationSuccess={handleVerificationSuccess}
      />

      {/* Master Ledger CSV Upload Modal */}
      {isLedgerSyncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsLedgerSyncOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Sync Master Procurement Ledger
              </h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Upload your AutoCount or SQL Account CSV export. Parses in volatile heap RAM with zero disk writes adhering to PDPA 2010.
              </p>
            </div>

            <form onSubmit={handleUploadLedger} className="space-y-4">
              <div className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer relative bg-neutral-50/50">
                <input
                  type="file"
                  accept=".csv,.txt"
                  required
                  onChange={(e) => setLedgerFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-neutral-800">
                  {ledgerFile ? ledgerFile.name : "Select AutoCount / SQL Account CSV"}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Headers: vendor_name, ssm_no, bank_name, account_no, etc.
                </p>
              </div>

              {ledgerSyncNotice && (
                <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {ledgerSyncNotice}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsLedgerSyncOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
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
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
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
