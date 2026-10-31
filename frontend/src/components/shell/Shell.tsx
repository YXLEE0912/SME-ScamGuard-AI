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
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import UserAccountMenu from "./UserAccountMenu";

const NAV = [
  { href: "/insights", label: "Insights", title: "AP Insights & Cockpit", icon: LayoutDashboard },
  { href: "/queue", label: "Queue", title: "Verification queue", icon: Inbox },
  { href: "/audit", label: "Audit", title: "Master Ledger & Audit Trail", icon: History },
];

const RAIL = (compact: boolean) => (compact ? 68 : 224);

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

    const searchInputRef = useRef<HTMLInputElement>(null);

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
      pageTitle = "Forensic invoice inspection";
    }

    const isAuthPage = path === "/login";
    if (isAuthPage) {
      return <>{children}</>;
    }

    const compact = collapsed && !isNarrow;

    return (
      <div className="min-h-screen bg-[var(--rail)] text-[var(--ink)]">
        {/* Top signature accent hairline (Orange review / high-precision indicator) */}
        <div className="h-0.5 bg-[#e78823] w-full" aria-hidden="true" />

        {/* Floating Left Rail (Desktop) */}
        {!isNarrow && (
          <aside
            className="fixed bottom-3 left-3 top-3.5 z-30 flex flex-col rounded-[24px] border border-[var(--rail-line)] bg-[var(--rail)] text-[var(--rail-ink)] transition-all duration-200 select-none"
            style={{ width: RAIL(compact) }}
          >
            {/* Top Brand Lockup */}
            <div className={`flex h-16 shrink-0 items-center gap-2.5 ${compact ? "justify-center" : "px-4"}`}>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-emerald-600 shadow-xs hover:opacity-90 transition-opacity"
                title={compact ? "Click to expand sidebar" : "Click to collapse sidebar"}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>
              {!compact && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold tracking-tight text-[var(--rail-ink)]">
                      ScamGuard
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--rail-fill)] border border-[var(--rail-line)] text-[var(--rail-ink)]">
                      AP
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--rail-ink-2)] truncate">
                    Accounts Payable Defense
                  </div>
                </div>
              )}
            </div>

            {/* Mailbox Status Card */}
            {!compact && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--rail-fill)] p-2.5 border border-[var(--rail-line)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-[var(--rail-ink)]">
                      ap-audit@target-sme.com.my
                    </div>
                    <div className="text-[11px] text-[var(--rail-ink-2)]">
                      Direct Mailbox Feed
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncMailbox}
                    className="p-1 rounded-md text-[var(--rail-ink-2)] hover:text-[var(--rail-ink)] hover:bg-[var(--rail-hover)] transition-colors"
                    title="Sync Mailbox"
                  >
                    <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 p-2 space-y-1.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const on = isActive(path, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl transition-all ${compact ? "justify-center p-2.5" : "px-3 py-2.5"
                      } ${on
                        ? "bg-slate-900 text-white dark:bg-slate-800 font-semibold shadow-xs"
                        : "text-[var(--rail-ink-2)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-ink)]"
                      }`}
                    title={label}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!compact && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="text-[13px] truncate">{label}</span>
                          { href === "/queue" && (
                            <span className="num text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              13
                            </span>
                          )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Operator Profile */}
            <div className={`p-3 border-t border-[var(--rail-line)] flex items-center gap-2.5 ${compact ? "justify-center" : "px-4"}`}>
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                AT
              </div>
              {!compact && (
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate text-[var(--rail-ink)]">
                    Alex Tan
                  </div>
                  <div className="text-[10px] text-[var(--rail-ink-2)]">
                    AP Lead Auditor
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
                <h1 className="text-[22px] sm:text-[24px] font-semibold leading-[30px] tracking-[-0.01em] text-[var(--ink)]">
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

                {/* Header Action Slot (Page-Specific Buttons Portal Here) */}
                <div id={HEADER_ACTIONS_ID} className="flex items-center gap-2" />

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
              className="w-64 bg-[var(--rail)] text-[var(--rail-ink)] h-full p-4 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--rail-line)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Check size={18} />
                    </div>
                    <span className="font-bold text-sm">SME-ScamGuard</span>
                  </div>
                  <button type="button" onClick={() => setDrawerOpen(false)}>
                    <X size={18} />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {NAV.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-[var(--rail-hover)]"
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-[var(--rail-line)] flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                  AT
                </div>
                <div>
                  <div className="font-medium">Alex Tan</div>
                  <div className="text-[10px] text-[var(--rail-ink-2)]">AP Lead Auditor</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default Shell;