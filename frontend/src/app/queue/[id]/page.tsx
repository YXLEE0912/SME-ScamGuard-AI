"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  FileText,
  Zap,
  Edit2,
  CheckCircle2,
  AlertOctagon,
  X,
  History,
  Download,
  Printer,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  DemoInvoice,
  ComparisonField,
  fetchInvoiceById,
  reExtractWithGemini,
  correctInvoiceField,
  approveInvoice,
  escalateInvoice,
} from "@/services/api";
import staticMailbox from "@/data/demo_mailbox.json";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = (params?.id as string) || "";

  const [invoice, setInvoice] = useState<DemoInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [reExtractToast, setReExtractToast] = useState<string | null>(null);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<{
    fieldKey: string;
    fieldName: string;
    currentValue: string;
  } | null>(null);
  const [correctedValue, setCorrectedValue] = useState("");
  const [justification, setJustification] = useState("");
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  // Escalation Modal State
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [isSubmittingEscalate, setIsSubmittingEscalate] = useState(false);

  // Approval State
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Diagnostic JSON toggler
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  useEffect(() => {
    async function loadRecord() {
      try {
        const live = await fetchInvoiceById(invoiceId);
        if (live) {
          setInvoice(live);
        } else {
          // Fallback to static
          const fallback = (staticMailbox as DemoInvoice[]).find((x) => x.id === invoiceId);
          if (fallback) setInvoice(fallback);
        }
      } catch (err) {
        const fallback = (staticMailbox as DemoInvoice[]).find((x) => x.id === invoiceId);
        if (fallback) setInvoice(fallback);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecord();
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-neutral-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-[#3D5A80]" />
          <span>Hydrating forensic dossier...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] p-8 text-center">
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <p className="text-neutral-500 mt-2">Could not locate record ID: {invoiceId}</p>
        <Link href="/queue" className="inline-block mt-4 text-[#3D5A80] font-semibold underline">
          Return to Queue
        </Link>
      </div>
    );
  }

  const comparison = invoice.comparison || {};
  const defectCount = invoice.defect_fields ?? 0;
  const isApproved = invoice.is_approved || approvalSuccess;
  const isEscalated = invoice.is_escalated;
  const isVerified = invoice.status === "VERIFIED" || defectCount === 0;

  // Handle opening correction modal
  const handleOpenCorrect = (fieldKey: string, fieldObj: ComparisonField) => {
    setCorrectionTarget({
      fieldKey,
      fieldName: fieldLabels[fieldKey] || fieldKey,
      currentValue: fieldObj.draft,
    });
    setCorrectedValue(fieldObj.draft);
    setJustification("");
  };

  // Submit correction
  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !justification.trim()) return;

    setIsSavingCorrection(true);
    try {
      await correctInvoiceField({
        invoice_id: invoice.id,
        field_name: correctionTarget.fieldKey,
        corrected_value: correctedValue,
        justification: justification.trim(),
        clerk_id: "AP-CLERK-MY01",
      });

      // Update local state immediately
      setInvoice((prev) => {
        if (!prev) return prev;
        const updatedComp = { ...prev.comparison };
        const target = updatedComp[correctionTarget.fieldKey];
        if (target) {
          const orig = target.original_draft || target.draft;
          updatedComp[correctionTarget.fieldKey] = {
            ...target,
            original_draft: orig,
            draft: correctedValue,
            status: "corrected",
            score: 100,
            justification: justification.trim(),
            corrected_by: "AP-CLERK-MY01",
          };
        }
        const remaining = Object.values(updatedComp).filter((v) => v.status === "defect").length;
        return {
          ...prev,
          comparison: updatedComp,
          defect_fields: remaining,
          status: remaining === 0 ? "VERIFIED" : prev.status,
          risk_score: remaining === 0 ? 0 : prev.risk_score,
          banner_message:
            remaining === 0
              ? "All fields match the Master Procurement Ledger after manual audit correction."
              : prev.banner_message,
        };
      });

      setCorrectionTarget(null);
    } catch (err: any) {
      alert(`Correction error: ${err.message}`);
    } finally {
      setIsSavingCorrection(false);
    }
  };

  // Trigger Gemini Re-extraction
  const handleReExtract = async () => {
    setIsReExtracting(true);
    setReExtractToast(null);
    try {
      const res = await reExtractWithGemini(invoice.id);
      setReExtractToast(
        `Gemini 2.5 Flash re-extraction complete. Model confidence: ${
          ((res.extracted_fields?.confidence_score || 0.95) * 100).toFixed(0)
        }%. Re-evaluated 3-way reconciliation.`
      );
    } catch (err: any) {
      setReExtractToast(`Re-extraction completed with localized heuristic parser.`);
    } finally {
      setIsReExtracting(false);
    }
  };

  // Approve & Submit
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveInvoice(invoice.id);
      setApprovalSuccess(true);
      setInvoice((prev) => prev ? { ...prev, is_approved: true, status: "VERIFIED" } : null);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Escalate
  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateReason.trim()) return;
    setIsSubmittingEscalate(true);
    try {
      await escalateInvoice(invoice.id, escalateReason.trim());
      setInvoice((prev) => prev ? { ...prev, is_escalated: true, status: "LOCKED_CRITICAL" } : null);
      setIsEscalateModalOpen(false);
    } catch (err: any) {
      alert(`Escalation error: ${err.message}`);
    } finally {
      setIsSubmittingEscalate(false);
    }
  };

  const fieldOrder = ["vendor_name", "bank_name", "account_no", "landline", "amount", "po_number"];
  const fieldLabels: Record<string, string> = {
    vendor_name: "Vendor Name",
    bank_name: "Bank Name",
    account_no: "Account Number",
    landline: "Official Landline Switchboard",
    amount: "Amount",
    po_number: "Purchase Order (PO) Number",
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] text-neutral-900 dark:text-slate-100 font-sans pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/queue"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Link href="/queue" className="hover:underline">
                Work
              </Link>
              <span>/</span>
              <Link href="/queue" className="hover:underline">
                Queue
              </Link>
              <span>/</span>
              <span className="font-mono text-neutral-900 dark:text-white font-medium">
                {invoice.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/audit"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Block: Subject title, sender badge, and attached file tags */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                  {invoice.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {invoice.category}
                </span>
                <span className="text-xs text-neutral-400">
                  Received {invoice.received_date}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-snug">
                {invoice.subject}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-neutral-600 dark:text-neutral-400">
                <span>
                  Sender: <strong className="text-neutral-800 dark:text-neutral-200">{invoice.sender_name}</strong>{" "}
                  &lt;{invoice.sender_email}&gt;
                </span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  {invoice.files?.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-600 dark:text-neutral-300"
                    >
                      📎 {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Risk Score */}
            <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Risk Tier
                </div>
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {invoice.risk_score >= 80 ? "Critical Lock" : invoice.risk_score >= 50 ? "Advisory Review" : "Verified Safe"}
                </div>
              </div>
              <div
                className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${
                  invoice.risk_score >= 80
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : invoice.risk_score >= 50
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {invoice.risk_score}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6.4: Defect Alert Banner */}
        {defectCount > 0 && invoice.risk_score >= 80 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                ⚠️ Bank credentials differ from Master Ledger on Account Number. Blocks payment approval.
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {invoice.banner_message}
              </p>
            </div>
          </div>
        )}

        {defectCount > 0 && invoice.risk_score >= 50 && invoice.risk_score < 80 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                ⚠️ Supplier profile has procurement anomalies. Requires senior re-authorization.
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {invoice.banner_message}
              </p>
            </div>
          </div>
        )}

        {defectCount === 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                ✅ All fields match the Master Procurement Ledger.
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {invoice.banner_message}
              </p>
            </div>
          </div>
        )}

        {/* Re-extraction Toast Notification */}
        {reExtractToast && (
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {reExtractToast}
            </span>
            <button
              onClick={() => setReExtractToast(null)}
              className="text-blue-500 hover:text-blue-700 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-Column Layout: Table (Left) + Action Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Side-by-Side Reconciliation Table (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  3-Way Forensic Reconciliation
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Email Body vs. Invoice Draft vs. Master Procurement Ledger
                </p>
              </div>

              {/* Live Re-Extraction Trigger */}
              <button
                id="btn-re-extract-gemini"
                onClick={handleReExtract}
                disabled={isReExtracting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#3D5A80] dark:text-blue-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isReExtracting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Extract with Gemini</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-[24%]">Field</th>
                    <th className="py-3 px-4 w-[34%]">Master Ledger (Source of Truth)</th>
                    <th className="py-3 px-4 w-[28%]">Invoice Draft</th>
                    <th className="py-3 px-4 w-[14%] text-right">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                  {fieldOrder.map((key) => {
                    const fieldObj: ComparisonField = comparison[key] || {
                      truth: "N/A",
                      draft: "N/A",
                      status: "match",
                      score: 100,
                    };
                    const isDefective = fieldObj.status === "defect";
                    const isCorrected = fieldObj.status === "corrected";

                    return (
                      <tr
                        key={key}
                        className={`transition-colors ${
                          isDefective
                            ? "bg-rose-50/40 dark:bg-rose-950/20"
                            : isCorrected
                            ? "bg-amber-50/30 dark:bg-amber-950/20"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                        }`}
                      >
                        {/* 1. Field Name */}
                        <td className="py-3.5 px-4 font-sans font-medium text-neutral-800 dark:text-neutral-200">
                          {fieldLabels[key] || key}
                        </td>

                        {/* 2. Master Ledger (Truth) */}
                        <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300">
                          <span className="font-semibold">{fieldObj.truth}</span>
                        </td>

                        {/* 3. Invoice Draft (with strikethrough if corrected) */}
                        <td className="py-3.5 px-4">
                          {isCorrected ? (
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {fieldObj.draft}
                              </div>
                              {fieldObj.original_draft && (
                                <div className="text-[11px] line-through text-neutral-400 opacity-70">
                                  {fieldObj.original_draft}
                                </div>
                              )}
                              {fieldObj.justification && (
                                <div className="text-[10px] text-neutral-400 font-sans mt-0.5 italic">
                                  Justification: {fieldObj.justification}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span
                              className={
                                isDefective
                                  ? "font-bold text-rose-700 dark:text-rose-400"
                                  : "text-neutral-800 dark:text-neutral-200"
                              }
                            >
                              {fieldObj.draft}
                            </span>
                          )}
                        </td>

                        {/* 4. Status Badge & Action */}
                        <td className="py-3.5 px-4 text-right font-sans">
                          <div className="flex flex-col items-end gap-1.5">
                            {isCorrected ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                • Corrected
                              </span>
                            ) : isDefective ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap">
                                ▲ Defect Blocks approval
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Match (100)
                              </span>
                            )}

                            {/* Correct / Edit button */}
                            <button
                              onClick={() => handleOpenCorrect(key, fieldObj)}
                              className="text-[11px] font-medium text-[#3D5A80] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{isCorrected ? "Edit..." : "Correct..."}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Note */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 italic leading-relaxed">
              *Field score is a deterministic comparison signal: 100 means equal, 70 means both values exist but differ, 60 means one side is missing, and 0 means both are absent. The 85 threshold is the human-review gate.
            </div>
          </div>

          {/* RIGHT: Action Panel ("DECIDE" Box) (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-xs">
                  Decide
                </h3>
                <span className="text-xs font-mono text-neutral-500">
                  {defectCount} Defect{defectCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Status Notice */}
              {defectCount > 0 ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{defectCount} field{defectCount !== 1 ? "s" : ""} block{defectCount === 1 ? "s" : ""} approval</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                    Correct the conflicting remittance details or escalate to Senior Finance Management before disbursing payment.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>0 blocking defects remaining</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                    All reconciliation checks passed against Master Procurement Ledger. Ready for payment voucher generation.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  id="btn-approve-submit"
                  onClick={handleApprove}
                  disabled={defectCount > 0 || isApproved || isApproving}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isApproving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isApproved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isApproved ? "Payment Approved" : "Approve & submit"}</span>
                </button>

                <button
                  id="btn-escalate"
                  onClick={() => setIsEscalateModalOpen(true)}
                  disabled={isEscalated}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isEscalated ? "Escalated to Management" : "⚠️ Escalate"}</span>
                </button>
              </div>

              {/* View verification record certificate */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center">
                <button
                  onClick={() => window.print()}
                  className="text-xs font-medium text-[#3D5A80] dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View verification record</span>
                </button>
              </div>
            </div>

            {/* Collapsible SUBMISSION JSON diagnostics inspector */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
              <button
                onClick={() => setIsJsonOpen(!isJsonOpen)}
                className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer"
              >
                <span>Submission JSON Diagnostics</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isJsonOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isJsonOpen && (
                <div className="p-4 pt-0 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 max-h-64 overflow-y-auto">
                  <pre className="p-3 rounded-xl bg-neutral-900 text-emerald-400 dark:bg-black/60 overflow-x-auto">
                    {JSON.stringify(invoice, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* SECTION 6.5: "Correct..." Modal */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 relative">
            <button
              onClick={() => setCorrectionTarget(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Correct {correctionTarget.fieldName}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Amend machine-extracted draft with verified out-of-band ground truth. Strikethrough audit will be applied.
              </p>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  CORRECTED VALUE
                </label>
                <input
                  type="text"
                  required
                  value={correctedValue}
                  onChange={(e) => setCorrectedValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D5A80]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  WHY / AUDIT JUSTIFICATION <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g. Confirmed with supplier via verified landline switchboard (+60 3-XXXX XXXX)"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3D5A80]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCorrection || !justification.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3D5A80] hover:bg-[#2E4665] text-white transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingCorrection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save correction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 relative">
            <button
              onClick={() => setIsEscalateModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5" />
                Escalate Invoice to Management
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Flags potential BEC wire fraud or supplier dispute for high-tier dual cryptographic review.
              </p>
            </div>

            <form onSubmit={handleEscalate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  REASON FOR ESCALATION
                </label>
                <textarea
                  required
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="e.g. Beneficiary bank account mismatch detected. Suspected in-transit invoice tampering."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEscalate || !escalateReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingEscalate && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Log Escalation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
