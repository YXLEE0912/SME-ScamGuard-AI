"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import staticMailbox from "@/data/demo_mailbox.json";
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
  threatCategory: string;
  status: "VERIFIED" | "NEEDS_REVIEW" | "DEFECT" | "RESOLVED";
  reasoning: string;
  files: string[];
  comparison: Record<string, ComparisonFieldData>;
}

const TOTAL_CASES = (staticMailbox as DemoInvoice[]).length || 50;

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params?.id as string) || "";

  const [invoice, setInvoice] = useState<UnifiedCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  // 4-Eyes Dual Authorization state
  const [clerkSigned, setClerkSigned] = useState(false);
  const [managerSigned, setManagerSigned] = useState(false);
  const [voucherReleased, setVoucherReleased] = useState(false);

  // Compute pagination index (0-indexed)
  const numMatch = caseId.match(/\d+/);
  const rawNum = numMatch ? parseInt(numMatch[0], 10) : 1;
  const currentIndex = Math.max(0, Math.min(TOTAL_CASES - 1, rawNum - 1));

  const goToCase = (index: number) => {
    const targetNum = index + 1;
    const targetId = `email_${String(targetNum).padStart(3, "0")}`;
    router.push(`/case/${targetId}`);
  };

  useEffect(() => {
    async function loadRecord() {
      setIsLoading(true);
      const normalized = caseId.startsWith("email_") ? caseId.replace("email_", "inv_") : caseId;
      try {
        let live = await fetchInvoiceById(caseId);
        if (!live && normalized !== caseId) {
          live = await fetchInvoiceById(normalized);
        }
        if (live) {
          adaptDemoInvoice(live);
        } else {
          fallbackStatic(caseId);
        }
      } catch {
        fallbackStatic(caseId);
      } finally {
        setIsLoading(false);
      }
    }

    function adaptDemoInvoice(raw: DemoInvoice) {
      const isDefect = raw.status === "DEFECT" || raw.status === "LOCKED_CRITICAL" || raw.risk_score >= 80;
      const isReview = raw.status === "NEEDS_REVIEW" || (raw.risk_score > 20 && raw.risk_score < 80);

      const rawAmt = raw.comparison?.amount?.draft || "18500";
      const parsedAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, "")) || 18500;
      const comp = (raw.comparison || {}) as Record<string, ComparisonFieldData>;

      const files = raw.files && raw.files.length > 0
        ? raw.files
        : [`${raw.id}_invoice.pdf`, "vendor_remittance.pdf"];

      const rawNum = raw.id.match(/\d+/)?.[0] || "001";
      const emailId = raw.id.startsWith("email_") ? raw.id : `email_${rawNum.padStart(3, "0")}`;

      const rawWithBody = raw as DemoInvoice & { email_body?: string };
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
        producerTool: isDefect ? "iLovePDF Spliced (Binary Desync)" : "AutoCount ERP / Acrobat Pro",
        riskScore: raw.risk_score,
        certaintyConfidence: isDefect ? 98 : 96,
        threatCategory: raw.category || (isDefect ? "BEC Wire Scam" : "Routine Billing"),
        status: isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED",
        reasoning: raw.banner_message || (isDefect
          ? "Discrepancy Trap: Inbound payment remittance details contradict Master Procurement Ledger baseline."
          : "All verified fields match the Master Procurement Ledger with 100% confidence."),
        files,
        comparison: comp,
      });
    }

    function fallbackStatic(id: string) {
      const normalized = id.startsWith("email_") ? id.replace("email_", "inv_") : id;
      const numMatch = id.match(/\d+/);
      const numStr = numMatch ? String(parseInt(numMatch[0], 10)).padStart(3, "0") : "001";
      const targetInvId = `inv_${numStr}`;

      const match = (staticMailbox as DemoInvoice[]).find(
        (x) => x.id === id || x.id === normalized || x.id === targetInvId || id === x.id.replace("inv_", "email_")
      );
      if (match) {
        adaptDemoInvoice(match);
      } else {
        // High-priority BEC benchmark case
        adaptDemoInvoice({
          id: id || "email_001",
          sender_name: "Mega Logistics Sdn Bhd",
          sender_email: "billing@mega-bu1ld.com.my",
          subject: "REQUEST REVISED BANKING REMITTANCE DETAILS - INV-2026-8841",
          category: "BEC Wire Scam",
          status: "DEFECT",
          risk_score: 99,
          received_date: "Today at 09:42 AM",
          files: ["email_001_invoice.pdf", "vendor_remittance.pdf"],
          comparison: {
            vendor_name: { truth: "Mega Logistics Sdn Bhd", draft: "Mega Logistics Sdn Bhd", status: "match", score: 100 },
            bank_name: { truth: "Maybank", draft: "CIMB Bank", status: "defect", score: 70 },
            account_no: { truth: "514012998877", draft: "8009-4411-2299", status: "defect", score: 70 },
            landline: { truth: "+60 3-7722 8888", draft: "+60 11-2345 6789", status: "defect", score: 70 },
            amount: { truth: "Baseline Verified", draft: "RM 98,500.00", status: "match", score: 100 },
            po_number: { truth: "PO-ML-8841", draft: "PO-OVERRIDE", status: "defect", score: 70 },
          },
          banner_message: "Discrepancy Trap: Inbound payment remittance details contradict Master Procurement Ledger baseline.",
        } as unknown as DemoInvoice);
      }
    }

    loadRecord();
  }, [caseId]);

  const handleHoldWire = async (reason: string) => {
    if (!invoice) return;
    try {
      await escalateInvoice(invoice.id, reason || "Unauthorized bank account detected. Wire transfer frozen.");
      setClerkSigned(true);
    } catch {
      setClerkSigned(true);
    }
  };

  const handleReleasePayment = async () => {
    if (!invoice) return;
    try {
      await approveInvoice(invoice.id, "Clerk & Controller dual 4-Eyes sign-off completed.");
      setClerkSigned(true);
      setManagerSigned(true);
      setVoucherReleased(true);
    } catch {
      setClerkSigned(true);
      setManagerSigned(true);
      setVoucherReleased(true);
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
      threat_category: invoice.threatCategory,
      risk_score: invoice.riskScore,
      model_confidence: `${invoice.certaintyConfidence}%`,
      amount_myr: invoice.amountMyr,
      producer_tool: invoice.producerTool,
      audit_source: "Master Procurement Ledger Parity Engine",
      sha256_fingerprint: "8f4a13b9c7028e1d5e6a9928f01b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    };
  }, [invoice]);

  if (isLoading || !invoice) {
    return (
      <div className="p-12 text-center text-xs text-[var(--ink-3)] font-mono">
        Loading forensic verification dossier...
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
                <span className="pill text-[11px] py-0.5 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1f4b8e]" />
                  <span>{invoice.threatCategory}</span>
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
            clerkSigned={clerkSigned}
            managerSigned={managerSigned}
            voucherReleased={voucherReleased}
          />
        </div>

        {/* Right Column (~28% width, sticky) */}
        <div className="w-full lg:w-[28%] lg:sticky lg:top-4 self-start space-y-4 shrink-0">
          {/* Task 5: DECIDE Actions Card */}
          <div className="bg-white dark:bg-[#11131a] rounded-xl border border-slate-200/80 dark:border-white/10 p-4 space-y-3.5 shadow-[0_1px_3px_rgba(15,18,37,0.04)]">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-1">
                DECIDE
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                {invoice.status === "DEFECT"
                  ? "Defect flags exceed threshold. Dual authorization required to release or immediate freeze recommended."
                  : invoice.status === "NEEDS_REVIEW"
                    ? "Confidence warning. Operator review required before releasing payment voucher."
                    : "High confidence straight-through match. Ready for final payment authorization."}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleReleasePayment}
                disabled={voucherReleased}
                className="w-full bg-[#0f1225] text-white hover:bg-[#1f4b8e] transition-colors font-medium py-2.5 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{voucherReleased ? "Payment Authorized" : "Approve & Authorize Payment"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleHoldWire("Unauthorized bank account desync flagged.")}
                className="w-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/60 hover:bg-amber-100/60 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flag size={14} />
                <span>Escalate / Freeze Wire</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Clerk Sign-off:</span>
                <span className={`font-mono font-medium ${clerkSigned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                  {clerkSigned ? "Signed (Alex Tan)" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Manager Approval:</span>
                <span className={`font-mono font-medium ${managerSigned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                  {managerSigned ? "Signed (Controller)" : "Pending"}
                </span>
              </div>
            </div>
          </div>

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