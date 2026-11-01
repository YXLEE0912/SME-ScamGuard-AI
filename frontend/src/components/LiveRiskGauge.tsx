import React from "react";
import { HelpCircle, Activity } from "lucide-react";

interface LiveRiskGaugeProps {
  /** Assessed threat risk score from 0 (Safe) to 100 (Critical Threat) */
  riskScore: number;
  /** System model confidence in its assessment from 0 to 100 */
  confidenceScore?: number;
  /** Optional layout compact mode */
  compact?: boolean;
  className?: string;
}

export function LiveRiskGauge({
  riskScore,
  confidenceScore = 96,
  compact = false,
  className = "",
}: LiveRiskGaugeProps) {
  const clampedRisk = Math.min(Math.max(Math.round(riskScore), 0), 100);
  const clampedConfidence = Math.min(Math.max(Math.round(confidenceScore), 0), 100);

  const isModerateRisk = clampedRisk >= 30 && clampedRisk < 75;
  const isHighRisk = clampedRisk >= 75;

  let riskTier = "LOW THREAT";
  let riskColor = "text-emerald-700 dark:text-emerald-400";
  let barColor = "bg-emerald-600";
  let bgBadge = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";

  if (isModerateRisk) {
    riskTier = "SUSPICIOUS / ELEVATED";
    riskColor = "text-amber-700 dark:text-amber-400";
    barColor = "bg-amber-500";
    bgBadge = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
  } else if (isHighRisk) {
    riskTier = "CRITICAL WIRE THREAT";
    riskColor = "text-rose-700 dark:text-rose-400";
    barColor = "bg-rose-600";
    bgBadge = "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${clampedRisk}%` }}
          />
        </div>
        <span className={`num font-bold text-xs ${riskColor}`}>
          {clampedRisk}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={`card-surface rounded-xl p-4 sm:p-5 hairline border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-slate-400" />
          <span className="label">Live Threat Assessment</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bgBadge}`}>
          {riskTier}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100 dark:divide-slate-800">
        {/* Metric 1: Risk Score (Assessed Threat) */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Assessed Threat Risk
            </span>
            <span className={`num text-2xl font-bold tracking-tight ${riskColor}`}>
              {clampedRisk}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-500`}
              style={{ width: `${clampedRisk}%` }}
              role="progressbar"
              aria-valuenow={clampedRisk}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            {isHighRisk
              ? "Critical disparity detected vs Master Ledger & SemakMule."
              : isModerateRisk
              ? "Discrepancies identified requiring secondary human verification."
              : "All extracted invoice parameters match registered vendor ledger."}
          </p>
        </div>

        {/* Metric 2: Model Certainty / Confidence (Distinct from safety!) */}
        <div className="pl-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Model Certainty
              </span>
              <span
                title="Model certainty reflects how confident the AI system is in its extraction and forensic parity calculation. High certainty does not mean a transaction is safe."
                className="cursor-help text-slate-400 hover:text-slate-600"
              >
                <HelpCircle size={12} />
              </span>
            </div>
            <span className="num text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
              {clampedConfidence}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-600 dark:bg-slate-400 transition-all duration-500"
              style={{ width: `${clampedConfidence}%` }}
              role="progressbar"
              aria-valuenow={clampedConfidence}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Gemini Multimodal forensic confidence across OCR, layout, and PDRM SemakMule.
          </p>
        </div>
      </div>
    </div>
  );
}
export default LiveRiskGauge;
