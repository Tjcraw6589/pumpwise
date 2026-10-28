/**
 * The Pumpwise price feed: the files the GitHub job publishes and the app reads, and the code
 * that turns raw UK Fuel Finder records into them.
 *
 * This file has no imports on purpose: the feed job runs it directly with Node
 * (`node scripts/feed/build.ts`), and the app imports the same code, so both always agree.
 */

export const FEED_VERSION = 1;
/** Stations are grouped into square tiles of this many degrees, so the app downloads only its area. */
export const TILE_DEG = 0.5;

export type FuelCode = 'E10' | 'E5' | 'B7' | 'SDV' | 'B10' | 'HVO';
export const FUEL_CODES: readonly FuelCode[] = ['E10', 'E5', 'B7', 'SDV', 'B10', 'HVO'];

/** Fuel Finder fuel type names mapped to the short codes drivers see on UK pumps. */
const API_FUEL_CODES: Record<string, FuelCode> = {
  E10: 'E10',
  E5: 'E5',
  B7: 'B7',
  B7_STANDARD: 'B7',
  B7_PREMIUM: 'SDV',
  SDV: 'SDV',
  B10: 'B10',
  HVO: 'HVO',
};

export interface FeedPrice {
  /** Pence per litre, one decimal place (139.9 means £1.399 a litre). */
  p: number;
  /** When the forecourt last reported this price (ISO 8601, UTC). */
  at: string;
}

export interface FeedStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  town: string;
  postcode: string;
  lat: number;
  lng: number;
  /** Monday to Sunday: "0600-2200", "24h" or "closed". Null when the forecourt gave no hours. */
  hours: string[] | null;
  /** "motorway", "supermarket" and amenity codes such as "toilets" or "car-wash". */
  tags: string[];
  prices: Partial<Record<FuelCode, FeedPrice>>;
}

export interface FeedTile {
  v: number;
  generatedAt: string;
  tile: string;
  stations: FeedStation[];
}

export interface FeedMeta {
  v: number;
  generatedAt: string;
  /** "awaiting-credentials" until the Fuel Finder keys are added to the GitHub repository. */
  status: 'live' | 'awaiting-credentials';
  tileDeg: number;
  stationCount: number;
  priceCount: number;
  /** Tile key to number of stations, for every tile that has at least one station. */
  tiles: Record<string, number>;
  source: string;
  licence: string;
}

export const FEED_SOURCE = 'UK Government Fuel Finder scheme';
export const FEED_LICENCE = 'Contains public sector information licensed under the Open Government Licence v3.0.';

/** Prices outside this range (pence per litre) are reporting mistakes, such as 13p or £15 a litre. */
export const MIN_PENCE = 80;
export const MAX_PENCE = 300;

/** A generous box around the UK, Northern Ireland, the Channel Islands and Shetland. */
export const UK_BOUNDS = { minLat: 49.1, maxLat: 61.0, minLng: -8.7, maxLng: 2.1 } as const;

export function tileKey(lat: number, lng: number): string {
  return `${Math.floor(lat / TILE_DEG)}_${Math.floor(lng / TILE_DEG)}`;
}

/** Every tile key that overlaps a circle of `radiusMiles` around a point. */
export function tilesForArea(lat: number, lng: number, radiusMiles: number): string[] {
  const dLat = radiusMiles / 69.0;
  const dLng = radiusMiles / Math.max(1, 69.172 * Math.cos((lat * Math.PI) / 180));
  const keys: string[] = [];
  for (let y = Math.floor((lat - dLat) / TILE_DEG); y <= Math.floor((lat + dLat) / TILE_DEG); y++) {
    for (let x = Math.floor((lng - dLng) / TILE_DEG); x <= Math.floor((lng + dLng) / TILE_DEG); x++) {
      keys.push(`${y}_${x}`);
    }
  }
  return keys;
}

