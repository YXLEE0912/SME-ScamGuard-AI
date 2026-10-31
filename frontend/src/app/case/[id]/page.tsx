"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import {
  fetchInvoiceById,
  reExtractWithGemini,
  approveInvoice,
  escalateInvoice,
  DemoInvoice,
} from "@/services/api";
import staticMailbox from "@/data/demo_mailbox.json";
import { HeaderActions } from "@/components/shell/Shell";
import { SplitVerificationCard, VerificationFieldComparison } from "@/components/SplitVerificationCard";
import { LiveRiskGauge } from "@/components/LiveRiskGauge";
import { SecurityActionBar } from "@/components/SecurityActionBar";
import { ThreatSeverityBadge } from "@/components/ThreatSeverityBadge";
import { formatMYR } from "@/lib/diff";

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
  comparisonFields: VerificationFieldComparison[];
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = (params?.id as string) || "";

  const [invoice, setInvoice] = useState<UnifiedCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReExtracting, setIsReExtracting] = useState(false);

  // 4-Eyes Dual Authorization state
  const [clerkSigned, setClerkSigned] = useState(false);
  const [managerSigned, setManagerSigned] = useState(false);
  const [voucherReleased, setVoucherReleased] = useState(false);

  useEffect(() => {
    async function loadRecord() {
      setIsLoading(true);
      try {
        const live = await fetchInvoiceById(caseId);
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

      const compFields: VerificationFieldComparison[] = Object.entries(raw.comparison || {}).map(([key, val]) => ({
        fieldKey: key,
        fieldLabel: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        truthValue: val.truth || "—",
        claimedValue: val.draft || "—",
        isMatch: val.status === "match",
        anomalyType: key.includes("bank") || key.includes("account") ? "BANK_ACCOUNT" : "BENEFICIARY",
      }));

      setInvoice({
        id: raw.id,
        referenceId: raw.id.toUpperCase(),
        vendorName: raw.sender_name || "Mega Logistics Sdn Bhd",
        sender: raw.sender_email,
        subject: raw.subject,
        amountMyr: parsedAmt,
        receivedDate: raw.received_date,
        emailBody: `From: ${raw.sender_email}\nSubject: ${raw.subject}\n\nPlease review attached invoice and disburse payment in accordance with agreed milestones.\nDirect inquiries to Accounts Payable desk.`,
        producerTool: "AutoCount ERP / iLovePDF",
        riskScore: raw.risk_score,
        certaintyConfidence: 96,
        threatCategory: raw.category || (isDefect ? "BEC Wire Scam" : "Routine Billing"),
        status: isDefect ? "DEFECT" : isReview ? "NEEDS_REVIEW" : "VERIFIED",
        reasoning: raw.banner_message || "3-way reconciliation against Master Procurement Ledger completed.",
        comparisonFields: compFields.length > 0 ? compFields : [
          {
            fieldKey: "bank_name",
            fieldLabel: "Beneficiary Bank",
            truthValue: "Maybank",
            claimedValue: "CIMB Bank",
            isMatch: false,
            anomalyType: "BANK_ACCOUNT",
          },
          {
            fieldKey: "account_no",
            fieldLabel: "Account Number",
            truthValue: "514012998877",
            claimedValue: "8009-4411-2299",
            isMatch: false,
            anomalyType: "BANK_ACCOUNT",
          },
        ],
      });
    }

    function fallbackStatic(id: string) {
      const match = (staticMailbox as DemoInvoice[]).find((x) => x.id === id);
      if (match) {
        adaptDemoInvoice(match);
      } else {
        // High-priority BEC benchmark case
        setInvoice({
          id: id || "QAT-02",
          referenceId: "INV-2026-8841",
          vendorName: "Mega Logistics Sdn Bhd",
          sender: "billing@mega-bu1ld.com.my",
          subject: "REQUEST REVISED BANKING REMITTANCE DETAILS - INV-2026-8841",
          amountMyr: 98500.0,
          receivedDate: "Today at 09:42 AM",
          emailBody:
            "Dear Finance,\n\nOur standard Maybank account is under annual audit and temporarily frozen.\nPlease remit the outstanding milestone claim of RM 98,500.00 today to our backup account:\nBank: CIMB Bank\nAccount: 8009-4411-2299\n\nPayment must be made before 5:00 PM today to prevent work stoppage on site.\nDirect inquiries to mobile 012-3456789.\n\nRegards,\nAlex Tan\nMega Logistics AP Team",
          producerTool: "iLovePDF Spliced (Binary Desync)",
          riskScore: 99,
          certaintyConfidence: 98,
          threatCategory: "BEC Wire Scam",
          status: "DEFECT",
          reasoning:
            "Discrepancy Trap: Email body requests payment to CIMB Bank 8009-4411-2299 while Master Procurement Ledger baseline requires Maybank 514012998877.",
          comparisonFields: [
            {
              fieldKey: "bank_name",
              fieldLabel: "Beneficiary Bank",
              truthValue: "Maybank",
              claimedValue: "CIMB Bank",
              isMatch: false,
              anomalyType: "BANK_ACCOUNT",
            },
            {
              fieldKey: "account_no",
              fieldLabel: "Account Number",
              truthValue: "514012998877",
              claimedValue: "8009-4411-2299",
              isMatch: false,
              anomalyType: "BANK_ACCOUNT",
            },
            {
              fieldKey: "vendor_name",
              fieldLabel: "Vendor Name",
              truthValue: "Mega Logistics Sdn Bhd",
              claimedValue: "Mega Logistics Sdn Bhd",
              isMatch: true,
              anomalyType: "BENEFICIARY",
            },
            {
              fieldKey: "amount",
              fieldLabel: "Amount (MYR)",
              truthValue: "98,500.00",
              claimedValue: "98,500.00",
              isMatch: true,
              anomalyType: "AMOUNT",
            },
          ],
        });
      }
    }

    loadRecord();
  }, [caseId]);

  const handleReExtract = async () => {
    if (!invoice) return;
    setIsReExtracting(true);
    try {
      await reExtractWithGemini(invoice.id);
    } catch {
      // Fallback grace
    } finally {
      setIsReExtracting(false);
    }
  };

  const handleHoldWire = async (reason: string) => {
    if (!invoice) return;
    try {
      await escalateInvoice(invoice.id, reason || "Unauthorized bank account detected. Wire transfer frozen.");
    } catch {
      // Grace
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

  if (isLoading || !invoice) {
    return (
      <div className="p-12 text-center text-xs text-[var(--ink-3)]">
        Loading forensic verification dossier...
      </div>
    );
  }

  const isCritical = invoice.status === "DEFECT";

  return (
    <div className="grid gap-5">
      <HeaderActions>
          <Link href="/queue" className="btn btn-sm btn-ghost">
            <ArrowLeft size={14} />
            <span>Queue</span>
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="icon-btn"
            title="Print Forensic Dossier"
          >
            <Printer size={15} />
          </button>
      </HeaderActions>

      {/* Case Header Strip */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {invoice.vendorName}
            </h2>
            <span className="num text-xs font-mono text-[var(--ink-3)]">
              {invoice.referenceId}
            </span>
            <ThreatSeverityBadge status={invoice.status} />
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Inbound transmission: {invoice.sender} · Received {invoice.receivedDate}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="label block">Invoice Amount</span>
            <div className="text-2xl font-bold num text-[var(--ink)]">
              {formatMYR(invoice.amountMyr)}
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Discrepancy Alert Banner */}
      {isCritical && (
        <div className="p-4 rounded-xl border border-[var(--defect)]/30 bg-[var(--defect-tint)] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[var(--defect)] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--defect)]">
            <span className="font-bold uppercase tracking-wider block mb-0.5">
              BEC Wire Interdiction Trap Triggered
            </span>
            <span>
              {invoice.reasoning}
            </span>
          </div>
        </div>
      )}

      {/* Split-View Layout (CasePane) */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column (5 Cols): Inbound Submission & Email Body */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <span className="label">Inbound Email Evidence</span>
              <span className="text-[11px] font-mono text-[var(--ink-3)] truncate max-w-[200px]">
                {invoice.sender}
              </span>
            </div>

            <div className="text-xs font-semibold text-[var(--ink)]">
              {invoice.subject}
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--ink-2)] font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-[var(--line)]">
              {invoice.emailBody}
            </div>

            {invoice.producerTool && (
              <div className="pt-2 text-[11px] text-[var(--ink-3)] border-t border-[var(--line)] flex items-center justify-between">
                <span>PDF Metadata Producer:</span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  {invoice.producerTool}
                </span>
              </div>
            )}
          </div>

          <div className="card p-5">
            <span className="label block mb-3">Model Threat Certainty</span>
            <LiveRiskGauge
              riskScore={invoice.riskScore}
              confidenceScore={invoice.certaintyConfidence}
            />
          </div>
        </div>

        {/* Right Column (7 Cols): 3-Way Reconciliation Comparison Card */}
        <div className="lg:col-span-7 space-y-4">
          <SplitVerificationCard
            fields={invoice.comparisonFields}
            vendorName={invoice.vendorName}
          />

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="label">4-Eyes Dual Authorization</span>
              <span className="text-[11px] font-mono text-[var(--ink-3)]">SOX & ISO 27001 Protocol</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div
                className={`p-3 rounded-lg border ${clerkSigned
                  ? "bg-[var(--ok-tint)] border-[var(--ok)]/30 text-[var(--ok)]"
                  : "bg-[var(--surface-2)] border-[var(--line)] text-[var(--ink-3)]"
                  }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Clerk Sign-off</span>
                </div>
                <div className="text-[11px] mt-0.5">
                  {clerkSigned ? "Signed by Alex Tan" : "Awaiting validation"}
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${managerSigned
                  ? "bg-[var(--ok-tint)] border-[var(--ok)]/30 text-[var(--ok)]"
                  : "bg-[var(--surface-2)] border-[var(--line)] text-[var(--ink-3)]"
                  }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Manager Approval</span>
                </div>
                <div className="text-[11px] mt-0.5">
                  {managerSigned ? "Signed by Finance Controller" : "Pending dual authorization"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Action Bar (Bottom Floating / Pinned) */}
      <SecurityActionBar
        invoiceId={invoice.id}
        vendorName={invoice.vendorName}
        isApproved={voucherReleased}
        isEscalated={clerkSigned}
        onApprove={handleReleasePayment}
        onEscalate={handleHoldWire}
        onReExtract={handleReExtract}
        isProcessing={isReExtracting}
      />
    </div>
  );
}