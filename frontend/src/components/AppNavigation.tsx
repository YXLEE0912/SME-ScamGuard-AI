"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  Inbox,
  FileSpreadsheet,
  History,
  ShieldCheck,
  RefreshCw,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import { uploadNewVerification, uploadMasterLedgerCsv } from "@/services/api";

interface AppNavigationProps {
  onSyncMailbox?: () => void;
  isSyncingMailbox?: boolean;
  totalRecords?: number;
  onVerificationCreated?: () => void;
  onLedgerSynced?: () => void;
  children?: React.ReactNode;
}

export function AppNavigation({
  onSyncMailbox,
  isSyncingMailbox = false,
  totalRecords = 50,
  onVerificationCreated,
  onLedgerSynced,
  children,
}: AppNavigationProps) {
  const pathname = usePathname();

  // Modal states
  const [isNewVerificationOpen, setIsNewVerificationOpen] = useState(false);
  const [isLedgerSyncOpen, setIsLedgerSyncOpen] = useState(false);

  // New Verification form state
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Ledger Sync form state
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [isSubmittingLedger, setIsSubmittingLedger] = useState(false);
  const [ledgerNotice, setLedgerNotice] = useState<string | null>(null);

  const handleCreateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFile) return;
    setIsSubmittingNew(true);
    setVerificationNotice(null);
    try {
      await uploadNewVerification(primaryFile, supportingFile || undefined);
      setVerificationNotice("Invoice ingested into verification queue.");
      setPrimaryFile(null);
      setSupportingFile(null);
      if (onVerificationCreated) onVerificationCreated();
      setTimeout(() => {
        setIsNewVerificationOpen(false);
        setVerificationNotice(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ingestion failed";
      setVerificationNotice(`Error: ${msg}`);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleSyncLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerFile) return;
    setIsSubmittingLedger(true);
    setLedgerNotice(null);
    try {
      await uploadMasterLedgerCsv(ledgerFile);
      setLedgerNotice("Master Procurement Ledger successfully synced.");
      setLedgerFile(null);
      if (onLedgerSynced) onLedgerSynced();
      setTimeout(() => {
        setIsLedgerSyncOpen(false);
        setLedgerNotice(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setLedgerNotice(`Error: ${msg}`);
    } finally {
      setIsSubmittingLedger(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100">
      {/* 1. Fixed Left Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 flex flex-col justify-between p-4 z-20">
        <div>
          {/* Brand Identity Header */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                  SME-ScamGuard
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  AP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Accounts Payable Defense
              </p>
            </div>
          </div>

          {/* Mailbox Feed Connection Card */}
          <div className="mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Inbox size={13} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      AP Inbox Stream
                    </span>
                  </div>
                  <span className="num text-[10px] text-slate-500 dark:text-slate-400">
                    {totalRecords} records ready
                  </span>
                </div>
              </div>
              {onSyncMailbox && (
                <button
                  type="button"
                  onClick={onSyncMailbox}
                  disabled={isSyncingMailbox}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Refresh inbox"
                >
                  <RefreshCw size={12} className={isSyncingMailbox ? "animate-spin" : ""} />
                </button>
              )}
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mt-6">
            <span className="label block px-2 mb-2">Accounts Payable</span>
            <nav className="space-y-1">
              <Link
                href="/queue"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  pathname === "/queue"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox size={14} />
                  <span>Verification Queue</span>
                </div>
                <span className="num text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-white dark:bg-slate-700">
                  {totalRecords}
                </span>
              </Link>

              <Link
                href="/"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={14} />
                  <span>Financial Cockpit</span>
                </div>
              </Link>

              <Link
                href="/audit"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  pathname === "/audit"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History size={14} />
                  <span>Audit Trail Ledger</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsLedgerSyncOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Sync Master Ledger</span>
                </div>
                <span className="num text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  CSV
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Operator & Real-time Integrations */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Security Feeds Status */}
          <div className="space-y-1.5 px-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>142 Approved Vendors in Master</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>PDRM CCID SemakMule Live</span>
            </div>
          </div>

          {/* Operator Profile Card */}
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                SD
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Operator
                </p>
                <p className="num text-[10px] text-slate-400 leading-tight truncate w-24">
                  finance@sme-corp
                </p>
              </div>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              APPROVER
            </span>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Global Application Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {pathname === "/queue"
                ? "Accounts Payable Verification Queue"
                : pathname === "/audit"
                ? "Cryptographic AP Audit Trail"
                : pathname.startsWith("/queue/")
                ? "Forensic Discrepancy & Parity Dossier"
                : "Accounts Payable Financial Cockpit"}
            </h1>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              Continuous 3-way matching vs Master Procurement Ledger
            </span>
          </div>

          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setIsLedgerSyncOpen(true)}
              className="btn-action bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
            >
              <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Sync Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewVerificationOpen(true)}
              className="btn-action bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs"
            >
              <Plus size={13} />
              <span>+ New verification</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Modal: New Verification Upload */}
      {isNewVerificationOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                New Invoice Verification
              </h3>
              <button
                type="button"
                onClick={() => setIsNewVerificationOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {verificationNotice && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200">
                {verificationNotice}
              </div>
            )}

            <form onSubmit={handleCreateVerification} className="mt-4 space-y-4">
              <div>
                <label className="label block mb-1">Inbound Invoice (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200"
                />
              </div>

              <div>
                <label className="label block mb-1">Supporting Remittance Advice / Email (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.eml,.png,.jpg"
                  onChange={(e) => setSupportingFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVerificationOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!primaryFile || isSubmittingNew}
                  className="btn-action bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {isSubmittingNew ? <RefreshCw size={12} className="animate-spin" /> : <UploadCloud size={13} />}
                  <span>Verify Inbound Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Master Ledger CSV Sync */}
      {isLedgerSyncOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Sync Master Procurement Ledger
              </h3>
              <button
                type="button"
                onClick={() => setIsLedgerSyncOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {ledgerNotice && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200">
                {ledgerNotice}
              </div>
            )}

            <form onSubmit={handleSyncLedger} className="mt-4 space-y-4">
              <div>
                <label className="label block mb-1">Master Ledger CSV File</label>
                <input
                  type="file"
                  required
                  accept=".csv"
                  onChange={(e) => setLedgerFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Must include vendor_id, vendor_name, bank_name, account_number, phone.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLedgerSyncOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!ledgerFile || isSubmittingLedger}
                  className="btn-action bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmittingLedger ? <RefreshCw size={12} className="animate-spin" /> : <UploadCloud size={13} />}
                  <span>Upload & Synchronize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AppNavigation;
