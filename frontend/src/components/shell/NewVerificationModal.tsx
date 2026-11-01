"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, FileText, CheckCircle2 } from "lucide-react";
import { uploadNewVerification } from "@/services/api";

interface NewVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewVerificationModal({ isOpen, onClose }: NewVerificationModalProps) {
  const router = useRouter();
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFile) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    setIsSuccess(false);

    try {
      await uploadNewVerification(primaryFile, supportingFile || undefined);
      setIsSuccess(true);
      setStatusMessage("Invoice successfully ingested into verification queue.");

      // Dispatch event for any active queue listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("scamguard:verification-created"));
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setPrimaryFile(null);
        setSupportingFile(null);
        setStatusMessage(null);
        setIsSuccess(false);
        onClose();
        router.push("/queue");
      }, 900);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Ingestion failed";
      setStatusMessage(`Error: ${msg}`);
      setIsSuccess(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center">
              <UploadCloud size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">Ingest New Verification</h3>
              <p className="text-xs text-[var(--ink-3)]">
                Upload inbound invoice for 3-way forensic verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label block mb-1.5">Primary Invoice File (PDF, PNG, JPG)</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              required
              onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
              className="field w-full pt-1.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white dark:file:bg-slate-100 dark:file:text-slate-900"
            />
          </div>

          <div>
            <label className="label block mb-1.5">
              Supporting Remittance Advice / Email (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.eml,.txt"
              onChange={(e) => setSupportingFile(e.target.files?.[0] || null)}
              className="field w-full pt-1.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white dark:file:bg-slate-200 dark:file:text-slate-900"
            />
          </div>

          {statusMessage && (
            <div
              className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
                isSuccess
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 border border-red-500/20 text-[var(--defect)]"
              }`}
            >
              {isSuccess && <CheckCircle2 size={14} className="shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !primaryFile}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Ingesting & Cross-referencing...</span>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Ingest & Verify</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewVerificationModal;

