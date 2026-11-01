import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, RefreshCw, X, AlertOctagon } from "lucide-react";

interface SecurityActionBarProps {
  invoiceId: string;
  vendorName: string;
  isApproved?: boolean;
  isEscalated?: boolean;
  canExtractLive?: boolean;
  onApprove: () => Promise<void>;
  onEscalate: (reason: string) => Promise<void>;
  onReExtract?: () => Promise<void>;
  isProcessing?: boolean;
  className?: string;
}

export function SecurityActionBar({
  invoiceId,
  vendorName,
  isApproved = false,
  isEscalated = false,
  canExtractLive = true,
  onApprove,
  onEscalate,
  onReExtract,
  isProcessing = false,
  className = "",
}: SecurityActionBarProps) {
  const [modalMode, setModalMode] = useState<"approve" | "block" | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleConfirmApprove = async () => {
    setSubmitting(true);
    setFeedbackMessage(null);
    try {
      await onApprove();
      setFeedbackMessage({
        type: "success",
        text: `Transaction voucher for ${vendorName} approved successfully.`,
      });
      setModalMode(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!blockReason.trim()) return;
    setSubmitting(true);
    setFeedbackMessage(null);
    try {
      await onEscalate(blockReason);
      setFeedbackMessage({
        type: "success",
        text: `Incident reported and payment blocked for ${vendorName}.`,
      });
      setModalMode(null);
      setBlockReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Escalation failed";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Feedback Banner if any */}
      {feedbackMessage && (
        <div
          role="alert"
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="card-surface p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="label">SECURITY ACTIONS:</span>
          {isApproved ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Approved &amp; Voucher Released
            </span>
          ) : isEscalated ? (
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertOctagon size={14} /> Escalated to Senior AP Lead
            </span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Select verification decision for invoice <span className="num font-semibold">{invoiceId}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action 1: Re-extract with Gemini Multimodal */}
          {onReExtract && (
            <button
              type="button"
              disabled={isProcessing || !canExtractLive}
              onClick={onReExtract}
              className="btn-action bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="Trigger real-time multimodal re-extraction with Gemini API"
            >
              <RefreshCw size={13} className={isProcessing ? "animate-spin" : ""} />
              <span>Human Re-verification</span>
            </button>
          )}

          {/* Action 2: Block & Report (Escalate) */}
          <button
            type="button"
            disabled={isProcessing || isEscalated}
            onClick={() => setModalMode("block")}
            className="btn-action bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 dark:border-rose-800 shadow-2xs"
          >
            <ShieldAlert size={13} />
            <span>Block &amp; Report</span>
          </button>

          {/* Action 3: Whitelist Vendor / Approve Payment */}
          <button
            type="button"
            disabled={isProcessing || isApproved}
            onClick={() => setModalMode("approve")}
            className="btn-action bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs"
          >
            <CheckCircle2 size={13} />
            <span>Approve &amp; Release Voucher</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Block & Report */}
      {modalMode === "block" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertOctagon size={20} />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Confirm Block &amp; Escalation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You are about to place a commercial stop-payment order on invoice{" "}
              <strong className="num text-slate-900 dark:text-white">{invoiceId}</strong> for{" "}
              <strong>{vendorName}</strong> and log an incident to the AP audit ledger.
            </p>

            <div className="mt-4">
              <label className="label block mb-1.5">
                Escalation Justification / Forensics Findings:
              </label>
              <textarea
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Bank account mismatch with Maybank Master Ledger; potential BEC impersonation."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !blockReason.trim()}
                onClick={handleConfirmBlock}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting && <RefreshCw size={12} className="animate-spin" />}
                Confirm Stop Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Approve Payment */}
      {modalMode === "approve" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={20} />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Confirm Payment Voucher Release
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Verify that you have cross-checked vendor banking details against the Master Procurement
              Ledger. Releasing this payment will sign the 4-eyes authorization voucher for{" "}
              <strong>{vendorName}</strong>.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Audit Trail Guarantee:</span> This action will be cryptographically logged with your operator ID in the compliance ledger.
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmApprove}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting && <RefreshCw size={12} className="animate-spin" />}
                Confirm &amp; Sign Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SecurityActionBar;
