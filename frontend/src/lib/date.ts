/**
 * Malaysian Standard Time (MYT / UTC+8) Date Formatting Utilities
 * Standardizes timestamp display across Audit Trail, Case Cockpit, and Evidence views.
 */

/**
 * Format any ISO 8601, UTC, or standard date string into Malaysian Standard Time (MYT / UTC+8).
 * Target Format: YYYY-MM-DD HH:mm:ss MYT
 * Example: 2026-11-01 12:58:00 MYT instead of 2026-11-01 04:58:00 UTC
 */
export function formatMYT(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    let clean = dateStr.trim();
    if (clean.endsWith("MYT")) {
      return clean;
    }
    // Handle "2026-11-01 04:58:00 UTC" or "Nov 01, 2026, 02:50 AM UTC"
    if (clean.endsWith("UTC")) {
      clean = clean.replace(/\s+UTC$/, " GMT");
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) {
      return dateStr;
    }

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);

    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const yyyy = get("year");
    const mm = get("month");
    const dd = get("day");
    const hh = get("hour");
    const min = get("minute");
    const ss = get("second");

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} MYT`;
  } catch {
    return dateStr;
  }
}

/**
 * Format received date strings into readable Malaysian Standard Time (e.g., Nov 01, 2026, 10:50 AM MYT)
 */
export function formatReceivedMYT(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    let clean = dateStr.trim();
    if (clean.endsWith("MYT")) return clean;
    if (clean.endsWith("UTC")) {
      clean = clean.replace(/\s+UTC$/, " GMT");
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) return dateStr;

    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);

    return `${formatted} MYT`;
  } catch {
    return dateStr;
  }
}
