import React from "react";
import { Check, AlertOctagon, Pencil } from "lucide-react";
import { diffSpan } from "@/lib/diff";

export interface VerificationFieldComparison {
  fieldKey: string;
  fieldLabel: string;
  truthValue: string; // Master Procurement Ledger / Verified baseline
  claimedValue: string; // Inbound Invoice / Suspicious submission
  isMatch: boolean;
  score?: number;
  anomalyType?: "BANK_ACCOUNT" | "BENEFICIARY" | "AMOUNT" | "PHONE" | "TAMPERED_PDF" | "MULE_BLACKLIST";
  statusText?: string;
  isCorrected?: boolean;
  correctionJustification?: string;
}

interface SplitVerificationCardProps {
  fields: VerificationFieldComparison[];
  vendorName: string;
  onEditField?: (fieldKey: string, fieldLabel: string, currentValue: string) => void;
  className?: string;
}

/**
 * Character-level inline difference highlighter adapting Grabbers' diffSpan
 */
export function CharacterDiff({ a, b }: { a: string; b: string }) {
  if (!b) return <span className="text-slate-400 italic">∅ missing</span>;
  if (!a) return <span>{b}</span>;

  const span = diffSpan(a, b);
  if (!span) return <span>{b}</span>;

  const [s, e] = span;
  return (
    <span>
      {b.slice(0, s)}
      <mark className="rounded-sm bg-rose-100 dark:bg-rose-950/80 px-1 py-0.5 font-bold text-rose-700 dark:text-rose-300 underline decoration-rose-500 decoration-2 underline-offset-2">
        {b.slice(s, e) || "_"}
      </mark>
      {b.slice(e)}
    </span>
  );
}

export function SplitVerificationCard({
  fields,
  vendorName,
  onEditField,
  className = "",
}: SplitVerificationCardProps) {
  const discrepancyCount = fields.filter((f) => !f.isMatch && !f.isCorrected).length;

  return (
    <div
      className={`card-surface rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden ${className}`}
    >
      {/* Header Strip */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="label">Forensic 3-Way Reconciliation</span>
            {discrepancyCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                {discrepancyCount} DISCREPANCIES DETECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                ALL FIELDS VERIFIED
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
            Master Ledger Parity vs Inbound Claim ({vendorName})
          </h3>
        </div>
      </div>

      {/* Structured Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
              <th scope="col" className="label py-3 px-4 pl-5">
                VERIFICATION FIELD
              </th>
              <th scope="col" className="label py-3 px-4">
                MASTER LEDGER · SOURCE OF TRUTH
              </th>
              <th scope="col" className="label py-3 px-4">
                INBOUND CLAIM · SUBMITTED VALUE
              </th>
              <th scope="col" className="label py-3 px-4 pr-5 text-right">
                STATUS &amp; MATCH
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {fields.map((field) => {
              const hasDiff = !field.isMatch && !field.isCorrected;

              return (
                <tr
                  key={field.fieldKey}
                  className={`transition-colors align-top ${
                    hasDiff
                      ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/40"
                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* Field Label */}
                  <th
                    scope="row"
                    className="py-3 px-4 pl-5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap"
                  >
                    {field.fieldLabel}
                  </th>

                  {/* Master Ledger Truth */}
                  <td className="py-3 px-4 num text-slate-700 dark:text-slate-300">
                    {field.truthValue ? (
                      <span className="font-medium">{field.truthValue}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unregistered in Master</span>
                    )}
                  </td>

                  {/* Inbound Claim with Character Diff */}
                  <td className="py-3 px-4 num text-slate-900 dark:text-slate-100">
                    {field.isCorrected ? (
                      <div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {field.claimedValue}
                        </span>
                        {field.correctionJustification && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Corrected: {field.correctionJustification}
                          </div>
                        )}
                      </div>
                    ) : hasDiff ? (
                      <CharacterDiff a={field.truthValue} b={field.claimedValue} />
                    ) : (
                      <span className="font-medium">{field.claimedValue}</span>
                    )}
                  </td>

                  {/* Status & Action */}
                  <td className="py-3 px-4 pr-5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {field.isCorrected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                          <Check size={11} /> Corrected
                        </span>
                      ) : field.isMatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                          <Check size={11} /> Match [100]
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
                          <AlertOctagon size={11} /> Disparity [
                          {field.score !== undefined ? field.score : 0}]
                        </span>
                      )}

                      {onEditField && hasDiff && (
                        <button
                          type="button"
                          onClick={() =>
                            onEditField(
                              field.fieldKey,
                              field.fieldLabel,
                              field.claimedValue
                            )
                          }
                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Override or correct misread field"
                        >
                          <Pencil size={12} />
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
  );
}
export default SplitVerificationCard;
