/** 139.9 → "139.9" (UK forecourts show pence per litre to one decimal place). */
export function formatPence(pence: number): string {
  return pence.toFixed(1);
}

export function formatPounds(pounds: number): string {
  const sign = pounds < 0 ? '-' : '';
  return `${sign}£${Math.abs(pounds).toFixed(2)}`;
}

export function formatMiles(miles: number): string {
  if (miles < 0.1) return 'Under 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Relative time for a past ISO timestamp: "just now", "12 min ago", "3 h ago", "2 days ago". */
export function timeAgo(iso: string, now: Date): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 'time unknown';
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60_000));
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export type Freshness = 'fresh' | 'recent' | 'old';

/**
 * How much to trust a price's age. Forecourts must report every change within 30 minutes, so an
 * old timestamp usually means the price has not changed, but after two weeks it is worth a warning.
 */
export function freshness(iso: string, now: Date): Freshness {
  const hours = (now.getTime() - Date.parse(iso)) / 3_600_000;
  if (!Number.isFinite(hours)) return 'old';
  if (hours < 24) return 'fresh';
  if (hours < 24 * 14) return 'recent';
  return 'old';
}
