/**
 * The Pumpwise price feed: the files the GitHub job publishes and the app reads, plus helpers
 * shared by every country's data source.
 *
 * This file has no imports on purpose: the feed job runs it directly with Node
 * (`node scripts/feed/build.ts`), and the app imports the same code, so both always agree.
 */

export const FEED_VERSION = 2;
/** Stations are grouped into square tiles of this many degrees, so the app downloads only its area. */
export const TILE_DEG = 0.5;

/**
 * Fuels by what they are, not by each country's pump label. Each region names them its own way
 * (UK "E10" and WA "ULP" are both `regular`), so a driver's choice carries across borders.
 */
export type FuelKind = 'regular' | 'premium' | 'super' | 'diesel' | 'premium-diesel' | 'lpg' | 'e85' | 'b10' | 'hvo';
export const FUEL_KINDS: readonly FuelKind[] = ['regular', 'premium', 'super', 'diesel', 'premium-diesel', 'lpg', 'e85', 'b10', 'hvo'];

/** Every place Pumpwise can cover. Which ones are live comes from `FeedMeta.regions`. */
export type RegionId = 'wa' | 'uk';
export const REGION_IDS: readonly RegionId[] = ['wa', 'uk'];

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Generous boxes around each region. WA's eastern edge is the 129th meridian. */
export const REGION_BOUNDS: Record<RegionId, Bounds> = {
  wa: { minLat: -35.6, maxLat: -13.4, minLng: 112.5, maxLng: 129.0 },
  uk: { minLat: 49.1, maxLat: 61.0, minLng: -8.7, maxLng: 2.1 },
};

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
export function groupIntoTiles(stations: FeedStation[], generatedAt: string): Tiled {
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
    tiles.push({ v: FEED_VERSION, generatedAt, tile: key, stations: list });
  }
  return { tiles, counts, stationCount: seen.size, priceCount };
}

export interface BuiltFeed {
  meta: FeedMeta;
  tiles: FeedTile[];
}

/** The whole feed from every region's stations and status. */
export function buildFeed(stations: FeedStation[], regions: Partial<Record<RegionId, RegionStatus>>, now: Date): BuiltFeed {
  const generatedAt = now.toISOString();
  const tiled = groupIntoTiles(stations, generatedAt);
  return {
    meta: {
      v: FEED_VERSION,
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
