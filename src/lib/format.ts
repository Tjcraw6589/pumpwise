import { localClock } from './hours';

/** How a region writes a price per litre (see `RegionInfo.priceDecimals`). */
export interface PriceStyle {
  priceUnit: string;
  priceDecimals?: 2 | 3;
  currency: string;
  id?: string;
}

/**
 * 139.9 → "139.9" (pence or cents per litre, to one decimal place as on station signs). Where pumps
 * show whole currency, the feed's hundredths become it: 165.9 → "1.659" (3), 2459 → "24.59" (2).
 */
export function formatPrice(price: number, decimals?: 2 | 3): string {
  return decimals ? (price / 100).toFixed(decimals) : price.toFixed(1);
}

/**
 * A price split for a forecourt sign: the large digits and the small ones after them.
 * "189" + ".9" for cents, "1.65" + "9" for euros (the thousandth is small on European signs),
 * "24.59" + "" for pesos.
 */
export function priceParts(price: number, decimals?: 2 | 3): [string, string] {
  if (decimals === 3) {
    const text = formatPrice(price, 3);
    return [text.slice(0, -1), text.slice(-1)];
  }
  if (decimals === 2) return [formatPrice(price, 2), ''];
  const text = formatPrice(price);
  return [text.slice(0, -2), text.slice(-2)];
}

/** "185.8 cents a litre": screen readers say "185.8c" badly, so prices get their unit in words. */
export function spokenPrice(price: number, unit: string | PriceStyle): string {
  if (typeof unit !== 'string' && unit.priceDecimals) {
    const money = unit.currency === '€' ? 'euros' : unit.currency === '£' ? 'pounds' : unit.id === 'mx' ? 'pesos' : 'dollars';
    return `${formatPrice(price, unit.priceDecimals)} ${money} a litre`;
  }
  const code = typeof unit === 'string' ? unit : unit.priceUnit;
  const word = code === 'p' ? 'pence' : code === 'c' ? 'cents' : code;
  return `${formatPrice(price)} ${word} a litre`;
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
export function freshness(iso: string, now: Date, trustDays = 14): Freshness {
  const hours = (now.getTime() - Date.parse(iso)) / 3_600_000;
  if (!Number.isFinite(hours)) return 'old';
  if (hours < 24) return 'fresh';
  if (hours < 24 * trustDays) return 'recent';
  return 'old';
}

/**
 * For regions where a price stands until the station changes it (NSW, ACT, Tasmania): "Updated 3 h ago"
 * within a day, then "Unchanged for 12 days", and only past `trustDays` "Not confirmed since …".
 */
export function standingLabel(at: string, now: Date, trustDays = 30): { text: string; level: Freshness } {
  const level = freshness(at, now, trustDays);
  const ago = timeAgo(at, now);
  if (level === 'fresh') return { text: `Updated ${ago}`, level };
  if (level === 'recent') return { text: `Unchanged for ${ago.replace(/ ago$/, '')}`, level };
  return { text: `Not confirmed since ${ago}`, level };
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
