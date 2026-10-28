// Western Australia: FuelWatch (Government of Western Australia), RSS feed, no key needed.
// FuelWatch allows apps to use its data "on the condition that FuelWatch is acknowledged as the
// source of the data with a link back to www.fuelwatch.wa.gov.au" (fuelwatch.wa.gov.au/tools/rss).
// WA prices are fixed for 24 hours from 6am, and tomorrow's prices are published after 2:30pm.
import { cleanPrice, type FeedStation, type FuelKind, hashId, inBounds, REGION_BOUNDS, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const WA_RSS = 'https://www.fuelwatch.wa.gov.au/fuelwatch/fuelWatchRSS';
export const WA_MIN_CENTS = 100;
export const WA_MAX_CENTS = 500;
export const WA_MIN_STATIONS = 300;

/** FuelWatch product codes. */
export const WA_PRODUCTS: readonly { product: number; kind: FuelKind }[] = [
  { product: 1, kind: 'regular' },
  { product: 2, kind: 'premium' },
  { product: 6, kind: 'super' },
  { product: 4, kind: 'diesel' },
  { product: 11, kind: 'premium-diesel' },
  { product: 5, kind: 'lpg' },
  { product: 10, kind: 'e85' },
];

export interface WaItem {
  price: string;
  date: string;
  brand: string;
  tradingName: string;
  location: string;
  address: string;
  latitude: string;
  longitude: string;
  siteFeatures: string;
  restrictions: string;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function field(item: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(item);
  return match ? decodeEntities(match[1] ?? '') : '';
}

/** Every <item> in a FuelWatch RSS document. */
export function parseRss(xml: string): WaItem[] {
  const items: WaItem[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = match[1] ?? '';
    items.push({
      price: field(item, 'price'),
      date: field(item, 'date'),
      brand: field(item, 'brand'),
      tradingName: field(item, 'trading-name'),
      location: field(item, 'location'),
      address: field(item, 'address'),
      latitude: field(item, 'latitude'),
      longitude: field(item, 'longitude'),
      siteFeatures: field(item, 'site-features'),
      restrictions: field(item, 'restrictions'),
    });
  }
  return items;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "Open Mon-Fri: 06:00-18:00, Sat: 07:00-17:00, Sun: -" or "Open 24 hours" as seven day codes. */
export function parseWaHours(text: string): string[] | null {
  if (/open 24 hours/i.test(text)) return DAY_NAMES.map(() => '24h');
  const hours = DAY_NAMES.map(() => 'unknown');
  let found = false;
  const pattern = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:\s*-\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?:\s*(?:(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})|-)/g;
  for (const m of text.matchAll(pattern)) {
    const from = DAY_NAMES.indexOf(m[1] ?? '');
    const to = m[2] ? DAY_NAMES.indexOf(m[2]) : from;
    if (from < 0 || to < from) continue;
    const value = m[3]
      ? (() => {
          const open = `${m[3].padStart(2, '0')}${m[4]}`;
          const close = `${(m[5] ?? '').padStart(2, '0')}${m[6]}`;
          if (open === close) return open === '0000' ? '24h' : 'closed';
          return close === '2400' || close === '2359' ? (open === '0000' ? '24h' : `${open}-2359`) : `${open}-${close}`;
        })()
      : 'closed';
    for (let d = from; d <= to; d++) hours[d] = value;
    found = true;
  }
  return found ? hours : null;
}

const FEATURE_TAGS: [RegExp, string][] = [
  [/\bToilets\b/i, 'toilets'],
  [/\bCarwash\b|\bCar wash\b/i, 'car-wash'],
  [/AdBlue/i, 'adblue'],
  [/\bAir\b/, 'air'],
  [/\bATM\b/, 'atm'],
  [/Truck Friendly/i, 'truck'],
];

const RESTRICTION_TAGS: [RegExp, string][] = [
  [/Membership Required/i, 'members-only'],
  [/Entry Permit Required/i, 'permit-required'],
  [/Unmanned/i, 'unmanned'],
  [/Low Aromatic/i, 'low-aromatic'],
];

export function waTags(features: string, restrictions: string): string[] {
  const tags: string[] = [];
  for (const [pattern, tag] of RESTRICTION_TAGS) if (pattern.test(restrictions)) tags.push(tag);
  for (const [pattern, tag] of FEATURE_TAGS) if (pattern.test(features)) tags.push(tag);
  return tags;
}

/** Stable id for a WA station, which FuelWatch does not give: name, address and suburb. */
export function waStationId(item: WaItem): string {
  return `wa-${hashId(`${item.tradingName}|${item.address}|${item.location}`.toUpperCase())}`;
}

/** The moment a WA daily price starts: 6am Perth time (UTC+8, no daylight saving) on that date. */
export function waPriceStart(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const t = Date.parse(`${date}T06:00:00+08:00`);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export interface WaProductFeed {
  kind: FuelKind;
  items: WaItem[];
}

/** Joins today's (and, when published, tomorrow's) feeds for every product into stations. */
export function buildWaStations(today: WaProductFeed[], tomorrow: WaProductFeed[]): FeedStation[] {
  const stations = new Map<string, FeedStation>();
  for (const { kind, items } of today) {
    for (const item of items) {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      const price = cleanPrice(item.price, WA_MIN_CENTS, WA_MAX_CENTS);
      const at = waPriceStart(item.date);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inBounds(REGION_BOUNDS.wa, lat, lng) || price === null || !at) continue;
      const id = waStationId(item);
      let station = stations.get(id);
      if (!station) {
        const brand = tidyName(item.brand);
        station = {
          id,
          region: 'wa',
          name: tidyName(item.tradingName) || brand || 'Fuel station',
          brand: brand === 'Independent' ? '' : brand,
          address: tidyName(item.address),
          town: tidyName(item.location),
          postcode: '',
          lat: roundCoord(lat),
          lng: roundCoord(lng),
          hours: parseWaHours(item.siteFeatures),
          tags: waTags(item.siteFeatures, item.restrictions),
          prices: {},
        };
        stations.set(id, station);
      }
      station.prices[kind] = { p: price, at };
    }
  }
  for (const { kind, items } of tomorrow) {
    for (const item of items) {
      const station = stations.get(waStationId(item));
      const price = cleanPrice(item.price, WA_MIN_CENTS, WA_MAX_CENTS);
      if (!station || price === null) continue;
      station.tomorrow = { ...station.tomorrow, [kind]: price };
    }
  }
  return [...stations.values()];
}

/** Perth time is UTC+8 all year. */
export function perthClock(now: Date): { hour: number; minute: number } {
  const local = new Date(now.getTime() + 8 * 3_600_000);
  return { hour: local.getUTCHours(), minute: local.getUTCMinutes() };
}

export function tomorrowPublished(now: Date): boolean {
  const { hour, minute } = perthClock(now);
  return hour > 14 || (hour === 14 && minute >= 30);
}

export async function fetchWa(now: Date): Promise<{ stations: FeedStation[]; tomorrow: boolean }> {
  // About 14 small requests an hour at most, spaced out: the feed changes once a day.
  const request = politeRequester(1500, 'application/rss+xml, application/xml, text/xml');
  const getProduct = async (product: number, day: 'today' | 'tomorrow') => {
    const response = await request(`${WA_RSS}?Product=${product}${day === 'tomorrow' ? '&Day=tomorrow' : ''}`);
    if (!response.ok) throw new Error(`FuelWatch product ${product} (${day}): ${response.status}`);
    return parseRss(await response.text());
  };
  const today: WaProductFeed[] = [];
  for (const { product, kind } of WA_PRODUCTS) today.push({ kind, items: await getProduct(product, 'today') });
  const tomorrow: WaProductFeed[] = [];
  if (tomorrowPublished(now)) {
    for (const { product, kind } of WA_PRODUCTS) tomorrow.push({ kind, items: await getProduct(product, 'tomorrow') });
  }
  const hasTomorrow = tomorrow.some((feed) => feed.items.length > 0);
  return { stations: buildWaStations(today, hasTomorrow ? tomorrow : []), tomorrow: hasTomorrow };
}
