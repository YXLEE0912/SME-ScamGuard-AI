"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { formatMYR } from "@/lib/diff";

export interface MultiAgentPipelineProps {
  invoice: {
    id: string;
    referenceId: string;
    vendorName: string;
    sender: string;
    subject: string;
    amountMyr: number;
    receivedDate: string;
    emailBody: string;
    producerTool: string;
    riskScore: number;
    certaintyConfidence: number;
    threatCategory: string;
    status: "VERIFIED" | "NEEDS_REVIEW" | "DEFECT" | "RESOLVED";
    reasoning: string;
    files: string[];
    comparison: Record<string, { truth?: string; draft?: string; status?: string; score?: number }>;
  };
  clerkSigned: boolean;
  managerSigned: boolean;
  voucherReleased: boolean;
  onClerkSign?: () => void;
  onManagerSign?: () => void;
}

interface OverrideTarget {
  agentNumber: number;
  fieldName: string;
  currentValue: string;
  expectedValue: string;
}

export function MultiAgentPipeline({
  invoice,
  clerkSigned,
  managerSigned,
  voucherReleased,
}: MultiAgentPipelineProps) {
  const isDefect = invoice.status === "DEFECT";
  const isReview = invoice.status === "NEEDS_REVIEW";
  const comp = invoice.comparison || {};

  // Track user manual expansion overrides per invoice
  const [userToggledAgents, setUserToggledAgents] = useState<{ id: string; state: Record<number, boolean> }>({
    id: invoice.id,
    state: {},
  });

  // If invoice changes, user toggles reset automatically
  const activeToggles = userToggledAgents.id === invoice.id ? userToggledAgents.state : {};

  const isAgentExpanded = (num: number) => {
    if (activeToggles[num] !== undefined) {
      return activeToggles[num];
    }
    // Default open flagged agents if defect or needs review
    if (isDefect) {
      return true;
    }
    if (isReview) {
      return num === 3 || num === 4 || num === 5;
    }
    return num === 3;
  };

  const toggleAgent = (num: number) => {
    setUserToggledAgents((prev) => ({
      id: invoice.id,
      state: {
        ...(prev.id === invoice.id ? prev.state : {}),
        [num]: !isAgentExpanded(num),
      },
    }));
  };

  // Track local manual overrides applied by operator
  const [overrides, setOverrides] = useState<Record<string, { value: string; reason: string }>>({});
  const [overrideModal, setOverrideModal] = useState<OverrideTarget | null>(null);
  const [overrideInput, setOverrideInput] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleOpenOverride = (target: OverrideTarget) => {
    setOverrideModal(target);
    setOverrideInput(target.expectedValue || target.currentValue);
    setOverrideReason("Verified through formal procurement documentation / manual ledger reconciliation.");
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;

    setOverrides((prev) => ({
      ...prev,
      [overrideModal.fieldName]: {
        value: overrideInput,
        reason: overrideReason,
      },
    }));

    setSuccessToast(`Manual override saved for ${overrideModal.fieldName}. Status updated.`);
    setOverrideModal(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Helper function to colorize scores
  const getScoreTextColor = (score: number, isDefectState: boolean) => {
    if (score < 50 || isDefectState) {
      return "text-rose-600 dark:text-rose-400";
    }
    if (score < 85) {
      return "text-amber-600 dark:text-amber-400";
    }
    return "text-emerald-600 dark:text-emerald-400";
  };

  // Helper to render Stepper Circle Badge (01–07)
  const renderStepCircle = (stepNum: string, status: "VERIFIED" | "DEFECT" | "NEEDS_REVIEW" | "BYPASS") => {
    if (status === "DEFECT") {
      return (
        <div
          className="w-7 h-7 rounded-full bg-rose-500 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] select-none"
          title={`Agent ${stepNum}: Defect Detected`}
        >
          <span className="text-[12px] leading-none font-bold">▲</span>
        </div>
      );
    }
    if (status === "NEEDS_REVIEW") {
      return (
        <div
          className="w-7 h-7 rounded-full bg-amber-500 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] select-none"
          title={`Agent ${stepNum}: Needs Review`}
        >
          <span className="text-[12px] leading-none font-bold">▲</span>
        </div>
      );
    }
    // VERIFIED or BYPASS
    return (
      <div
        className="w-7 h-7 rounded-full bg-emerald-500 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] select-none"
        title={`Agent ${stepNum}: Verified`}
      >
        <Check size={14} className="stroke-[2.5]" />
      </div>
    );
  };

  // 3-Way Reconciliation rows for Agent 3
  const reconciliationFields = [
    {
      key: "vendor_name",
      label: "Vendor Name",
      truth: comp.vendor_name?.truth || invoice.vendorName,
      draft: comp.vendor_name?.draft || invoice.vendorName,
      rawStatus: comp.vendor_name?.status || "match",
      defaultScore: 100,
    },
    {
      key: "bank_name",
      label: "Beneficiary Bank",
      truth: comp.bank_name?.truth || "Maybank",
      draft: comp.bank_name?.draft || (isDefect ? "CIMB Bank" : "Maybank"),
      rawStatus: comp.bank_name?.status || (isDefect ? "defect" : "match"),
      defaultScore: isDefect ? 70 : 100,
    },
    {
      key: "account_no",
      label: "Account Number",
      truth: comp.account_no?.truth || "514012998877",
      draft: comp.account_no?.draft || (isDefect ? "8009-4411-2299" : "514012998877"),
      rawStatus: comp.account_no?.status || (isDefect ? "defect" : "match"),
      defaultScore: isDefect ? 70 : 100,
    },
    {
      key: "landline",
      label: "Landline Telephone",
      truth: comp.landline?.truth || "+60 3-7722 8888",
      draft: comp.landline?.draft || (isDefect ? "+60 11-2345 6789" : "+60 3-7722 8888"),
      rawStatus: comp.landline?.status || (isDefect ? "defect" : "match"),
      defaultScore: isDefect ? 70 : 100,
    },
    {
      key: "amount",
      label: "Total Amount (MYR)",
      truth: comp.amount?.truth || "Baseline Verified",
      draft: comp.amount?.draft || formatMYR(invoice.amountMyr),
      rawStatus: comp.amount?.status || "match",
      defaultScore: 100,
    },
    {
      key: "po_number",
      label: "Purchase Order (PO)",
      truth: comp.po_number?.truth || "PO-2026-8812",
      draft: comp.po_number?.draft || (isDefect ? "PO-OVERRIDE" : "PO-2026-8812"),
      rawStatus: comp.po_number?.status || (isDefect ? "defect" : "match"),
      defaultScore: isDefect ? 70 : 100,
    },
  ];

  // Derive agent specific statuses and scores
  const agent2Status: "DEFECT" | "NEEDS_REVIEW" | "VERIFIED" = isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED";
  const agent2Score = isDefect ? 45 : isReview ? 78 : 98;

  const hasReconciliationDefect = (isDefect || reconciliationFields.some((f) => f.rawStatus === "defect")) && !overrides["bank_name"];
  const agent3Status: "DEFECT" | "NEEDS_REVIEW" | "VERIFIED" = hasReconciliationDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED";
  const agent3Score = hasReconciliationDefect ? 48 : isReview ? 75 : 100;

  const agent4Status: "DEFECT" | "NEEDS_REVIEW" | "VERIFIED" = isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED";
  const agent4Score = isDefect ? 35 : isReview ? 68 : 95;

  const agent5Status: "DEFECT" | "NEEDS_REVIEW" | "VERIFIED" = isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED";
  const agent5Score = isDefect ? 50 : isReview ? 60 : 100;

  const agent6Status: "DEFECT" | "NEEDS_REVIEW" | "VERIFIED" = isDefect && !voucherReleased ? "DEFECT" : isReview && !voucherReleased ? "NEEDS_REVIEW" : "VERIFIED";
  const agent6Score = isDefect && !voucherReleased ? 40 : isReview && !voucherReleased ? 65 : 100;

  const agent7Status: "DEFECT" | "NEEDS_REVIEW" | "VERIFIED" = isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED";
  const agent7Score = isDefect ? 20 : isReview ? 70 : 100;

  // Helper renderer for Status Verification Block inside Drawers
  const renderStatusBlock = ({
    status,
    score,
    helperText,
    onCorrect,
  }: {
    status: "VERIFIED" | "DEFECT" | "NEEDS_REVIEW";
    score: number;
    helperText: string;
    onCorrect?: () => void;
  }) => {
    const isDefectState = status === "DEFECT";
    const isAmber = status === "NEEDS_REVIEW" || (!isDefectState && score < 85);

    let fillBg = "bg-emerald-500";
    let scoreColor = "text-emerald-600 dark:text-emerald-400";
    if (score < 50 || isDefectState) {
      fillBg = "bg-rose-500";
      scoreColor = "text-rose-600 dark:text-rose-400";
    } else if (score < 85 || isAmber) {
      fillBg = "bg-amber-500";
      scoreColor = "text-amber-600 dark:text-amber-400";
    }

    return (
      <div
        className={`p-3.5 rounded-lg border ${isDefectState
          ? "border-rose-200 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/20"
          : isAmber
            ? "border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20"
            : "border-[var(--line)] bg-[var(--surface)]"
          } space-y-2 select-none`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 1. Status Pill */}
          {isDefectState ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
              <span className="text-[10px] leading-none font-bold">▲</span>
              <span>Defect Detected</span>
            </span>
          ) : isAmber ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
              <span className="text-[10px] leading-none font-bold">●</span>
              <span>Needs Review</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle2 size={12} />
              <span>Verified</span>
            </span>
          )}

          {/* 3. Score & Mini Horizontal Gauge Bar with 85 tick */}
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-xs font-bold ${scoreColor}`}>
              {score}
            </span>
            <div
              className="w-16 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden relative inline-block align-middle ml-1.5 border border-[var(--line-strong)]/30"
              title="Human-review threshold: 85"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${fillBg}`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
              {/* Vertical threshold marker tick at 85 */}
              <i
                className="absolute top-0 bottom-0 left-[85%] w-[1.5px] bg-[var(--ink)] opacity-80 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* 2. Impact Label */}
        <div
          className={`text-xs font-semibold ${isDefectState
            ? "text-rose-600 dark:text-rose-400"
            : isAmber
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
            }`}
        >
          {isDefectState
            ? "Blocks approval"
            : isAmber
              ? "Requires supervisor authorization"
              : "Safe for approval"}
        </div>

        {/* 4. Helper Explanation */}
        <div
          className={`text-[11px] leading-tight ${isDefectState
            ? "text-rose-700 dark:text-rose-300"
            : isAmber
              ? "text-amber-700 dark:text-amber-400"
              : "text-emerald-700 dark:text-emerald-400"
            }`}
        >
          {helperText}
        </div>

        {/* 5. Interactive [✎ Correct...] Action */}
        {onCorrect && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onCorrect}
              className="px-3 py-1 rounded-md border border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-medium text-[var(--ink)] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Pencil size={12} className="text-[var(--ink-2)]" />
              <span>Correct...</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#171b33] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(15,18,37,0.04)] overflow-hidden">
      {/* Component Title & Stepper Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#171b33] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#1f4b8e]" />
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">7-Agent Defense Pipeline</span>
        </div>
        <span className="font-mono text-xs text-slate-400">
          Autonomous Interdiction & Forensic Audit Protocol
        </span>
      </div>

      {/* Success notification banner when override is saved */}
      {successToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Vertical Connected Stepper Container */}
      <div className="p-5 space-y-4 relative">
        {/* Subtle connecting vertical line running down through steps (Clean light slate) */}
        <div className="absolute left-[33px] top-7 bottom-7 w-[2px] bg-slate-200 dark:bg-slate-700 pointer-events-none" />

        {/* ============================================================== */}
        {/* AGENT 1: In-Memory Privacy Sanitizer (RAM Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("01", "VERIFIED")}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  In-Memory Privacy Sanitizer
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  RAM Layer
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  PASSED · BYPASS
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>100% Zero Disk Write</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 2: Deterministic Binary Forensics (Byte Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("02", agent2Status)}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleAgent(2)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Deterministic Binary Forensics
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  Byte Layer
                </span>
                {agent2Status === "DEFECT" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    ▲ Binary Tampering
                  </span>
                ) : agent2Status === "NEEDS_REVIEW" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    ▲ Anomalous Metadata
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    ✓ Clean ERP Binary
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-2)]">
                  Score:{" "}
                  <span className={`font-bold ${getScoreTextColor(agent2Score, agent2Status === "DEFECT")}`}>
                    {agent2Score}
                  </span>
                </span>
                {isAgentExpanded(2) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isAgentExpanded(2) && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161a30] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">Producer Tool Metadata</span>
                    <p className="font-mono text-xs font-medium text-[var(--ink)]">
                      {invoice.producerTool}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {agent2Status === "DEFECT"
                        ? "Non-ERP splicing utility detected (desynchronized byte offsets)."
                        : agent2Status === "NEEDS_REVIEW"
                          ? "Secondary PDF tool detected; lacks official enterprise signature."
                          : "Verified authentic enterprise ERP export signature."}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">Trailer & Splicing Markers</span>
                    <p className="font-mono text-xs font-medium text-[var(--ink)]">
                      {agent2Status === "DEFECT"
                        ? "2 EOF markers · Incremental modification detected"
                        : agent2Status === "NEEDS_REVIEW"
                          ? "1 EOF marker · Minor font subset anomalies"
                          : "1 atomic EOF trailer · Zero post-generation edits"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      SHA256: 7f8a...3312 verified against runtime byte cache
                    </span>
                  </div>
                </div>

                {renderStatusBlock({
                  status: agent2Status,
                  score: agent2Score,
                  helperText:
                    agent2Status === "DEFECT"
                      ? "Below 85: binary tampering detected in PDF trailer markers"
                      : agent2Status === "NEEDS_REVIEW"
                        ? "Below 85: unverified PDF compilation utility flagged"
                        : "98: authentic ERP binary export signature confirmed",
                  onCorrect: () =>
                    handleOpenOverride({
                      agentNumber: 2,
                      fieldName: "PDF Producer Signature",
                      currentValue: invoice.producerTool,
                      expectedValue: "AutoCount ERP / Acrobat Pro",
                    }),
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 3: Ground-Truth Registry & Threat Cache (Relational Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("03", agent3Status)}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleAgent(3)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Ground-Truth Registry & Threat Cache
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  Relational Layer
                </span>
                {agent3Status === "DEFECT" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    ▲ Bank Desync: Claimed CIMB vs Ledger Maybank
                  </span>
                ) : agent3Status === "NEEDS_REVIEW" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    ▲ Review Required
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    ✓ 100% Ledger Parity
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-2)]">
                  Score:{" "}
                  <span className={`font-bold ${getScoreTextColor(agent3Score, agent3Status === "DEFECT")}`}>
                    {agent3Score}
                  </span>
                </span>
                {isAgentExpanded(3) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isAgentExpanded(3) && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161a30] space-y-4">
                {/* Embedded 3-Way Reconciliation Table */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase">3-Way Forensic Reconciliation Table</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Master Procurement Baseline
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 select-none">
                          <th className="py-2.5 px-4 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">Verification Field</th>
                          <th className="py-2.5 px-4 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">Master Ledger · Source of Truth</th>
                          <th className="py-2.5 px-4 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">Inbound Claim · Submitted</th>
                          <th className="py-2.5 px-4 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase text-right pr-4">Status & Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)] bg-[var(--surface)]">
                        {reconciliationFields.map((row) => {
                          const override = overrides[row.key];
                          const effectiveDraft = override ? override.value : row.draft;
                          const isMatch = override ? true : row.rawStatus === "match";

                          return (
                            <tr
                              key={row.key}
                              className={`transition-colors ${!isMatch
                                ? "bg-rose-50/70 dark:bg-rose-950/40 border-l-[3px] border-l-rose-500"
                                : "border-l-[3px] border-l-transparent hover:bg-[var(--surface-2)]"
                                }`}
                            >
                              <td className="py-3 px-4 font-medium text-[var(--ink)]">
                                <div>{row.label}</div>
                                {override && (
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                    [Overridden by Operator]
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-[var(--ink-2)]">
                                {row.truth}
                              </td>
                              <td
                                className={`py-3 px-4 font-mono text-[11px] ${!isMatch
                                  ? "text-rose-700 dark:text-rose-300 font-bold"
                                  : "text-[var(--ink)]"
                                  }`}
                              >
                                {effectiveDraft}
                                {override && (
                                  <div className="text-[10px] text-[var(--ink-3)] line-through">
                                    {row.draft}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right pr-4 whitespace-nowrap">
                                <div className="flex flex-col items-end gap-1">
                                  {isMatch ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 size={13} />
                                      <span>{override ? "CORRECTED" : "MATCH"}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                      <AlertTriangle size={13} />
                                      <span>MISMATCH</span>
                                    </span>
                                  )}

                                  {!isMatch && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenOverride({
                                          agentNumber: 3,
                                          fieldName: row.key,
                                          currentValue: row.draft,
                                          expectedValue: row.truth,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] underline cursor-pointer"
                                    >
                                      <Pencil size={10} />
                                      <span>Correct...</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {renderStatusBlock({
                  status: agent3Status,
                  score: agent3Score,
                  helperText:
                    agent3Status === "DEFECT"
                      ? "Below 85: could be wrong · Ground-truth ledger mismatch requires manual verification"
                      : agent3Status === "NEEDS_REVIEW"
                        ? "Below 85: partial matching requires secondary operator confirmation"
                        : "100: exact ground-truth parity confirmed against Master Ledger",
                  onCorrect: () =>
                    handleOpenOverride({
                      agentNumber: 3,
                      fieldName: "Relational Ledger Reconciliation",
                      currentValue: "Claimed CIMB 8009-4411-2299",
                      expectedValue: "Baseline Maybank 514012998877",
                    }),
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 4: Cognitive Behavioral Investigator (Perception Layer – Gemini 2.5 Flash) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("04", agent4Status)}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleAgent(4)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Cognitive Behavioral Investigator
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  Perception Layer · Gemini 2.5 Flash
                </span>
                {agent4Status === "DEFECT" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    ▲ Artificial Urgency & Coercion
                  </span>
                ) : agent4Status === "NEEDS_REVIEW" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    ▲ Artificial Urgency Triggered
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    ✓ Clean Communication Profile
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-2)]">
                  Score:{" "}
                  <span className={`font-bold ${getScoreTextColor(agent4Score, agent4Status === "DEFECT")}`}>
                    {agent4Score}
                  </span>
                </span>
                {isAgentExpanded(4) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isAgentExpanded(4) && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161a30] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">NLP Urgency & Pressure Signal</span>
                    <p className="font-semibold text-xs text-[var(--ink)]">
                      {agent4Status === "DEFECT"
                        ? "CRITICAL (5:00 PM Suspension Threat · Work Stoppage Trigger)"
                        : agent4Status === "NEEDS_REVIEW"
                          ? "ELEVATED (Immediate Payment Prompt · Uncharacteristic Vendor Tone)"
                          : "NORMAL (Standard Net 30 Commercial Billing Terms)"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Extracted NLP tokens evaluated with zero prompt injection escape.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">Authority Impersonation Flag</span>
                    <p className="font-semibold text-xs text-[var(--ink)]">
                      {agent4Status === "DEFECT"
                        ? "Executive Override Claim ('Annual audit freezing account')"
                        : agent4Status === "NEEDS_REVIEW"
                          ? "Unverified Email Sender Domain Variant"
                          : "Verified standard AP clerk correspondence"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Sender domain match: {invoice.sender}
                    </span>
                  </div>
                </div>

                {renderStatusBlock({
                  status: agent4Status,
                  score: agent4Score,
                  helperText:
                    agent4Status === "DEFECT"
                      ? "Below 85: cognitive coercion indicators exceed safety threshold"
                      : agent4Status === "NEEDS_REVIEW"
                        ? "Below 85: uncharacteristic urgency pattern flagged for supervisor review"
                        : "95: legitimate commercial transaction tone validated",
                  onCorrect: () =>
                    handleOpenOverride({
                      agentNumber: 4,
                      fieldName: "Cognitive Behavioral Assessment",
                      currentValue: "Coercive Urgency (35)",
                      expectedValue: "Routine Business (95)",
                    }),
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 5: Declarative Policy Arbiter & Fail-Closed Safety Net (Governance Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("05", agent5Status)}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleAgent(5)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Declarative Policy Arbiter & Safety Net
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  Governance Layer
                </span>
                {agent5Status === "DEFECT" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    ▲ Fail-Closed Hold
                  </span>
                ) : agent5Status === "NEEDS_REVIEW" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    ▲ Dual Authorization Required
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    ✓ Policy Compliant
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-2)]">
                  Score:{" "}
                  <span className={`font-bold ${getScoreTextColor(agent5Score, agent5Status === "DEFECT")}`}>
                    {agent5Score}
                  </span>
                </span>
                {isAgentExpanded(5) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isAgentExpanded(5) && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161a30] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">Discretionary Limits Check</span>
                    <p className="font-medium text-xs text-[var(--ink)]">
                      {formatMYR(invoice.amountMyr)} · Tier 2 Discretionary Boundary
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Dual authorization mandatory for payments exceeding RM 20,000.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">4-Eyes Governance Rule</span>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Clerk Sign-off:</span>
                        <span className={`font-mono font-medium ${clerkSigned ? "text-[var(--ok)]" : "text-[var(--ink-3)]"}`}>
                          {clerkSigned ? "Signed (Alex Tan)" : "Pending Signature"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Manager Approval:</span>
                        <span className={`font-mono font-medium ${managerSigned ? "text-[var(--ok)]" : "text-[var(--ink-3)]"}`}>
                          {managerSigned ? "Signed (Finance Controller)" : "Pending Dual Authorization"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {renderStatusBlock({
                  status: agent5Status,
                  score: agent5Score,
                  helperText:
                    agent5Status === "DEFECT"
                      ? "Below 85: fail-closed safety rule active · dual authorization required"
                      : agent5Status === "NEEDS_REVIEW"
                        ? "Below 85: discretionary threshold exceeded · dual approval required"
                        : "100: dual approval protocol satisfied and verified",
                  onCorrect: () =>
                    handleOpenOverride({
                      agentNumber: 5,
                      fieldName: "Policy Arbiter Safety Net",
                      currentValue: "Fail-Closed Active",
                      expectedValue: "Manual Override Approved",
                    }),
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 6: Containment & Statutory Artifact Synthesis (Response Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("06", agent6Status)}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleAgent(6)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Containment & Statutory Artifact Synthesis
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  Response Layer
                </span>
                {agent6Status === "DEFECT" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    ▲ Voucher Frozen
                  </span>
                ) : agent6Status === "NEEDS_REVIEW" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    ▲ Voucher Quarantined
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    ✓ Clean Voucher Synthesized
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-2)]">
                  Score:{" "}
                  <span className={`font-bold ${getScoreTextColor(agent6Score, agent6Status === "DEFECT")}`}>
                    {agent6Score}
                  </span>
                </span>
                {isAgentExpanded(6) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isAgentExpanded(6) && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161a30] space-y-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                  <span className="label block">Statutory Action State</span>
                  <p className="font-semibold text-xs text-[var(--ink)]">
                    {voucherReleased
                      ? "PAYMENT VOUCHER RELEASED · Outbound banking gate executed"
                      : agent6Status === "DEFECT"
                        ? "WIRE INTERDICTION ACTIVE: Payment voucher quarantined under VCH-HOLD-2026-8841"
                        : agent6Status === "NEEDS_REVIEW"
                          ? "VOUCHER PENDING: Quarantined pending second finance approval"
                          : "READY FOR RELEASE: Clean voucher synthesized for AutoCount ERP"}
                  </p>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Ledger Event: EVT-INT-8841 (Recorded in immutable cryptographic log)
                  </span>
                </div>

                {renderStatusBlock({
                  status: agent6Status,
                  score: agent6Score,
                  helperText:
                    agent6Status === "DEFECT"
                      ? "Below 85: voucher on mandatory security hold"
                      : agent6Status === "NEEDS_REVIEW"
                        ? "Below 85: voucher locked pending supervisor authorization"
                        : "100: clean statutory voucher synthesized",
                  onCorrect: () =>
                    handleOpenOverride({
                      agentNumber: 6,
                      fieldName: "Containment Voucher Status",
                      currentValue: "Quarantined Hold (40)",
                      expectedValue: "Authorized Voucher (100)",
                    }),
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 7: OSINT Police Threat Intelligence Ingestion (PDRM CCID SemakMule) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          {renderStepCircle("07", agent7Status)}
          <div className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#171b33] overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleAgent(7)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  OSINT Police Threat Intelligence Ingestion
                </span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded">
                  PDRM CCID SemakMule
                </span>
                {agent7Status === "DEFECT" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    ▲ SemakMule Blacklist Hit
                  </span>
                ) : agent7Status === "NEEDS_REVIEW" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    ▲ Telephony Watchlist Notice
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    ✓ Clean Police Database Query
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-2)]">
                  Score:{" "}
                  <span className={`font-bold ${getScoreTextColor(agent7Score, agent7Status === "DEFECT")}`}>
                    {agent7Score}
                  </span>
                </span>
                {isAgentExpanded(7) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {isAgentExpanded(7) && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161a30] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">SemakMule Account Query</span>
                    <p
                      className={`font-mono text-xs font-bold ${agent7Status === "DEFECT" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                    >
                      {agent7Status === "DEFECT"
                        ? "8009-4411-2299 (CIMB) · FLAGGED ON PDRM MULE BLACKLIST"
                        : "514012998877 (Maybank) · 0 Commercial Police Reports"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Direct CCID commercial blacklist API query validated at runtime.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                    <span className="label block">Telephony & Fraud Risk</span>
                    <p className="font-medium text-xs text-[var(--ink)]">
                      {agent7Status === "DEFECT"
                        ? "+60 11-2345 6789 flagged on cybercrime suspect directory"
                        : agent7Status === "NEEDS_REVIEW"
                          ? "Inbound telephone number has no prior verified commercial transaction history"
                          : "Landline +60 3-7722 8888 matches verified registered vendor business"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      CCID Commercial Crimes Investigation Department parity check.
                    </span>
                  </div>
                </div>

                {renderStatusBlock({
                  status: agent7Status,
                  score: agent7Score,
                  helperText:
                    agent7Status === "DEFECT"
                      ? "Below 85: PDRM CCID SemakMule hit flagged"
                      : agent7Status === "NEEDS_REVIEW"
                        ? "Below 85: vendor telephone unverified in police registry"
                        : "100: zero commercial fraud reports in police registry",
                  onCorrect: () =>
                    handleOpenOverride({
                      agentNumber: 7,
                      fieldName: "PDRM SemakMule Mule Record",
                      currentValue: "SemakMule Blacklist Flagged",
                      expectedValue: "Verified Legitimate Account",
                    }),
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line-strong)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil size={15} className="text-[var(--ink-2)]" />
                <span className="font-bold text-xs text-[var(--ink)]">
                  Manual Operator Override
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="p-5 space-y-4">
              <div>
                <span className="label block mb-1">Target Field / Agent</span>
                <p className="font-semibold text-xs text-[var(--ink)]">
                  {overrideModal.fieldName}
                </p>
              </div>

              <div>
                <span className="label block mb-1">Current Claimed Value</span>
                <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] font-mono text-xs text-[var(--ink-2)] truncate">
                  {overrideModal.currentValue}
                </div>
              </div>

              <div>
                <label className="label block mb-1" htmlFor="override-input">
                  Ground-Truth Override Value
                </label>
                <input
                  id="override-input"
                  type="text"
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className="field w-full text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="label block mb-1" htmlFor="override-reason">
                  Justification / Audit Note (Required for SOX Compliance)
                </label>
                <textarea
                  id="override-reason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--focus)]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setOverrideModal(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiAgentPipeline;
