"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  BarChart3,
  FileText,
  FileSpreadsheet,
  History,
  Mail,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
} from "lucide-react";
import { MOCK_USER } from "@/services/auth";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenLedgerSync?: () => void;
  totalCount?: number;
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
  onOpenLedgerSync,
  totalCount = 50,
}: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <aside className="w-full md:w-64 bg-white border-r border-neutral-200 p-3.5 flex flex-col justify-between h-full shadow-xs text-neutral-900 font-sans">
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <Link href="/queue" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#3D5A80] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#2E4665] transition-colors shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs tracking-tight text-neutral-900 flex items-center gap-1.5">
                SME-ScamGuard
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#3D5A80] border border-blue-200">
                  AP
                </span>
              </span>
              <span className="text-[10px] text-neutral-500 truncate">
                Accounts Payable Defense
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 1. Mailbox Connection Card (Sidebar Top-Left) */}
        <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-[#3D5A80] shadow-2xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Demo Mailbox</span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {totalCount} records ready
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              title="Refresh Inbound Mailbox"
              className="p-1.5 rounded-md text-neutral-400 hover:text-[#3D5A80] hover:bg-white border border-transparent hover:border-neutral-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Navigation Group: Accounts Payable */}
        <div>
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 mb-2">
            Accounts Payable
          </div>
          <nav className="space-y-1 text-xs">
            {/* Queue Tab */}
            <Link
              href="/queue"
              onClick={onMobileClose}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                pathname === "/queue"
                  ? "bg-[#E8EEF5] text-[#3D5A80] font-semibold border border-[#B5C7D9]"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Queue</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  pathname === "/queue"
                    ? "bg-[#3D5A80] text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {totalCount} Active
              </span>
            </Link>

            {/* Audit Trail Tab */}
            <Link
              href="/audit"
              onClick={onMobileClose}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                pathname === "/audit"
                  ? "bg-[#E8EEF5] text-[#3D5A80] font-semibold border border-[#B5C7D9]"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log</span>
            </Link>

            {/* Sync Master Ledger CSV */}
            {onOpenLedgerSync && (
              <button
                type="button"
                onClick={() => {
                  if (onMobileClose) onMobileClose();
                  onOpenLedgerSync();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Sync Master Ledger</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  CSV
                </span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-3 border-t border-neutral-100">
        {/* System Status Indicators */}
        <div className="space-y-1.5 text-[11px] font-medium text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>142 Approved Vendors in Master Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>PDRM CCID SemakMule Cache Online (2ms)</span>
          </div>
        </div>

        {/* Static Operator User Profile Card (Zero OAuth triggers) */}
        <div className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#3D5A80] text-white font-bold text-xs flex items-center justify-center shrink-0">
              SD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-neutral-900 truncate">
                {MOCK_USER.name}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono truncate">
                {MOCK_USER.email}
              </span>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-[#3D5A80] shrink-0">
            {MOCK_USER.role}
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0 h-screen sticky top-0 z-20">
        {content}
      </div>

      {/* Mobile Sliding Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
