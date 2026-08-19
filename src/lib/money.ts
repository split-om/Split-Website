/** Amounts are stored as integer baisa. 1 OMR = 1000 baisa. */

export function omrToBaisa(omr: number): number {
  return Math.round(omr * 1000);
}

export function formatOMR(baisa: number): string {
  const sign = baisa < 0 ? "-" : "";
  const abs = Math.abs(Math.round(baisa));
  const whole = Math.floor(abs / 1000);
  const frac = String(abs % 1000).padStart(3, "0");
  return `${sign}${whole}.${frac}`;
}

export function formatOMRLabel(baisa: number): string {
  return `OMR ${formatOMR(baisa)}`;
}

export function parseOMRInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return omrToBaisa(n);
}

export function shareOf(totalBaisa: number, people: number): number {
  if (people < 1) return totalBaisa;
  return Math.round(totalBaisa / people);
}

export function percentOf(baseBaisa: number, pct: number): number {
  return Math.round((baseBaisa * pct) / 100);
}
