/**
 * The Pumpwise price feed: the files the GitHub job publishes and the app reads, plus helpers
 * shared by every country's data source.
 *
 * This file has no imports on purpose: the feed job runs it directly with Node
 * (`node scripts/feed/build.ts`), and the app imports the same code, so both always agree.
 */

export const FEED_VERSION = 3;
/**
 * Version 2 of the feed (Western Australia only) stays online for Pumpwise 1.0, which can't read
 * the regions added since. It is published alongside version 3 at data/v2.
 */
export const LEGACY_VERSION = 2;
/** Stations are grouped into square tiles of this many degrees, so the app downloads only its area. */
export const TILE_DEG = 0.5;

/**
 * Fuels by what they are, not by each country's pump label. Each region names them its own way
 * (UK "E10" and WA "ULP" are both `regular`), so a driver's choice carries across borders.
 */
export type FuelKind = 'regular' | 'e10' | 'premium' | 'super' | 'diesel' | 'premium-diesel' | 'lpg' | 'e85' | 'b10' | 'b20' | 'hvo';
export const FUEL_KINDS: readonly FuelKind[] = ['regular', 'e10', 'premium', 'super', 'diesel', 'premium-diesel', 'lpg', 'e85', 'b10', 'b20', 'hvo'];

/** Every place Pumpwise can cover. Which ones are live comes from `FeedMeta.regions`. */
export type RegionId = 'wa' | 'nsw' | 'tas' | 'uk';
export const REGION_IDS: readonly RegionId[] = ['wa', 'nsw', 'tas', 'uk'];
/** The regions Pumpwise 1.0 knows; only these go into the version 2 feed. */
export const LEGACY_REGION_IDS: readonly RegionId[] = ['wa', 'uk'];

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Generous boxes around each region. WA's eastern edge is the 129th meridian. The NSW box includes
 * the ACT, whose stations are in NSW FuelCheck, and clips a little of Victoria and Queensland along
 * the borders, where the nearest stations are often in NSW anyway.
 */
export const REGION_BOUNDS: Record<RegionId, Bounds> = {
  wa: { minLat: -35.6, maxLat: -13.4, minLng: 112.5, maxLng: 129.0 },
  nsw: { minLat: -37.6, maxLat: -28.1, minLng: 140.95, maxLng: 154.0 },
  tas: { minLat: -43.9, maxLat: -39.3, minLng: 143.5, maxLng: 148.6 },
  uk: { minLat: 49.1, maxLat: 61.0, minLng: -8.7, maxLng: 2.1 },
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

export function regionAt(lat: number, lng: number): RegionId | null {
  return REGION_IDS.find((id) => inBounds(REGION_BOUNDS[id], lat, lng)) ?? null;
}

export interface FeedPrice {
  /** Pence or cents per litre, one decimal place (139.9 means 1.399 a litre). */
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

/** The version 2 feed for Pumpwise 1.0: the same prices, limited to the regions it knows. */
export function legacyFeed(stations: FeedStation[], regions: Partial<Record<RegionId, RegionStatus>>, now: Date): BuiltFeed {
  const keep = new Set<RegionId>(LEGACY_REGION_IDS);
  const legacyRegions: Partial<Record<RegionId, RegionStatus>> = {};
  for (const id of LEGACY_REGION_IDS) if (regions[id]) legacyRegions[id] = regions[id];
  return buildFeed(
    stations.filter((s) => keep.has(s.region)),
    legacyRegions,
    now,
    LEGACY_VERSION,
  );
}
