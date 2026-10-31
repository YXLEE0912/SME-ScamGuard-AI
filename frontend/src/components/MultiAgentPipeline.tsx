"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Binary,
  Database,
  BrainCircuit,
  Scale,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Radio,
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
  const comp = invoice.comparison || {};

  // Track expanded accordions (default Agent 3 open if defect, or Agent 3 & 4)
  const [expandedAgents, setExpandedAgents] = useState<Record<number, boolean>>({
    2: isDefect,
    3: true,
    4: isDefect,
    5: false,
    6: false,
    7: isDefect,
  });

  // Track local manual overrides applied by operator
  const [overrides, setOverrides] = useState<Record<string, { value: string; reason: string }>>({});
  const [overrideModal, setOverrideModal] = useState<OverrideTarget | null>(null);
  const [overrideInput, setOverrideInput] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const toggleAgent = (num: number) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [num]: !prev[num],
    }));
  };

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

  // Helper renderer for Status Verification Block
  const renderStatusBlock = ({
    isDefectState,
    score,
    helperText,
    onCorrect,
  }: {
    isDefectState: boolean;
    score: number;
    helperText: string;
    onCorrect?: () => void;
  }) => {
    const isSafe = !isDefectState && score >= 85;
    const isAmber = !isDefectState && score < 85;

    let fillBg = "bg-emerald-500";
    if (score < 50 || isDefectState) {
      fillBg = "bg-rose-500";
    } else if (score < 85 || isAmber) {
      fillBg = "bg-amber-500";
    }

    return (
      <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1.5 select-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 1. Status Pill */}
          {isSafe ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle2 size={12} />
              <span>✓ Verified</span>
            </span>
          ) : isAmber ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
              <AlertTriangle size={12} />
              <span>● Needs Review</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
              <AlertTriangle size={12} />
              <span>▲ Defect</span>
            </span>
          )}

          {/* 3. Score & Mini Horizontal Gauge Bar */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-[var(--ink)]">
              {score}
            </span>
            <div
              className="w-14 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden relative inline-block align-middle ml-1.5 border border-[var(--line-strong)]/30"
              title={`Human-review threshold: 85`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${fillBg}`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
              {/* Vertical threshold marker tick at 85 */}
              <i
                className="absolute top-0 bottom-0 left-[85%] w-[1px] bg-[var(--ink)] opacity-70 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* 2. Impact Label */}
        <div
          className={`text-xs font-semibold mt-0.5 ${isDefectState ? "text-[var(--defect)]" : "text-[var(--ok)]"
            }`}
        >
          {isDefectState ? "Blocks approval" : "Safe for approval"}
        </div>

        {/* 4. Helper Explanation */}
        <div
          className={`text-[11px] leading-tight ${score < 85
              ? "text-amber-700 dark:text-amber-400"
              : "text-emerald-700 dark:text-emerald-400"
            }`}
        >
          {helperText}
        </div>

        {/* 5. Interactive [✎ Correct...] Action */}
        {onCorrect && (
          <button
            type="button"
            onClick={onCorrect}
            className="mt-2 px-3 py-1 rounded-md border border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-medium text-[var(--ink)] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Pencil size={12} className="text-[var(--ink-2)]" />
            <span>Correct...</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="card overflow-hidden">
      {/* Component Title & Stepper Header */}
      <div className="p-4 border-b border-[var(--line)] bg-[var(--surface-2)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--burgundy)]" />
          <span className="label">7-Agent Defense Pipeline</span>
        </div>
        <span className="text-[11px] font-mono text-[var(--ink-3)]">
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
        {/* Subtle connecting vertical line running down through steps */}
        <div className="absolute left-[33px] top-7 bottom-7 w-[2px] bg-[var(--line)] pointer-events-none" />

        {/* ============================================================== */}
        {/* AGENT 1: In-Memory Privacy Sanitizer (RAM Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)]">
            01
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 bg-[var(--surface)]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  In-Memory Privacy Sanitizer
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  RAM Layer
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  PASSED · BYPASS
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-3)]">
                <span>100% Zero Disk Write</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 2: Deterministic Binary Forensics (Byte Layer) */}
        {/* ============================================================== */}
        <div className="relative flex items-start gap-3.5">
          <div
            className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] ${isDefect ? "bg-rose-500" : "bg-emerald-500"
              }`}
          >
            02
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div
              onClick={() => toggleAgent(2)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <Binary size={15} className="text-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Deterministic Binary Forensics
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  Byte Layer
                </span>
                {isDefect ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    ▲ Binary Tampering
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    ✓ Clean ERP Binary
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                  Score: {isDefect ? 45 : 98}
                </span>
                {expandedAgents[2] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {expandedAgents[2] && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">Producer Tool Metadata</span>
                    <p className="font-mono text-xs font-medium text-[var(--ink)]">
                      {invoice.producerTool}
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      {isDefect
                        ? "Non-ERP splicing utility detected (desynchronized byte offsets)."
                        : "Verified authentic enterprise ERP export signature."}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">Trailer & Splicing Markers</span>
                    <p className="font-mono text-xs font-medium text-[var(--ink)]">
                      {isDefect ? "2 EOF markers · Incremental modification detected" : "1 atomic EOF trailer · Zero post-generation edits"}
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      SHA256: 7f8a...3312 verified against runtime byte cache
                    </span>
                  </div>
                </div>

                {renderStatusBlock({
                  isDefectState: isDefect,
                  score: isDefect ? 45 : 98,
                  helperText: isDefect
                    ? "Below 85: binary tampering detected in PDF trailer markers"
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
          <div
            className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] ${isDefect ? "bg-rose-500" : "bg-emerald-500"
              }`}
          >
            03
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div
              onClick={() => toggleAgent(3)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <Database size={15} className="text-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Ground-Truth Registry & Threat Cache
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  Relational Layer
                </span>
                {isDefect ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    ▲ 3-Way Desync
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    ✓ 100% Ledger Parity
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                  Score: {isDefect ? 70 : 100}
                </span>
                {expandedAgents[3] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {expandedAgents[3] && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] space-y-4">
                {/* Embedded 3-Way Reconciliation Table */}
                <div className="rounded-lg border border-[var(--line)] overflow-hidden bg-[var(--surface)]">
                  <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--line)] flex items-center justify-between">
                    <span className="label">3-Way Forensic Reconciliation Table</span>
                    <span className="text-[11px] font-mono text-[var(--ink-3)]">
                      Master Procurement Baseline
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--line)] bg-[var(--surface-2)] select-none">
                          <th className="py-2.5 px-4 label">Verification Field</th>
                          <th className="py-2.5 px-4 label">Master Ledger · Source of Truth</th>
                          <th className="py-2.5 px-4 label">Inbound Claim · Submitted</th>
                          <th className="py-2.5 px-4 label text-right pr-4">Status & Match</th>
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
                                  ? "bg-[var(--defect)]/[0.04] border-l-[3px] border-l-[var(--defect)]"
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
                                    ? "text-[var(--defect)] font-semibold"
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
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ok)]">
                                      <CheckCircle2 size={13} />
                                      <span>{override ? "CORRECTED" : "MATCH"}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--defect)]">
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
                  isDefectState: isDefect && !overrides["bank_name"],
                  score: isDefect && !overrides["bank_name"] ? 70 : 100,
                  helperText:
                    isDefect && !overrides["bank_name"]
                      ? "Below 85: could be wrong · Ground-truth ledger mismatch requires manual verification"
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
          <div
            className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] ${isDefect ? "bg-rose-500" : "bg-emerald-500"
              }`}
          >
            04
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div
              onClick={() => toggleAgent(4)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <BrainCircuit size={15} className="text-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Cognitive Behavioral Investigator
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  Perception Layer · Gemini 2.5 Flash
                </span>
                {isDefect ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    ▲ Artificial Urgency & Coercion
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    ✓ Clean Communication Profile
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                  Score: {isDefect ? 35 : 95}
                </span>
                {expandedAgents[4] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {expandedAgents[4] && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">NLP Urgency & Pressure Signal</span>
                    <p className="font-semibold text-xs text-[var(--ink)]">
                      {isDefect
                        ? "CRITICAL (5:00 PM Suspension Threat · Work Stoppage Trigger)"
                        : "NORMAL (Standard Net 30 Commercial Billing Terms)"}
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      Extracted NLP tokens evaluated with zero prompt injection escape.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">Authority Impersonation Flag</span>
                    <p className="font-semibold text-xs text-[var(--ink)]">
                      {isDefect
                        ? "Executive Override Claim ('Annual audit freezing account')"
                        : "Verified standard AP clerk correspondence"}
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      Sender domain match: {invoice.sender}
                    </span>
                  </div>
                </div>

                {renderStatusBlock({
                  isDefectState: isDefect,
                  score: isDefect ? 35 : 95,
                  helperText: isDefect
                    ? "Below 85: cognitive coercion indicators exceed safety threshold"
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
          <div
            className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] ${isDefect ? "bg-rose-500" : "bg-emerald-500"
              }`}
          >
            05
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div
              onClick={() => toggleAgent(5)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <Scale size={15} className="text-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Declarative Policy Arbiter & Safety Net
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  Governance Layer
                </span>
                {isDefect ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    ▲ Fail-Closed Hold
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    ✓ Policy Compliant
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                  Score: {isDefect ? 50 : 100}
                </span>
                {expandedAgents[5] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {expandedAgents[5] && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">Discretionary Limits Check</span>
                    <p className="font-medium text-xs text-[var(--ink)]">
                      {formatMYR(invoice.amountMyr)} · Tier 2 Discretionary Boundary
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      Dual authorization mandatory for payments exceeding RM 20,000.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
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
                  isDefectState: isDefect,
                  score: isDefect ? 50 : 100,
                  helperText: isDefect
                    ? "Below 85: fail-closed safety rule active · dual authorization required"
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
          <div
            className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] ${isDefect ? "bg-rose-500" : "bg-emerald-500"
              }`}
          >
            06
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div
              onClick={() => toggleAgent(6)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <FileText size={15} className="text-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Containment & Statutory Artifact Synthesis
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  Response Layer
                </span>
                {isDefect ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    ▲ Voucher Frozen
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    ✓ Clean Voucher Synthesized
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                  Score: {isDefect ? 40 : 100}
                </span>
                {expandedAgents[6] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {expandedAgents[6] && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs">
                <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                  <span className="label block">Statutory Action State</span>
                  <p className="font-semibold text-xs text-[var(--ink)]">
                    {voucherReleased
                      ? "PAYMENT VOUCHER RELEASED · Outbound banking gate executed"
                      : isDefect
                        ? "WIRE INTERDICTION ACTIVE: Payment voucher quarantined under VCH-HOLD-2026-8841"
                        : "READY FOR RELEASE: Clean voucher synthesized for AutoCount ERP"}
                  </p>
                  <span className="text-[11px] text-[var(--ink-3)] font-mono">
                    Ledger Event: EVT-INT-8841 (Recorded in immutable cryptographic log)
                  </span>
                </div>

                {renderStatusBlock({
                  isDefectState: isDefect && !voucherReleased,
                  score: isDefect && !voucherReleased ? 40 : 100,
                  helperText:
                    isDefect && !voucherReleased
                      ? "Below 85: voucher on mandatory security hold"
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
          <div
            className={`w-7 h-7 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[var(--surface)] ${isDefect ? "bg-rose-500" : "bg-emerald-500"
              }`}
          >
            07
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div
              onClick={() => toggleAgent(7)}
              className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <Radio size={15} className="text-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  OSINT Police Threat Intelligence Ingestion
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-3)]">
                  PDRM CCID SemakMule
                </span>
                {isDefect ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    ▲ PDRM CCID Blacklist Hit
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    ✓ Clean Police Database Query
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                  Score: {isDefect ? 20 : 100}
                </span>
                {expandedAgents[7] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {expandedAgents[7] && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">SemakMule Account Query</span>
                    <p
                      className={`font-mono text-xs font-bold ${isDefect ? "text-[var(--defect)]" : "text-[var(--ok)]"
                        }`}
                    >
                      {isDefect
                        ? "8009-4411-2299 (CIMB) · FLAGGED ON PDRM MULE BLACKLIST"
                        : "514012998877 (Maybank) · 0 Commercial Police Reports"}
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      Direct CCID commercial blacklist API query validated at runtime.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] space-y-1">
                    <span className="label block">Telephony & Fraud Risk</span>
                    <p className="font-medium text-xs text-[var(--ink)]">
                      {isDefect
                        ? "+60 11-2345 6789 flagged on cybercrime suspect directory"
                        : "Landline +60 3-7722 8888 matches verified registered vendor business"}
                    </p>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      CCID Commercial Crimes Investigation Department parity check.
                    </span>
                  </div>
                </div>

                {renderStatusBlock({
                  isDefectState: isDefect,
                  score: isDefect ? 20 : 100,
                  helperText: isDefect
                    ? "Below 85: PDRM CCID SemakMule hit flagged"
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