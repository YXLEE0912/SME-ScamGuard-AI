"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Phone,
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { DemoInvoice, ComparisonField } from "@/services/api";

interface InvoiceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: DemoInvoice | null;
  onApprove?: (id: string) => void;
  onEscalate?: (id: string, reason: string) => void;
}

export default function InvoiceDetailDrawer({
  isOpen,
  onClose,
  invoice,
  onApprove,
  onEscalate,
}: InvoiceDetailDrawerProps) {
  // Lazy-load PDF preview state: deferred 150ms to keep drawer slide-out at 60fps
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [clerkCallbackSigned, setClerkCallbackSigned] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      setIsPdfReady(false);
      setClerkCallbackSigned(false);
      const timer = setTimeout(() => {
        setIsPdfReady(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const comparison = invoice.comparison || {};
  const isLocked = invoice.status === "LOCKED_CRITICAL" || invoice.status === "DEFECT";
  const isVerified = invoice.status === "VERIFIED";
  const registeredLandline =
    comparison.landline?.truth || comparison.landline?.draft || "+60 3-7967 6300";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Lightweight hardware-accelerated backdrop: bg-black/30 without heavy blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 transition-opacity duration-150"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-neutral-200 flex flex-col transform transition-transform duration-150 ease-out translate-x-0">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  invoice.risk_score >= 80
                    ? "bg-rose-100 text-rose-800"
                    : invoice.risk_score >= 50
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                R: {invoice.risk_score}%
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-neutral-900 truncate">
                  {invoice.subject}
                </h3>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  ID: {invoice.id} • {invoice.sender_email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Scroll */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-neutral-800">
            {/* Banner Notice */}
            {invoice.banner_message && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  isLocked
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                {isLocked ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs leading-relaxed">{invoice.banner_message}</div>
              </div>
            )}

            {/* Reconciliation 3-Way Match Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-500">
                  3-Way Reconciliation Parity
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Draft vs. Master Ledger
                </span>
              </div>

              <div className="rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                {Object.entries(comparison).map(([key, field]) => {
                  const isMatch = field.status === "match";
                  const labelMap: Record<string, string> = {
                    vendor_name: "Vendor Name",
                    bank_name: "Beneficiary Bank",
                    account_no: "Account Number",
                    landline: "Switchboard Landline",
                    amount: "Invoiced Total",
                    po_number: "PO / Reference",
                  };
                  return (
                    <div
                      key={key}
                      className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="w-36 font-semibold text-neutral-700">
                        {labelMap[key] || key}
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase font-sans">
                            Claimed Draft
                          </span>
                          <span
                            className={
                              isMatch ? "text-neutral-800" : "text-rose-700 font-bold"
                            }
                          >
                            {field.draft || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase font-sans">
                            Master Ledger
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            {field.truth || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isMatch ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            MATCH
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            DEFECT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4-Eyes Dual Authorization Checklist (for R >= 80 or LOCKED) */}
            {isLocked && (
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-neutral-900">
                    <Lock className="w-4 h-4 text-[#3D5A80]" />
                    <span>4-Eyes Dual Authorization Protocol</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    SEC-44 INTERDICTED
                  </span>
                </div>

                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Discrepancy detected against master procurement record. Requires verbal
                  reconfirmation via officially registered corporate switchboard before release.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCallbackModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#3D5A80] hover:bg-[#2E4665] text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>
                      {clerkCallbackSigned
                        ? "Verified: " + registeredLandline
                        : "Call Supplier Switchboard (" + registeredLandline + ")"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDossierModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium text-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#3D5A80]" />
                    <span>Export NSRC 997 Incident Dossier</span>
                  </button>
                </div>
              </div>
            )}

            {/* Lazy-Loaded PDF Preview Panel (150ms deferred for instant 0ms drawer open) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-500">
                  Document Artifact Preview
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {invoice.producerTool || "PDF Engine Analysis"}
                </span>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-100 h-44 flex items-center justify-center overflow-hidden relative">
                {!isPdfReady ? (
                  <div className="flex flex-col items-center gap-2 text-neutral-400 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-neutral-200" />
                    <span className="text-[11px]">Initializing document renderer...</span>
                  </div>
                ) : (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-neutral-50 font-mono text-[11px] text-neutral-700 overflow-y-auto">
                    <div className="space-y-1">
                      <div className="font-bold text-neutral-900 flex items-center justify-between">
                        <span>ATTACHED INVOICE: {invoice.files?.[0] || "invoice_document.pdf"}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200">
                          {invoice.producerTool || "PDF 1.4"}
                        </span>
                      </div>
                      <div className="text-neutral-500">
                        SHA-256 Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-neutral-200 space-y-1">
                      <div>
                        <strong>Claimed Beneficiary:</strong> {comparison.bank_name?.draft || "—"} / {comparison.account_no?.draft || "—"}
                      </div>
                      <div>
                        <strong>Invoiced Amount:</strong> {comparison.amount?.draft || "RM 0.00"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {isLocked ? (
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Escalate to Management
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onApprove) onApprove(invoice.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Approve for Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Eyes Switchboard Callback Modal */}
      {isCallbackModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCallbackModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-neutral-900 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#3D5A80]" />
              Vendor Switchboard Callback
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Verify banking changes with registered finance controller at{" "}
              <strong>{registeredLandline}</strong>.
            </p>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono space-y-1 mb-4">
              <div>Vendor: {comparison.vendor_name?.truth}</div>
              <div>Switchboard: {registeredLandline}</div>
              <div>Master Ledger Acc: {comparison.account_no?.truth}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCallbackModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setClerkCallbackSigned(true);
                  setIsCallbackModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#3D5A80] hover:bg-[#2E4665] text-white text-xs font-semibold"
              >
                Confirm Verbal Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NSRC 997 Incident Dossier Modal */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                PDRM CCID / NSRC 997 Incident Dossier
              </h3>
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-neutral-50 rounded-xl border border-neutral-200 my-4 space-y-2 text-neutral-800 leading-relaxed">
              <div className="font-bold text-rose-700">PDRM CCID & NSRC 997 STATUTORY INCIDENT DOSSIER</div>
              <div>Statutes: AMLA 2001 Sec 44 • Evidence Act 1950 Sec 90A</div>
              <div>Case Ref: {invoice.id}</div>
              <div>Target Account: {comparison.bank_name?.draft} / {comparison.account_no?.draft}</div>
              <div>Master Ledger Acc: {comparison.bank_name?.truth} / {comparison.account_no?.truth}</div>
              <div>Registered Switchboard: {registeredLandline}</div>
              <div className="text-amber-800 pt-1">
                Relief Requested: Immediate emergency freezing order under AMLA 2001 Section 44.
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`PDRM CCID DOSSIER - Case ${invoice.id} - Target Account: ${comparison.account_no?.draft}`);
                  setCopiedDossier(true);
                  setTimeout(() => setCopiedDossier(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 flex items-center gap-1.5"
              >
                {copiedDossier ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#3D5A80]" />}
                <span>{copiedDossier ? "Copied" : "Copy Dossier"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#3D5A80] hover:bg-[#2E4665] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsEscalateModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-rose-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Escalate to Senior Management
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Flags potential BEC wire fraud or supplier dispute for high-tier dual cryptographic review.
            </p>
            <textarea
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="e.g. Beneficiary bank mismatch detected. Diverted account flagged in threat cache."
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onEscalate) onEscalate(invoice.id, escalateReason);
                  setIsEscalateModalOpen(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Log Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
