/**
 * The Pumpwise price feed: the files the GitHub job publishes and the app reads, plus helpers
 * shared by every country's data source.
 *
 * This file has no imports on purpose: the feed job runs it directly with Node
 * (`node scripts/feed/build.ts`), and the app imports the same code, so both always agree.
 */

/** The feed version this build of the app reads (its app.json `extra.feedUrl` must match). */
export const FEED_VERSION = 4;
/**
 * Version 2 of the feed (Western Australia only) stays online for Pumpwise 1.0, which can't read
 * the regions added since. It is published alongside the newer versions at data/v2.
 */
export const LEGACY_VERSION = 2;
/** The newest feed version, with every region. The feed job reads the previous run's prices from it. */
export const LATEST_FEED_VERSION = 4;
/** Stations are grouped into square tiles of this many degrees, so the app downloads only its area. */
export const TILE_DEG = 0.5;

/**
 * Fuels by what they are, not by each country's pump label. Each region names them its own way
 * (UK "E10" and WA "ULP" are both `regular`), so a driver's choice carries across borders.
 */
export type FuelKind = 'regular' | 'e10' | 'premium' | 'super' | 'diesel' | 'premium-diesel' | 'lpg' | 'e85' | 'b10' | 'b20' | 'hvo';
export const FUEL_KINDS: readonly FuelKind[] = ['regular', 'e10', 'premium', 'super', 'diesel', 'premium-diesel', 'lpg', 'e85', 'b10', 'b20', 'hvo'];

/** Every place Pumpwise can cover. Which ones are live comes from `FeedMeta.regions`. */
export type RegionId = 'wa' | 'nsw' | 'tas' | 'qld' | 'uk' | 'es' | 'fr' | 'mx';
/** In the order `regionAt` checks them: where boxes overlap, the first region wins (Spain before France). */
export const REGION_IDS: readonly RegionId[] = ['wa', 'nsw', 'tas', 'qld', 'uk', 'es', 'fr', 'mx'];
/** The regions Pumpwise 1.0 knows; only these go into the version 2 feed. */
export const LEGACY_REGION_IDS: readonly RegionId[] = ['wa', 'uk'];

/**
 * Every feed version the job publishes, and the regions each may carry. Apps look up every station's
 * region, so an older app would fail on a region it was not built with: each older version keeps
 * only the regions its app knows, and new regions appear only in the newest.
 */
export const PUBLISHED_FEEDS: readonly { version: number; regions: readonly RegionId[] | 'all' }[] = [
  { version: LATEST_FEED_VERSION, regions: 'all' },
  { version: 3, regions: ['wa', 'nsw', 'tas', 'uk'] },
  { version: LEGACY_VERSION, regions: LEGACY_REGION_IDS },
];

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Boxes around each region, several where a single box would swallow a neighbour. WA's eastern edge
 * is the 129th meridian. The NSW box includes the ACT, whose stations are in NSW FuelCheck, and clips
 * a little of Victoria and Queensland along the borders, where the nearest stations are often in NSW
 * anyway. Spain's boxes leave out most of Portugal and stop at the Pyrenees, and Great Britain's
 * stop short of Normandy and Calais, so France gets those.
 */
export const REGION_BOUNDS: Record<RegionId, readonly Bounds[]> = {
  wa: [{ minLat: -35.6, maxLat: -13.4, minLng: 112.5, maxLng: 129.0 }],
  nsw: [{ minLat: -37.6, maxLat: -28.1, minLng: 140.95, maxLng: 154.0 }],
  tas: [{ minLat: -43.9, maxLat: -39.3, minLng: 143.5, maxLng: 148.6 }],
  qld: [{ minLat: -29.2, maxLat: -9.0, minLng: 137.99, maxLng: 153.65 }],
  uk: [
    { minLat: 50.0, maxLat: 51.0, minLng: -8.7, maxLng: 1.2 },
    { minLat: 51.0, maxLat: 61.0, minLng: -8.7, maxLng: 1.8 },
  ],
  es: [
    { minLat: 42.15, maxLat: 43.9, minLng: -9.4, maxLng: -1.75 }, // Galicia to the Basque Country
    { minLat: 35.9, maxLat: 42.15, minLng: -6.2, maxLng: -1.75 }, // the interior and the south
    { minLat: 36.9, maxLat: 41.0, minLng: -7.0, maxLng: -6.2 }, // Extremadura and western Andalucía
    { minLat: 36.9, maxLat: 37.9, minLng: -7.45, maxLng: -7.0 }, // Huelva to the Guadiana
    { minLat: 35.9, maxLat: 42.5, minLng: -1.75, maxLng: 4.4 }, // the east, Catalonia and the Balearics
    { minLat: 42.5, maxLat: 42.9, minLng: -1.75, maxLng: -0.75 }, // Navarra
    { minLat: 27.6, maxLat: 29.5, minLng: -18.2, maxLng: -13.3 }, // Canary Islands
    { minLat: 35.25, maxLat: 35.95, minLng: -5.4, maxLng: -2.9 }, // Ceuta and Melilla
  ],
  fr: [{ minLat: 41.3, maxLat: 51.2, minLng: -5.3, maxLng: 9.7 }],
  mx: [{ minLat: 14.4, maxLat: 32.8, minLng: -118.5, maxLng: -86.6 }],
};

