/**
 * Character-level diff utility for financial identifiers (bank accounts, IBANs, amounts)
 * Computes the start and end indices of the differing segment between string a (truth) and string b (draft/inbound).
 */
export function diffSpan(a: string, b: string): [number, number] | null {
  if (!a || !b) return null;
  if (a === b) return null;

  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) {
    s++;
  }

  let e = 0;
  while (
    e < a.length - s &&
    e < b.length - s &&
    a[a.length - 1 - e] === b[b.length - 1 - e]
  ) {
    e++;
  }

  return [s, b.length - e];
}

/**
 * Format currency in Malaysian Ringgit (MYR) with standard financial tabular spacing
 */
export function formatMYR(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const formatMyr = formatMYR;
