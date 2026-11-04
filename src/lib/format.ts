import { localNumber, t } from '@/i18n';

import { localClock } from './hours';

/** What price formatting needs to know about a region (see `RegionInfo`). */
export interface PriceStyle {
  priceUnit: string;
  priceDecimals?: 2 | 3;
  decimalComma?: boolean;
  currency: string;
  currencyCode: string;
  numberLocale: string;
}

/**
 * A price per litre as the region's pumps show it, from the feed's hundredths: 189.9 → "189.9"
 * (cents or pence), 165.9 → "1,659" (euros, comma in Spain and France), 2459 → "24.59" (pesos).
 * Without a region, cents or pence.
 */
export function formatPrice(price: number, style?: Pick<PriceStyle, 'priceDecimals' | 'decimalComma'>): string {
  if (!style?.priceDecimals) return price.toFixed(1);
  const text = (price / 100).toFixed(style.priceDecimals);
  return style.decimalComma ? text.replace('.', ',') : text;
}

/**
 * The two parts of a price sign: the big digits and the smaller tail, as forecourt signs print them.
 * "189" + ".9" (cents), "1,65" + "9" (euros, the tenth of a cent small), "24" + ".59" (pesos).
 */
export function priceParts(price: number, style?: Pick<PriceStyle, 'priceDecimals' | 'decimalComma'>): { main: string; tail: string } {
  const text = formatPrice(price, style);
  if (style?.priceDecimals === 3) return { main: text.slice(0, -1), tail: text.slice(-1) };
  const separator = style?.decimalComma ? ',' : '.';
  const [whole = text, fraction = ''] = text.split(separator);
  return { main: whole, tail: fraction ? `${separator}${fraction}` : '' };
}

/** "185.8 cents a litre", "1,659 euros el litro": screen readers say "185.8c" badly, so the unit goes in words. */
export function spokenPrice(price: number, style: Pick<PriceStyle, 'priceUnit' | 'priceDecimals' | 'decimalComma' | 'currencyCode'>): string {
  const unit =
    style.currencyCode === 'EUR' ? t('unit.euros') : style.currencyCode === 'MXN' ? t('unit.pesos') : style.priceUnit === 'p' ? t('unit.pence') : t('unit.cents');
  return t('price.perLitreSpoken', localNumber(formatPrice(price, { priceDecimals: style.priceDecimals })), unit);
}

/**
 * An amount of money the way the region writes it ("$12.40", "12,40 €", "$248.50"), through the
 * phone's number formatting where it has it.
 */
export function formatMoney(amount: number, style: Pick<PriceStyle, 'currency' | 'currencyCode' | 'numberLocale'>): string {
  try {
    return new Intl.NumberFormat(style.numberLocale, { style: 'currency', currency: style.currencyCode }).format(amount);
  } catch {
    const sign = amount < 0 ? '-' : '';
    return `${sign}${style.currency}${Math.abs(amount).toFixed(2)}`;
  }
}

/** "+4.0" / "−2.5" for price changes in pence or cents. */
export function formatChange(change: number): string {
  if (Math.abs(change) < 0.05) return '±0.0';
  return `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}`;
}

/** Relative time for a past ISO timestamp: "just now", "12 min ago", "3 h ago", "2 days ago". */
export function timeAgo(iso: string, now: Date): string {
  const span = timeSpan(iso, now);
  return span === null ? t('time.unknown') : span === '' ? t('time.justNow') : t('time.ago', span);
}

/** How long ago, without the "ago": "12 min", "3 h", "2 days"; "" when under two minutes; null when unknown. */
export function timeSpan(iso: string, now: Date): string | null {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60_000));
  if (minutes < 2) return '';
  if (minutes < 60) return t('time.minutes', minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('time.hours', hours);
  return t('time.days', Math.round(hours / 24));
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
  if (level === 'fresh') return { text: t('fresh.updated', ago), level };
  if (level === 'recent') return { text: t('fresh.unchangedFor', timeSpan(at, now) ?? ''), level };
  return { text: t('fresh.notConfirmedSince', ago), level };
}

/**
 * For regions with fixed daily prices (WA): "Today's price", "New price from 6am" before it
 * starts, or "Price from Tuesday" when the feed is behind.
 */
export function dailyLabel(at: string, now: Date, offsetMinutes: number): { text: string; level: Freshness } {
  const start = Date.parse(at);
  if (!Number.isFinite(start)) return { text: t('fresh.dateUnknown'), level: 'old' };
  const priceDay = localClock(new Date(start), offsetMinutes);
  const today = localClock(now, offsetMinutes);
  if (now.getTime() < start) {
    return priceDay.dateKey === today.dateKey ? { text: t('fresh.newFrom6'), level: 'fresh' } : { text: t('fresh.from6Tomorrow'), level: 'fresh' };
  }
  if (now.getTime() - start < 24 * 3_600_000) return { text: t('fresh.today'), level: 'fresh' };
  return { text: t('fresh.fromDay', t(`day.${priceDay.day as 0 | 1 | 2 | 3 | 4 | 5 | 6}`)), level: now.getTime() - start < 7 * 86_400_000 ? 'recent' : 'old' };
}