export function isInUK(lat: number, lng: number): boolean {
  return lat >= UK_BOUNDS.minLat && lat <= UK_BOUNDS.maxLat && lng >= UK_BOUNDS.minLng && lng <= UK_BOUNDS.maxLng;
}

// ---------------------------------------------------------------------------------------------
// Raw record parsing. The Fuel Finder API is young and its records are not always tidy, so every
// field is read defensively: anything missing or odd is skipped rather than trusted.
// ---------------------------------------------------------------------------------------------

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

const KEEP_UPPER = new Set(['BP', 'MFG', 'JET', 'EG', 'UK', 'MSA', 'A1', 'M1', 'M6', 'M25', 'II', 'III', 'HVO', 'BWOC', 'CO-OP']);

/** "TESCO EXTRA ST. ALBANS" becomes "Tesco Extra St. Albans"; mixed-case names are left alone. */
export function tidyName(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text || /[a-z]/.test(text)) return text;
  return text
    .split(' ')
    .map((word) => {
      if (KEEP_UPPER.has(word) || /\d/.test(word)) return word;
      return (
        word
          .toLowerCase()
          .replace(/(^|[-(&/])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
          // O'Neill and D'Arcy, but not Sainsbury's.
          .replace(/^([A-Z])'([a-z])/, (_m, a: string, b: string) => `${a}'${b.toUpperCase()}`)
      );
    })
    .join(' ');
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function hhmm(value: unknown): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(asString(value));
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
}

export function parseHours(openingTimes: unknown): string[] | null {
  const usual = asRecord(asRecord(openingTimes)?.usual_days);
  if (!usual) return null;
  let known = 0;
  const hours = DAYS.map((day) => {
    const entry = asRecord(usual[day]);
    if (!entry) return 'unknown';
    if (entry.is_24_hours === true) {
      known++;
      return '24h';
    }
    const open = hhmm(entry.open ?? entry.open_time);
    const close = hhmm(entry.close ?? entry.close_time);
    if (!open || !close) return 'unknown';
    known++;
    if (open === close) return open === '0000' ? '24h' : 'closed';
    return `${open}-${close}`;
  });
  return known === 0 ? null : hours;
}

const AMENITY_CODES: Record<string, string> = {
  customer_toilets: 'toilets',
  toilets: 'toilets',
  car_wash: 'car-wash',
  twenty_four_hour_fuel: '24h-fuel',
  adblue_pumps: 'adblue',
  adblue_packaged: 'adblue',
  lpg_pumps: 'lpg',
  air_pump_or_screenwash: 'air',
  water_filling: 'water',
};

export type StationInfo = Omit<FeedStation, 'prices'>;

/** One forecourt record from `/pfs`. Returns null for closed sites and records without a usable location. */
export function normalizeStation(raw: unknown): StationInfo | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = asString(record.node_id);
  if (!id) return null;
  if (record.permanent_closure === true || record.temporary_closure === true) return null;
  const location = asRecord(record.location) ?? record;
  const lat = asNumber(location.latitude);
  const lng = asNumber(location.longitude);
  if (lat === null || lng === null || !isInUK(lat, lng)) return null;

  const brand = tidyName(asString(record.brand_name));
  const name = tidyName(asString(record.trading_name)) || brand || 'Fuel station';
  const address = [location.address_line_1, location.address_line_2]
    .map((part) => tidyName(asString(part)))
    .filter(Boolean)
    .join(', ');

  const tags: string[] = [];
  if (record.is_motorway_service_station === true) tags.push('motorway');
  if (record.is_supermarket_service_station === true) tags.push('supermarket');
  if (Array.isArray(record.amenities)) {
    for (const amenity of record.amenities) {
      const code = AMENITY_CODES[asString(amenity).toLowerCase()];
      if (code && !tags.includes(code)) tags.push(code);
    }
  }

  return {
    id,
    name,
    brand,
    address,
    town: tidyName(asString(location.city)),
    postcode: asString(location.postcode).toUpperCase(),
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    hours: parseHours(record.opening_times),
    tags,
  };
}

/** Converts a reported price to pence per litre, or null when it cannot be right. */
export function normalizePence(value: unknown): number | null {
  let pence = asNumber(value);
  if (pence === null) return null;
  if (pence > 0 && pence < 10) pence *= 100; // reported in pounds (1.399) rather than pence (139.9)
  pence = Math.round(pence * 10) / 10;
  return pence >= MIN_PENCE && pence <= MAX_PENCE ? pence : null;
}

/** One record from `/pfs/fuel-prices`: a forecourt id and its latest price for each fuel. */
export function normalizePrices(raw: unknown, now: Date): { id: string; prices: Partial<Record<FuelCode, FeedPrice>> } | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = asString(record.node_id);
  if (!id || !Array.isArray(record.fuel_prices)) return null;
  const prices: Partial<Record<FuelCode, FeedPrice>> = {};
  for (const entry of record.fuel_prices) {
    const item = asRecord(entry);
    if (!item) continue;
    const code = API_FUEL_CODES[asString(item.fuel_type).toUpperCase()];
    const pence = normalizePence(item.price);
    if (!code || pence === null) continue;
    const stamp = Date.parse(asString(item.price_last_updated) || asString(item.price_change_effective_timestamp));
    if (!Number.isFinite(stamp)) continue;
    // A time in the future is a clock mistake on the forecourt's side; treat it as "now".
    const at = new Date(Math.min(stamp, now.getTime())).toISOString();
    const existing = prices[code];
    if (!existing || existing.at < at) prices[code] = { p: pence, at };
  }
  return { id, prices };
}

export interface BuiltFeed {
  meta: FeedMeta;
  tiles: FeedTile[];
}

/** Joins forecourts with their prices and groups them into tiles. Forecourts with no valid price are left out. */
export function buildFeed(stationRecords: unknown[], priceRecords: unknown[], now: Date): BuiltFeed {
  const generatedAt = now.toISOString();
  const prices = new Map<string, Partial<Record<FuelCode, FeedPrice>>>();
  for (const raw of priceRecords) {
    const parsed = normalizePrices(raw, now);
    if (!parsed) continue;
    prices.set(parsed.id, { ...prices.get(parsed.id), ...parsed.prices });
  }

  const byTile = new Map<string, FeedStation[]>();
  const seen = new Set<string>();
  let priceCount = 0;
  for (const raw of stationRecords) {
    const info = normalizeStation(raw);
    if (!info || seen.has(info.id)) continue;
    const stationPrices = prices.get(info.id);
    const count = stationPrices ? Object.keys(stationPrices).length : 0;
    if (!stationPrices || count === 0) continue;
    seen.add(info.id);
    priceCount += count;
    const key = tileKey(info.lat, info.lng);
    const list = byTile.get(key) ?? [];
    list.push({ ...info, prices: stationPrices });
    byTile.set(key, list);
  }

  const tiles: FeedTile[] = [];
  const counts: Record<string, number> = {};
  for (const key of [...byTile.keys()].sort()) {
    const stations = (byTile.get(key) ?? []).sort((a, b) => a.id.localeCompare(b.id));
    counts[key] = stations.length;
    tiles.push({ v: FEED_VERSION, generatedAt, tile: key, stations });
  }

  return {
    meta: {
      v: FEED_VERSION,
      generatedAt,
      status: 'live',
      tileDeg: TILE_DEG,
      stationCount: seen.size,
      priceCount,
      tiles: counts,
      source: FEED_SOURCE,
      licence: FEED_LICENCE,
    },
    tiles,
  };
}

export function emptyMeta(now: Date): FeedMeta {
  return {
    v: FEED_VERSION,
    generatedAt: now.toISOString(),
    status: 'awaiting-credentials',
    tileDeg: TILE_DEG,
    stationCount: 0,
    priceCount: 0,
    tiles: {},
    source: FEED_SOURCE,
    licence: FEED_LICENCE,
  };
}
