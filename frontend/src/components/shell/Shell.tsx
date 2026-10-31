"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Inbox,
  LayoutDashboard,
  History,
  Search,
  RefreshCw,
  Menu as MenuIcon,
  Check,
  X,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import UserAccountMenu from "./UserAccountMenu";
import NewVerificationModal from "./NewVerificationModal";

const NAV = [
  { href: "/insights", label: "Insights", title: "AP Insights", icon: LayoutDashboard },
  { href: "/queue", label: "Queue", title: "Verification queue", icon: Inbox },
  { href: "/audit", label: "Audit", title: "Audit trail", icon: History },
];

const RAIL = (compact: boolean) => (compact ? 68 : 240);

const isActive = (path: string, href: string) => {
  if (href === "/queue") {
    return path === "/queue" || path === "/" || path.startsWith("/case") || path.startsWith("/queue/");
  }
  return path === href || path.startsWith(`${href}/`);
};

export const HEADER_ACTIONS_ID = "shell-header-actions";

/** HeaderActions allows any page to inject action buttons into the shell top header */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(HEADER_ACTIONS_ID);
      setSlot(el);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!slot) return null;
  return createPortal(children, slot);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  const [collapsed, setCollapsed] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newVerificationOpen, setNewVerificationOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Responsive narrow check
  useEffect(() => {
    const checkNarrow = () => setIsNarrow(window.innerWidth <= 900);
    checkNarrow();
    window.addEventListener("resize", checkNarrow);
    return () => window.removeEventListener("resize", checkNarrow);
  }, []);

  // Collapse drawer on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDrawerOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [path]);

  // Global search shortcut: `/` or `Ctrl+K` / `Cmd+K`
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable;
      if (isInput) return;

      if ((e.key === "/" && !e.metaKey && !e.ctrlKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Close notifications popover on outside click or Escape
  useEffect(() => {
    if (!notificationsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Auto-collapse rail after 10s if expanded
  useEffect(() => {
    if (!collapsed) {
      const timer = setTimeout(() => setCollapsed(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  const handleSyncMailbox = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  // Determine current page title
  const currentNav = NAV.find((n) => isActive(path, n.href));
  let pageTitle = currentNav?.title || "Verification queue";
  if (path.startsWith("/case/") || path.startsWith("/queue/")) {
    pageTitle = "Invoice inspection";
  }

  const isAuthPage = path === "/login";
  if (isAuthPage) {
    return <>{children}</>;
  }

  const compact = collapsed && !isNarrow;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Top signature accent hairline (Deep Steel Blue brand indicator) */}
      <div className="h-0.5 bg-[#1f4b8e] w-full" aria-hidden="true" />

      {/* Clean Light-Canvas Left Rail (DocuVerify Inspired) */}
      {!isNarrow && (
        <aside
          className="fixed bottom-3 left-3 top-3.5 z-30 flex flex-col rounded-[24px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#11131a] text-slate-800 dark:text-slate-100 transition-all duration-200 select-none shadow-[0_1px_3px_rgba(15,18,37,0.04)]"
          style={{ width: RAIL(compact) }}
        >
          {/* Top Brand Lockup */}
          <div className={`flex h-16 shrink-0 items-center justify-between border-b border-slate-100 dark:border-white/10 ${compact ? "px-3" : "px-4"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-[#1f4b8e] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              {!compact && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[13px] font-semibold text-[#0f1225] dark:text-[#f8fafc] tracking-tight">
                      ScamGuard
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                      AP
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    Accounts Payable Defense
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
              title={compact ? "Click to expand sidebar" : "Click to collapse sidebar"}
            >
              {compact ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Mailbox Ingestion Status Widget */}
          {!compact && (
            <div className="bg-slate-50 dark:bg-[#11131a] border border-slate-200/70 dark:border-white/10 rounded-xl p-2.5 mx-3 mt-3">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate text-xs font-medium text-[#0f1225] dark:text-[#f8fafc]">
                  ap-audit@target-sme.com.my
                </span>
                <button
                  type="button"
                  onClick={handleSyncMailbox}
                  className="ml-auto p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Sync Mailbox"
                >
                  <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Direct Mailbox Feed · Synced just now</span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-2">
            {!compact && (
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider px-4 pt-4 pb-1 uppercase">
                MAIN
              </div>
            )}
            <nav className="space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const on = isActive(path, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3.5 py-2 mx-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${on
                        ? "bg-[#1f4b8e]/10 text-[#1f4b8e] dark:bg-[#1f4b8e]/20 dark:text-[#60a5fa] font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-[#0f1225] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5"
                      } ${compact ? "justify-center !mx-2 !px-2" : ""}`}
                    title={label}
                  >
                    <Icon size={16} className={`shrink-0 ${on ? "text-[#1f4b8e] dark:text-[#60a5fa]" : "text-slate-400"}`} />
                    {!compact && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="text-[13px] truncate">{label}</span>
                        {href === "/queue" && (
                          <span className="ml-auto text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            13
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Operator Profile */}
          <div className={`p-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-2.5 ${compact ? "justify-center" : "px-3.5"}`}>
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#161a24] text-[#0f1225] dark:text-[#f8fafc] font-semibold text-xs flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0">
              FI
            </div>
            {!compact && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#0f1225] dark:text-[#f8fafc] truncate leading-tight">
                  Finance Ops
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate leading-tight">
                  Operator
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area (Rounded Paper Container) */}
      <div
        style={{
          marginLeft: isNarrow ? 0 : 12 + RAIL(compact) + (compact ? 8 : 0),
        }}
        className={`${!isNarrow
          ? "mb-3 mr-3 mt-3 h-[calc(100vh-26px)] overflow-y-auto rounded-[24px] border border-[var(--rail-line)] bg-[var(--paper)] transition-all duration-200"
          : "min-h-screen bg-[var(--paper)]"
          }`}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--line)]/60 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6">
            {isNarrow && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="icon-btn -ml-2"
                aria-label="Open navigation"
              >
                <MenuIcon size={20} />
              </button>
            )}

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {pageTitle}
              </h1>
            </div>

            {/* Quick Search Input */}
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden md:block w-64 lg:w-72">
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-[var(--line-strong)] bg-[var(--search-bg)] px-3 text-[13px] text-[var(--ink-3)] hover:border-slate-400 transition-colors"
                >
                  <Search size={14} className="shrink-0" />
                  <span className="flex-1 truncate text-left">Search invoices, vendors, IBAN</span>
                  <kbd className="grid h-5 place-items-center rounded border border-[var(--line-strong)] bg-[var(--surface)] px-1.5 text-[10px] font-mono text-[var(--ink)]">
                    /
                  </kbd>
                </button>
              </div>

              {/* Controls Group: [+ New verification] -> [Bell Icon] -> [Dark Mode Toggle] -> [FI Profile Dropdown] */}
              <button
                type="button"
                onClick={() => setNewVerificationOpen(true)}
                className="btn btn-primary h-9 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Plus size={15} />
                <span>New verification</span>
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] transition-colors shadow-2xs cursor-pointer"
                  title="Notifications (3 active alerts)"
                  aria-label="View notifications"
                >
                  <Bell size={15} className="text-[var(--ink-2)]" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[var(--surface)]" />
                </button>

                {/* Notifications Popover */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--line-strong)] rounded-xl shadow-lg p-3 w-72 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                      <span className="text-[10px] font-semibold text-[var(--ink-3)] tracking-wider uppercase">
                        SECURITY ALERTS
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        3 Unread
                      </span>
                    </div>
                    <div className="py-2 space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-[var(--defect-tint)] border border-[var(--defect)]/20">
                        <div className="font-semibold text-[var(--defect)]">Bank Discrepancy Trap</div>
                        <div className="text-[11px] text-[var(--ink-2)] mt-0.5">QAT-02: Maybank vs CIMB override intercepted.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                        <div className="font-semibold text-[var(--ink)]">PDRM SemakMule Blacklist</div>
                        <div className="text-[11px] text-[var(--ink-3)] mt-0.5">Commercial mule registry synchronized.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--ok-tint)] border border-[var(--ok)]/20">
                        <div className="font-semibold text-[var(--ok)]">Master Ledger Parity</div>
                        <div className="text-[11px] text-[var(--ink-3)] mt-0.5">40 verified vendors at 99.4% parity.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <ThemeToggle />

              <UserAccountMenu />
            </div>
          </div>
        </header>

        {/* Page Children Container */}
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-4 sm:px-6">
          {children}
        </main>
      </div>

      {/* Quick Search Modal */}
      {searchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, bank account, invoice ID, or threat type..."
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)] pl-10 pr-10 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--focus)]"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[var(--line)] max-h-72 overflow-y-auto">
              <div className="py-2">
                <span className="label block px-2 mb-1.5">Quick Jumps</span>
                <Link
                  href="/insights"
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[var(--surface-2)] text-[var(--ink)]"
                >
                  <span className="font-medium">Financial Cockpit</span>
                  <span className="num text-[11px] text-[var(--ink-3)]">RM 486,200 BEC locked</span>
                </Link>
                <Link
                  href="/queue"
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[var(--surface-2)] text-[var(--ink)]"
                >
                  <span className="font-medium">Verification Queue</span>
                  <span className="num text-[11px] text-[var(--ink-3)]">50 invoices</span>
                </Link>
                <Link
                  href="/audit"
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[var(--surface-2)] text-[var(--ink)]"
                >
                  <span className="font-medium">Master Procurement Ledger</span>
                  <span className="num text-[11px] text-[var(--ink-3)]">99.4% parity</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isNarrow && drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex bg-black/50"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-64 bg-white dark:bg-[#11131a] text-slate-800 dark:text-slate-100 h-full p-4 flex flex-col justify-between border-r border-slate-200 dark:border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#1f4b8e] text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#0f1225] dark:text-[#f8fafc]">ScamGuard AP</div>
                    <div className="text-[10px] text-slate-400 font-mono">Accounts Payable Defense</div>
                  </div>
                </div>
                <button type="button" onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={16} />
                </button>
              </div>

              <div className="text-[10px] font-semibold text-slate-400 tracking-wider pt-4 pb-1 uppercase">
                MAIN
              </div>
              <nav className="space-y-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                  const on = isActive(path, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${on
                        ? "bg-[#1f4b8e]/10 text-[#1f4b8e] dark:bg-[#1f4b8e]/20 dark:text-[#60a5fa] font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-[#0f1225] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5"
                        }`}
                    >
                      <Icon size={16} className={on ? "text-[#1f4b8e] dark:text-[#60a5fa]" : "text-slate-400"} />
                      <span>{label}</span>
                      {href === "/queue" && (
                        <span className="ml-auto text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          13
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#161a24] text-[#0f1225] dark:text-[#f8fafc] flex items-center justify-center font-bold border border-slate-200 dark:border-white/10">
                FI
              </div>
              <div>
                <div className="font-semibold text-xs text-[#0f1225] dark:text-[#f8fafc]">Finance Ops</div>
                <div className="text-[10px] text-slate-400 font-mono">Operator</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Global Ingest New Verification Modal */}
      <NewVerificationModal
        isOpen={newVerificationOpen}
        onClose={() => setNewVerificationOpen(false)}
      />
    </div>
  );
}

export default Shell;