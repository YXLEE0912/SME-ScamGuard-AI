import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck, Lock } from "lucide-react";

export type ThreatSeverityStatus =
  | "SAFE"
  | "VERIFIED"
  | "OK"
  | "RESOLVED"
  | "SUSPICIOUS"
  | "WARNING"
  | "NEEDS_REVIEW"
  | "CRITICAL_SCAM"
  | "DEFECT"
  | "LOCKED_CRITICAL"
  | "THREAT";

interface ThreatSeverityBadgeProps {
  status: ThreatSeverityStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function ThreatSeverityBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: ThreatSeverityBadgeProps) {
  const norm = (status || "").toUpperCase();

  const isSafe =
    norm === "SAFE" || norm === "VERIFIED" || norm === "OK" || norm === "RESOLVED";
  const isSuspicious =
    norm === "SUSPICIOUS" || norm === "WARNING" || norm === "NEEDS_REVIEW";
  const isCritical =
    norm === "CRITICAL_SCAM" ||
    norm === "DEFECT" ||
    norm === "LOCKED_CRITICAL" ||
    norm === "THREAT";

  let bgClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let dotClass = "bg-slate-400";
  let label = status;
  let IconComponent = ShieldCheck;

  if (isSafe) {
    bgClass =
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80";
    dotClass = "bg-emerald-500";
    label = norm === "RESOLVED" ? "RESOLVED" : "VERIFIED";
    IconComponent = CheckCircle2;
  } else if (isSuspicious) {
    bgClass =
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80";
    dotClass = "bg-amber-500";
    label = "NEEDS REVIEW";
    IconComponent = AlertTriangle;
  } else if (isCritical) {
    bgClass =
      "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80";
    dotClass = "bg-rose-600 animate-pulse";
    label = norm === "LOCKED_CRITICAL" ? "LOCKED CRITICAL" : norm === "DEFECT" ? "DEFECT DETECTED" : "CRITICAL SCAM";
    IconComponent = norm === "LOCKED_CRITICAL" ? Lock : AlertOctagon;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  };

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border transition-colors select-none ${sizeClasses[size]} ${bgClass} ${className}`}
      title={`Security Classification: ${label}`}
    >
      {showIcon ? (
        <IconComponent size={iconSizes[size]} className="shrink-0" aria-hidden />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}
export default ThreatSeverityBadge;