/** First Sunday of a month at 02:00 Australian Eastern Standard Time (16:00 UTC the day before). */
function firstSundayAest(year: number, monthIndex: number): number {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const day = 1 + ((7 - first.getUTCDay()) % 7);
  return Date.UTC(year, monthIndex, day, 2) - 10 * 3_600_000;
}

/**
 * Sydney, Canberra and Hobart time: UTC+10, or UTC+11 from the first Sunday in October to the
 * first Sunday in April. Worked out here because phones don't all carry time zone data.
 */
export function auEasternOffsetMinutes(date: Date): number {
  const t = date.getTime();
  const year = new Date(t + 10 * 3_600_000).getUTCFullYear();
  // Clocks go forward at 2am standard time and back at 3am daylight time: both 16:00 UTC the day before.
  const daylight = t >= firstSundayAest(year, 9) || t < firstSundayAest(year, 3);
  return daylight ? 11 * 60 : 10 * 60;
}

export function inBounds(b: Bounds, lat: number, lng: number): boolean {
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

/** True when a point is inside any of a region's boxes. */
export function inRegion(id: RegionId, lat: number, lng: number): boolean {
  return REGION_BOUNDS[id].some((b) => inBounds(b, lat, lng));
}

export function regionAt(lat: number, lng: number): RegionId | null {
  return REGION_IDS.find((id) => inRegion(id, lat, lng)) ?? null;
}

/** Last Sunday of a month at 01:00 UTC, when clocks change across the EU and the UK. */
function lastSundayUtc(year: number, monthIndex: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0, 1));
  return lastDay.getTime() - lastDay.getUTCDay() * 86_400_000;
}

/** European summer time (UK, Spain, France): from the last Sunday in March to the last Sunday in October. */
export function isEuropeanSummerTime(date: Date): boolean {
  const t = date.getTime();
  const year = date.getUTCFullYear();
  return t >= lastSundayUtc(year, 2) && t < lastSundayUtc(year, 9);
}

export interface FeedPrice {
  /**
   * Hundredths of the local currency per litre, one decimal place: pence or cents (139.9 means
   * 1.399 a litre, and €1.659 is 165.9), or centavos in Mexico (24.59 pesos is 2459).
   */
  p: number;
  /**
   * When the price was reported (UK) or the start of the day it applies to (WA, where prices are
   * fixed from 6am for 24 hours). ISO 8601.
   */
  at: string;
}

export interface FeedStation {
  /** Unique across regions: "uk-<node id>", "wa-<hash>". */
  id: string;
  region: RegionId;
  name: string;
  brand: string;
  address: string;
  town: string;
  postcode: string;
  lat: number;
  lng: number;
  /** Monday to Sunday: "0600-2200", "24h", "closed" or "unknown". Null when the station gave no hours. */
  hours: string[] | null;
  /** "motorway", "supermarket", "members-only", "permit-required", "unmanned" and amenity codes. */
  tags: string[];
  prices: Partial<Record<FuelKind, FeedPrice>>;
  /** Tomorrow's fixed prices, where the region publishes them in advance (WA after 2:30pm). */
  tomorrow?: Partial<Record<FuelKind, number>>;
}

export interface FeedTile {
  v: number;
  generatedAt: string;
  tile: string;
  stations: FeedStation[];
}

export interface RegionStatus {
  status: 'live' | 'error';
  /** When this region's prices were last fetched from its source. */
  updatedAt: string;
  stationCount: number;
  /** Tomorrow's prices are included. */
  tomorrow: boolean;
}

export interface FeedMeta {
  v: number;
  generatedAt: string;
  tileDeg: number;
  stationCount: number;
  priceCount: number;
  /** Tile key to number of stations, for every tile that has at least one station. */
  tiles: Record<string, number>;
  regions: Partial<Record<RegionId, RegionStatus>>;
}

export function tileKey(lat: number, lng: number): string {
  return `${Math.floor(lat / TILE_DEG)}_${Math.floor(lng / TILE_DEG)}`;
}

