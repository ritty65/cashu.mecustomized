export function toSec(v: number | string | Date | null | undefined): number | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return Math.floor(v.getTime() / 1000);
  if (typeof v === 'number') return v > 2_000_000_000 ? Math.floor(v / 1000) : Math.floor(v);
  const n = Number(v);
  if (!Number.isNaN(n)) return n > 2_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
  const d = Date.parse(String(v));
  return Number.isNaN(d) ? undefined : Math.floor(d / 1000);
}
