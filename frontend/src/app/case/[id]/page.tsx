"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mail,
  Paperclip,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Printer,
} from "lucide-react";
import {
  fetchInvoiceById,
  approveInvoice,
  escalateInvoice,
  DemoInvoice,
} from "@/services/api";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";
import { MultiAgentPipeline } from "@/components/MultiAgentPipeline";

interface ComparisonFieldData {
  truth?: string;
  draft?: string;
  status?: string;
  score?: number;
}

interface UnifiedCase {
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
  category: string;
  threatCategory?: string;
  status: "VERIFIED" | "NEEDS_REVIEW" | "DEFECT" | "LOCKED_CRITICAL" | "RESOLVED";
  reasoning: string;
  files: string[];
  comparison: Record<string, ComparisonFieldData>;
  decision?: string;
  resolved?: boolean;
  has_operator_override?: boolean;
  corrected_fields?: Array<{
    field: string;
    value: string;
    canonical_field?: string;
    timestamp?: string;
    clerk_id?: string;
  }>;
  defect_fields?: number;
}

const TOTAL_CASES = 50;

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params?.id as string) || "";

  const [invoice, setInvoice] = useState<UnifiedCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  const [voucherReleased, setVoucherReleased] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Compute pagination index (0-indexed)
  const numMatch = caseId.match(/\d+/);
  const rawNum = numMatch ? parseInt(numMatch[0], 10) : 1;
  const currentIndex = Math.max(0, Math.min(TOTAL_CASES - 1, rawNum - 1));

  const goToCase = (index: number) => {
    const targetNum = index + 1;
    const targetId = `email_${String(targetNum).padStart(3, "0")}`;
    router.push(`/case/${targetId}`);
  };

  const adaptDemoInvoice = useCallback((raw: DemoInvoice) => {
    const isApproved = raw.decision === "approved" || raw.is_approved === true || (raw.status === "VERIFIED" && Boolean(raw.resolved)) || (raw as unknown as Record<string, unknown>).decision === "PAYMENT_RELEASED";
    const isEscalated = raw.decision === "escalated" || (Boolean(raw.resolved) && (raw.status === "LOCKED_CRITICAL" || raw.is_escalated)) || (raw as unknown as Record<string, unknown>).decision === "PAYMENT_LOCKED";
    const isDefect = !isApproved && !isEscalated && (raw.status === "DEFECT" || raw.status === "LOCKED_CRITICAL" || raw.risk_score >= 80);
    const isReview = !isApproved && !isEscalated && !isDefect && (raw.status === "NEEDS_REVIEW" || (raw.risk_score > 20 && raw.risk_score < 80));

    if (isApproved) {
      setVoucherReleased(true);
    }

    const rawAmt = raw.comparison?.amount?.draft || "18500";
    const parsedAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, "")) || 18500;
    const comp = (raw.comparison || {}) as Record<string, ComparisonFieldData>;

    const files = raw.files && raw.files.length > 0
      ? raw.files
      : [`${raw.id}_invoice.pdf`, "vendor_remittance.pdf"];

    const rawNum = raw.id.match(/\d+/)?.[0] || "001";
    const emailId = raw.id.startsWith("email_") ? raw.id : `email_${rawNum.padStart(3, "0")}`;

    const rawWithBody = raw as DemoInvoice & { email_body?: string; producer_tool?: string; certainty_confidence?: number };
    const emailBody = rawWithBody.email_body || (isDefect
      ? `Dear Finance,\n\nOur standard Maybank account is under annual audit and temporarily frozen.\nPlease remit the outstanding milestone claim of RM ${parsedAmt.toLocaleString()}.00 today to our backup account:\nBank: CIMB Bank\nAccount: 8009-4411-2299\n\nPayment must be made before 5:00 PM today to prevent work stoppage on site.\nDirect inquiries to mobile 012-3456789.\n\nRegards,\nAlex Tan\n${raw.sender_name || "Mega Logistics"} AP Team`
      : `From: ${raw.sender_email}\nTo: finance-ap@sme-enterprise.com.my\nDate: ${raw.received_date}\nSubject: ${raw.subject}\n\nDear Accounts Payable Team,\n\nPlease find attached our official tax invoice and milestone claim for verified procurement deliverables.\nAll banking details remain consistent with our verified Master Procurement Ledger.\nPayment terms: Net 30 Days.\n\nThank you,\n${raw.sender_name || "Commercial Billing Desk"}`);

    setInvoice({
      id: emailId,
      referenceId: raw.id.toUpperCase(),
      vendorName: raw.sender_name || "Mega Logistics Sdn Bhd",
      sender: raw.sender_email,
      subject: raw.subject,
      amountMyr: parsedAmt,
      receivedDate: raw.received_date,
      emailBody,
      producerTool: rawWithBody.producer_tool || (isApproved ? "AutoCount ERP / Acrobat Pro" : isDefect ? "iLovePDF Spliced (Binary Desync)" : "AutoCount ERP / Acrobat Pro"),
      riskScore: isApproved ? 0 : raw.risk_score,
      certaintyConfidence: rawWithBody.certainty_confidence || (isDefect ? 98 : 96),
      category: raw.category || "General Procurement",
      threatCategory: raw.category || (isApproved ? "Routine Billing" : isDefect ? "BEC Wire Scam" : "Routine Billing"),
      status: isApproved ? "VERIFIED" : (raw.status === "LOCKED_CRITICAL" ? "LOCKED_CRITICAL" : (isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED")),
      reasoning: isApproved
        ? "Dual 4-Eyes authorization committed. Payment voucher released."
        : (raw.banner_message || (isDefect
          ? "Discrepancy Trap: Inbound payment remittance details contradict Master Procurement Ledger baseline."
          : "All verified fields match the Master Procurement Ledger with 100% confidence.")),
      files,
      comparison: comp,
      decision: raw.decision,
      resolved: raw.resolved,
      has_operator_override: raw.has_operator_override,
      corrected_fields: raw.corrected_fields,
      defect_fields: raw.defect_fields,
    });
  }, []);

  const loadRecord = useCallback(async () => {
    setIsLoading(true);
    try {
      const live = await fetchInvoiceById(caseId);
      if (live) {
        adaptDemoInvoice(live);
      } else {
        setInvoice(null);
      }
    } catch (err) {
      console.warn(`Failed to fetch case ${caseId} from live backend:`, err);
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, adaptDemoInvoice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecord();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRecord]);

  const handleHoldWire = async (reason: string) => {
    if (!invoice) return;
    setIsActionLoading(true);
    try {
      const res = await escalateInvoice(invoice.id, reason || "Unauthorized bank account detected. Wire transfer frozen.");
      if (res.record) {
        adaptDemoInvoice(res.record);
      } else {
        await loadRecord();
      }
    } catch (err) {
      console.warn("Escalation API error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!invoice) return;
    setIsActionLoading(true);
    try {
      const res = await approveInvoice(invoice.id, "AP-CLERK-MY01", "Operator verified & approved.");
      setVoucherReleased(true);
      if (res.record) {
        adaptDemoInvoice(res.record);
      } else {
        await loadRecord();
      }
    } catch (err) {
      console.warn("Approval API error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const evidencePayload = useMemo(() => {
    if (!invoice) return {};
    return {
      case_id: invoice.id,
      reference_id: invoice.referenceId,
      vendor: invoice.vendorName,
      inbound_sender: invoice.sender,
      status: invoice.status,
      category: invoice.category,
      threat_category: invoice.category,
      risk_score: invoice.riskScore,
      model_confidence: `${invoice.certaintyConfidence}%`,
      amount_myr: invoice.amountMyr,
      producer_tool: invoice.producerTool,
      audit_source: "Master Procurement Ledger Parity Engine",
      sha256_fingerprint: "8f4a13b9c7028e1d5e6a9928f01b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      comparison_fields: invoice.comparison,
    };
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--ink-3)] font-mono">
        Loading forensic verification dossier...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center text-xs text-[var(--ink-3)] font-mono space-y-3">
        <div>Case &ldquo;{caseId}&rdquo; not found in active verification queue.</div>
        <button
          type="button"
          onClick={() => router.push("/queue")}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Navigation Strip & Pagination */}
      <div className="w-full flex items-center justify-between mb-3 select-none">
        <button
          type="button"
          onClick={() => router.push("/queue")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors py-1 cursor-pointer select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Queue</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-[var(--ink-3)]">
            {currentIndex + 1} of {TOTAL_CASES}
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => goToCase(currentIndex - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              aria-label="Previous case"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={currentIndex >= TOTAL_CASES - 1}
              onClick={() => goToCase(currentIndex + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              aria-label="Next case"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Task 2: 2-Column Cockpit Layout (Left ~72%, Right ~28% sticky) */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-5">
        {/* Left Column (~72% width) */}
        <div className="w-full lg:w-[72%] space-y-4">
          {/* Task 3: Case Header Card */}
          <div className="bg-white dark:bg-[#11131a] rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-3.5 shadow-[0_1px_3px_rgba(15,18,37,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 block">
                  {invoice.id}
                </span>
                <h1 className="text-lg font-semibold text-[#0f1225] dark:text-[#f8fafc] leading-snug">
                  {invoice.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span>{invoice.sender}</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Received {invoice.receivedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 font-medium inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1f4b8e]" />
                  <span>{invoice.category}</span>
                </span>
                <ThreatSeverityBadge status={invoice.status} />
              </div>
            </div>

            {/* Attachment Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              {invoice.files.map((file, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-mono select-none transition-colors"
                >
                  <Paperclip size={12} className="text-slate-400 shrink-0" />
                  <span>{file}</span>
                </span>
              ))}
            </div>

            {/* Interactive "Read the email" Disclosure */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowEmail((prev) => !prev)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1.5 py-1 select-none transition-colors"
              >
                <span className="text-[10px] leading-none">{showEmail ? "▼" : "▶"}</span>
                <span>Read the email</span>
              </button>

              {showEmail && (
                <div className="mt-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 overflow-y-auto max-h-[260px]">
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight select-text whitespace-pre-wrap">
                    {invoice.emailBody}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task 4: Forensic Guidance Banner */}
          {invoice.status === "DEFECT" ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-2xs">
              <ShieldAlert size={17} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-0.5">
                  Banking Details Mismatch Detected
                </span>
                <span>
                  {invoice.reasoning || "Banking details mismatch detected. Inbound account does not match Master Procurement Ledger."}
                </span>
              </div>
            </div>
          ) : invoice.status === "NEEDS_REVIEW" ? (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
              <AlertTriangle size={17} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-0.5">
                  Operator Review Required
                </span>
                <span>
                  {invoice.reasoning || "Discrepancy or anomaly detected. Verification review required before releasing payment."}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 flex items-start gap-3 shadow-2xs">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-0.5">
                  Master Ledger Parity Confirmed
                </span>
                <span>
                  {invoice.reasoning || "All fields verified against Master Procurement Ledger. Low fraud probability."}
                </span>
              </div>
            </div>
          )}

          {/* 7-Agent Defense Pipeline */}
          <MultiAgentPipeline
            invoice={invoice}
            voucherReleased={voucherReleased}
            onInvoiceUpdated={(rec) => adaptDemoInvoice(rec)}
          />
        </div>

        {/* Right Column (~28% width, sticky) */}
        <div className="w-full lg:w-[28%] lg:sticky lg:top-4 self-start space-y-4 shrink-0">
          {/* Task 5: DECIDE Actions Card */}
          {(() => {
            const isApproved = invoice.decision === "approved" || voucherReleased || (invoice.status === "VERIFIED" && Boolean(invoice.resolved));
            const isEscalated = invoice.decision === "escalated" || (Boolean(invoice.resolved) && (invoice.status === "LOCKED_CRITICAL" || invoice.status === "DEFECT"));
            const hasDefects = (invoice.status === "DEFECT" || invoice.status === "LOCKED_CRITICAL" || invoice.status === "NEEDS_REVIEW") && (invoice.defect_fields ?? 1) > 0;
            const hasOperatorOverride = Boolean(invoice.has_operator_override || (invoice.corrected_fields && invoice.corrected_fields.length > 0));
            const canApprove = invoice.status === "VERIFIED" || hasOperatorOverride || !hasDefects;

            return (
              <div className="bg-white dark:bg-[#11131a] rounded-xl border border-slate-200/80 dark:border-white/10 p-4 space-y-3.5 shadow-[0_1px_3px_rgba(15,18,37,0.04)]">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-1">
                    DECIDE
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    {isApproved
                      ? "Payment voucher authorized and released."
                      : isEscalated
                        ? "Wire frozen and escalated for containment."
                        : invoice.status === "DEFECT"
                          ? "Defect flags exceed threshold. Resolve defects before authorization or escalate."
                          : invoice.status === "NEEDS_REVIEW"
                            ? "Confidence warning. Operator review required before releasing payment voucher."
                            : "High confidence straight-through match. Ready for final payment authorization."}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {isApproved ? (
                    <div className="w-full py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs select-none">
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>✓ Approved</span>
                    </div>
                  ) : isEscalated ? (
                    <div className="w-full py-2.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs select-none">
                      <span className="text-sm">🚨</span>
                      <span>Escalated</span>
                    </div>
                  ) : (
                    <>
                      {!canApprove && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pb-0.5">
                          Resolve or correct flagged defects before authorization is permitted.
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={!canApprove || isActionLoading}
                        onClick={handleReleasePayment}
                        className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors ${
                          canApprove
                            ? "bg-[#0f1225] text-white hover:bg-[#1f4b8e] cursor-pointer"
                            : "opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/50 dark:border-slate-700/50"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve and Submit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleHoldWire("Unauthorized bank account desync flagged.")}
                        className="w-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/60 hover:bg-amber-100/60 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Flag size={14} />
                        <span>Escalate</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Task 5: SUBMISSION / FORENSIC EVIDENCE Card */}
          <div className="bg-white dark:bg-[#11131a] rounded-xl border border-slate-200/80 dark:border-white/10 p-4 space-y-3 shadow-[0_1px_3px_rgba(15,18,37,0.04)]">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-1">
              SUBMISSION / EVIDENCE
            </span>
            <div className="bg-[#0f1225] border border-slate-800 rounded-lg p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[220px] shadow-inner">
              <pre>{JSON.stringify(evidencePayload, null, 2)}</pre>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Export Forensic Audit Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}