/** Every tile key that overlaps a circle of `radiusKm` around a point. */
export function tilesForArea(lat: number, lng: number, radiusKm: number): string[] {
  const dLat = radiusKm / 111.0;
  const dLng = radiusKm / Math.max(1, 111.32 * Math.cos((lat * Math.PI) / 180));
  const keys: string[] = [];
  for (let y = Math.floor((lat - dLat) / TILE_DEG); y <= Math.floor((lat + dLat) / TILE_DEG); y++) {
    for (let x = Math.floor((lng - dLng) / TILE_DEG); x <= Math.floor((lng + dLng) / TILE_DEG); x++) {
      keys.push(`${y}_${x}`);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------------------------
// Helpers for reading government data, which is not always tidy: anything missing or odd is
// skipped rather than trusted.
// ---------------------------------------------------------------------------------------------

export type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : null;
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

export function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

const KEEP_UPPER = new Set(['BP', 'MFG', 'JET', 'EG', 'UK', 'MSA', 'A1', 'M1', 'M6', 'M25', 'II', 'III', 'HVO', 'BWOC', 'CO-OP', 'IOR', 'OPT', 'WA', 'UGO', 'OMG', 'CGL', 'FDWA']);

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

/** Rounds a reported price to one decimal, or null when it falls outside `[min, max]` (a reporting mistake). */
export function cleanPrice(value: unknown, min: number, max: number): number | null {
  let price = asNumber(value);
  if (price === null) return null;
  if (price > 0 && price < 10) price *= 100; // reported in pounds or dollars (1.399) rather than pence or cents
  price = Math.round(price * 10) / 10;
  return price >= min && price <= max ? price : null;
}

/** Short, stable id from text (FNV-1a), for sources that give stations no id of their own. */
export function hashId(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

export function roundCoord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

export interface Tiled {
  tiles: FeedTile[];
  counts: Record<string, number>;
  stationCount: number;
  priceCount: number;
}

/** Groups stations into tiles, dropping duplicates and stations with no price. */
export function groupIntoTiles(stations: FeedStation[], generatedAt: string, version = FEED_VERSION): Tiled {
  const byTile = new Map<string, FeedStation[]>();
  const seen = new Set<string>();
  let priceCount = 0;
  for (const station of stations) {
    const count = Object.keys(station.prices).length;
    if (count === 0 || seen.has(station.id)) continue;
    seen.add(station.id);
    priceCount += count;
    const key = tileKey(station.lat, station.lng);
    const list = byTile.get(key) ?? [];
    list.push(station);
    byTile.set(key, list);
  }
  const tiles: FeedTile[] = [];
  const counts: Record<string, number> = {};
  for (const key of [...byTile.keys()].sort()) {
    const list = (byTile.get(key) ?? []).sort((a, b) => a.id.localeCompare(b.id));
    counts[key] = list.length;
    tiles.push({ v: version, generatedAt, tile: key, stations: list });
  }
  return { tiles, counts, stationCount: seen.size, priceCount };
}

export interface BuiltFeed {
  meta: FeedMeta;
  tiles: FeedTile[];
}

/** The whole feed from every region's stations and status. */
export function buildFeed(
  stations: FeedStation[],
  regions: Partial<Record<RegionId, RegionStatus>>,
  now: Date,
  version = FEED_VERSION,
): BuiltFeed {
  const generatedAt = now.toISOString();
  const tiled = groupIntoTiles(stations, generatedAt, version);
  return {
    meta: {
      v: version,
      generatedAt,
      tileDeg: TILE_DEG,
      stationCount: tiled.stationCount,
      priceCount: tiled.priceCount,
      tiles: tiled.counts,
      regions,
    },
    tiles: tiled.tiles,
  };
}

/** One published feed version: the same prices, limited to the regions that version may carry. */
export function feedForVersion(
  stations: FeedStation[],
  regions: Partial<Record<RegionId, RegionStatus>>,
  now: Date,
  published: { version: number; regions: readonly RegionId[] | 'all' },
): BuiltFeed {
  if (published.regions === 'all') return buildFeed(stations, regions, now, published.version);
  const keep = new Set<RegionId>(published.regions);
  const kept: Partial<Record<RegionId, RegionStatus>> = {};
  for (const id of published.regions) if (regions[id]) kept[id] = regions[id];
  return buildFeed(
    stations.filter((s) => keep.has(s.region)),
    kept,
    now,
    published.version,
  );
}

/** The version 2 feed for Pumpwise 1.0: the same prices, limited to the regions it knows. */
export function legacyFeed(stations: FeedStation[], regions: Partial<Record<RegionId, RegionStatus>>, now: Date): BuiltFeed {
  return feedForVersion(stations, regions, now, { version: LEGACY_VERSION, regions: LEGACY_REGION_IDS });
}
