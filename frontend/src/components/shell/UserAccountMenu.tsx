"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { clearAuthSession } from "@/services/auth";

export function UserAccountMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    clearAuthSession();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Account Profile Button (Rounded Rectangle, h-9 matching search bar) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="h-9 px-3 flex items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer select-none shadow-2xs focus:outline-none focus:border-[var(--focus)]"
        title="User Account & Roles"
      >
          <span className="w-5 h-5 rounded-md bg-[var(--surface-2)] text-[var(--ink)] font-bold text-[11px] flex items-center justify-center border border-[var(--line-strong)] shrink-0">
            FI
          </span>
          <span className="text-xs font-medium text-[var(--ink)] hidden sm:inline-block">
            Finance Ops
          </span>
          <ChevronDown
            size={14}
            className={`text-[var(--ink-3)] transition-transform duration-150 shrink-0 ${isOpen ? "rotate-180" : ""
              }`}
          />
      </button>

      {/* Account Flyout / Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="User account menu"
          className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--line-strong)] rounded-xl shadow-lg p-3 min-w-[220px] z-50 text-left"
        >
          {/* Micro-label Header */}
          <div className="text-[10px] font-semibold text-[var(--ink-3)] tracking-wider uppercase mb-2">
            SIGNED IN ACCOUNT
          </div>

          {/* User Details */}
          <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center font-bold text-xs text-[var(--ink)] shrink-0">
                FI
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[var(--ink)] truncate">
                  Finance Operations
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[11px] text-[var(--ink-2)] font-mono truncate">
                    finance.ops@target-sme.com.my
                  </span>
                </div>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="border-t border-[var(--line)] my-2" />

            {/* Sign Out Option */}
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-[var(--ink)] hover:text-[var(--defect)] flex items-center gap-2 cursor-pointer transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] text-left"
            >
              <LogOut size={14} className="shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
      )}
        </div>
      );
}

      export default UserAccountMenu;
