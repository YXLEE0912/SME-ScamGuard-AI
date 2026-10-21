"use client";

import React, { memo } from "react";
import { ChevronRight, Paperclip, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DemoInvoice } from "@/services/api";

interface QueueTableProps {
  invoices: DemoInvoice[];
  selectedInvoiceId?: string | null;
  onSelectInvoice: (invoice: DemoInvoice) => void;
  isLoading?: boolean;
}

// Memoized Table Row component using React.memo to prevent re-rendering all rows on selection change
interface InvoiceRowProps {
  invoice: DemoInvoice;
  isSelected: boolean;
  onSelect: (invoice: DemoInvoice) => void;
}

const InvoiceRow = memo(function InvoiceRow({
  invoice,
  isSelected,
  onSelect,
}: InvoiceRowProps) {
  const isDefect =
    invoice.status === "LOCKED_CRITICAL" || invoice.status === "DEFECT";
  const isReview = invoice.status === "NEEDS_REVIEW";
  const isVerified = invoice.status === "VERIFIED";

  return (
    <tr
      onClick={() => onSelect(invoice)}
      className={`hover:bg-neutral-50 transition-colors cursor-pointer group ${
        isSelected ? "bg-blue-50/60" : ""
      }`}
    >
      {/* 1. Invoice / Email Subject & Metadata */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="font-semibold text-neutral-900 group-hover:text-[#3D5A80] transition-colors flex items-center gap-1.5">
          {isDefect && (
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 animate-ping" />
          )}
          <span className="truncate max-w-md">{invoice.subject}</span>
          {invoice.flags?.includes("CONSUMER_PDF_TOOL_BENIGN") && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Canva Benign
            </span>
          )}
          {isDefect && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
              BEC Alert
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
          <span className="font-semibold text-neutral-600">{invoice.id}</span>
          <span>•</span>
          <span>{invoice.received_date}</span>
          {invoice.files && invoice.files.length > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-neutral-500">
                <Paperclip className="w-3 h-3 text-neutral-400" />
                {invoice.files[0]}
              </span>
            </>
          )}
        </div>
      </td>

      {/* 2. Sender */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="font-medium text-neutral-800">{invoice.sender_name}</div>
        <div className="text-[11px] text-neutral-400 font-mono">{invoice.sender_email}</div>
      </td>

      {/* 3. Category */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
            isDefect
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {invoice.category}
        </span>
      </td>

      {/* 4. Status Tag */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {isVerified && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            VERIFIED
          </span>
        )}
        {isReview && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            NEEDS REVIEW
          </span>
        )}
        {isDefect && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            LOCKED_CRITICAL
          </span>
        )}
      </td>

      {/* 5. Risk Score */}
      <td className="py-3.5 px-4 whitespace-nowrap text-center">
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
            invoice.risk_score >= 80
              ? "bg-rose-100 text-rose-800 border border-rose-200"
              : invoice.risk_score >= 50
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          {invoice.risk_score}%
        </span>
      </td>

      {/* 6. Quick Action Trigger */}
      <td className="py-3.5 px-4 whitespace-nowrap text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(invoice);
          }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100 text-neutral-400 group-hover:text-[#3D5A80] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

export default function QueueTable({
  invoices,
  selectedInvoiceId,
  onSelectInvoice,
  isLoading = false,
}: QueueTableProps) {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <table className="w-full min-w-[720px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 whitespace-nowrap">Invoice / Email</th>
              <th className="py-3 px-4 whitespace-nowrap">Sender</th>
              <th className="py-3 px-4 whitespace-nowrap">Category</th>
              <th className="py-3 px-4 whitespace-nowrap">Status</th>
              <th className="py-3 px-4 whitespace-nowrap text-center">Risk / Score</th>
              <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={`skel-${i}`} className="animate-pulse">
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="h-4 bg-neutral-200 rounded w-48 mb-1" />
                  <div className="h-3 bg-neutral-100 rounded w-24" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="h-3.5 bg-neutral-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-neutral-100 rounded w-20" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="h-5 bg-neutral-100 rounded-md w-16" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="h-5 bg-neutral-100 rounded-full w-20" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                  <div className="h-5 bg-neutral-100 rounded-full w-10 mx-auto" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="h-4 bg-neutral-100 rounded w-6 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="w-full rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-400">
        No invoices found matching current filter or search criteria.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
      <table className="w-full min-w-[720px] text-left text-xs border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-3 px-4 whitespace-nowrap">Invoice / Email</th>
            <th className="py-3 px-4 whitespace-nowrap">Sender</th>
            <th className="py-3 px-4 whitespace-nowrap">Category</th>
            <th className="py-3 px-4 whitespace-nowrap">Status</th>
            <th className="py-3 px-4 whitespace-nowrap text-center">Risk / Score</th>
            <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {invoices.map((inv) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              isSelected={inv.id === selectedInvoiceId}
              onSelect={onSelectInvoice}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
