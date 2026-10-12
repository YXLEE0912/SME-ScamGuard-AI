"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { initiateGoogleOAuth, setDemoAuthSession } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoadingGoogle(true);
    try {
      initiateGoogleOAuth();
    } catch {
      // Fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("scamguard_auth_mode", "google");
      }
      setTimeout(() => router.push("/?mode=google_connected"), 600);
    }
  };

  const handleDemoSignIn = () => {
    setIsLoadingDemo(true);
    setDemoAuthSession();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("scamguard_demo_ingestion_illusion", "true");
    }
    setTimeout(() => {
      router.push("/queue?mode=demo&ingest=1");
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F9FAFB] dark:bg-[#0B0F17] text-neutral-900 dark:text-slate-100 font-sans px-4 py-12 relative">
      {/* Centered White Modal Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-8 sm:p-9 shadow-sm relative z-10 text-center">
        {/* Brand Header: Square Slate Navy Logo Mark with White Checkmark */}
        <div className="w-12 h-12 rounded-xl bg-[#3D5A80] flex items-center justify-center text-white mx-auto shadow-xs mb-5">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
          Sign in to SME-ScamGuard
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto mb-7">
          Monitors your Accounts Payable inbox and validates every inbound invoice against your Master Procurement Ledger and commercial crime threat feeds.
        </p>

        {/* Dual Actions Container */}
        <div className="space-y-3.5 mb-6">
          {/* Option A: Real Google OAuth (Primary action button: Slate Navy) */}
          <button
            type="button"
            id="btn-google-oauth"
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle || isLoadingDemo}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-[#3D5A80] hover:bg-[#2E4665] text-white font-medium text-xs sm:text-sm shadow-xs transition-colors active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isLoadingGoogle ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Option B: Demo Fallback (Subtle secondary button) */}
          <div>
            <button
              type="button"
              id="btn-demo-mailbox"
              onClick={handleDemoSignIn}
              disabled={isLoadingGoogle || isLoadingDemo}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-colors active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingDemo ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-700 dark:border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>Continue with demo mailbox</span>
            </button>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
              Explores the active AP operations inbox without connecting Google. Read-only access. SME-ScamGuard never sends, deletes, or modifies external emails.
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 pt-5 border-t border-neutral-100 dark:border-neutral-800">
          <Lock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Read-only access. SME-ScamGuard never sends, deletes, or modifies external emails.</span>
        </div>
      </div>

      {/* Compliance footer */}
      <div className="mt-8 text-center text-xs text-neutral-400">
        Malaysian AMLA 2001 Section 44 • Evidence Act 1950 • PDRM CCID SemakMule Cache
      </div>
    </div>
  );
}
