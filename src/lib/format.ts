import { localClock } from './hours';

/** 139.9 → "139.9" (pence or cents per litre, to one decimal place as on station signs). */
export function formatPrice(price: number): string {
  return price.toFixed(1);
}

export function formatMoney(amount: number, currency: string): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency}${Math.abs(amount).toFixed(2)}`;
}

/** "+4.0" / "−2.5" for price changes in pence or cents. */
export function formatChange(change: number): string {
  if (Math.abs(change) < 0.05) return '±0.0';
  return `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}`;
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
 * How much to trust a price's age. Where stations must report every change (UK), an old
 * timestamp usually means the price has not changed, but after two weeks it is worth a warning.
 */
export function freshness(iso: string, now: Date): Freshness {
  const hours = (now.getTime() - Date.parse(iso)) / 3_600_000;
  if (!Number.isFinite(hours)) return 'old';
  if (hours < 24) return 'fresh';
  if (hours < 24 * 14) return 'recent';
  return 'old';
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * For regions with fixed daily prices (WA): "Today's price", "New price from 6am" before it
 * starts, or "Price from Tuesday" when the feed is behind.
 */
export function dailyLabel(at: string, now: Date, offsetMinutes: number): { text: string; level: Freshness } {
  const start = Date.parse(at);
  if (!Number.isFinite(start)) return { text: 'Date unknown', level: 'old' };
  const priceDay = localClock(new Date(start), offsetMinutes);
  const today = localClock(now, offsetMinutes);
  if (now.getTime() < start) {
    return priceDay.dateKey === today.dateKey
      ? { text: 'New price from 6am', level: 'fresh' }
      : { text: 'Price from 6am tomorrow', level: 'fresh' };
  }
  if (now.getTime() - start < 24 * 3_600_000) return { text: "Today's price", level: 'fresh' };
  return { text: `Price from ${WEEKDAYS[priceDay.day]}`, level: now.getTime() - start < 7 * 86_400_000 ? 'recent' : 'old' };
}
