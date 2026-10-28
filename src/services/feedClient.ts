import { FEED_URL } from '@/config/app';
import { type FeedMeta, type FeedStation, type FeedTile, FEED_VERSION, tilesForArea } from '@/lib/feed';
import type { LatLng } from '@/lib/geo';

/**
 * Downloads prices for an area from the Pumpwise feed. Only the tiles around the search centre
 * are fetched, and tiles that have not changed since the last download are reused from memory.
 * Prices are never sent anywhere: this only reads public files.
 */

export class FeedError extends Error {
  constructor(
    public kind: 'offline' | 'unavailable',
    message: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 15_000;
/** Extra miles loaded beyond the search area, so "nearest" can still be found when the area is small. */
export const NEAREST_MARGIN_MILES = 4;

const tileCache = new Map<string, FeedTile>();

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } catch {
    throw new FeedError('offline', 'No connection');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new FeedError('unavailable', `Feed returned ${response.status}`);
  try {
    return (await response.json()) as T;
  } catch {
    throw new FeedError('unavailable', 'Feed was not valid JSON');
  }
}

export async function fetchMeta(now = Date.now()): Promise<FeedMeta> {
  // A new query string every minute gets past caches, so a fresh feed shows up quickly.
  const meta = await getJson<FeedMeta>(`${FEED_URL}/meta.json?t=${Math.floor(now / 60_000)}`);
  if (!meta || typeof meta !== 'object' || meta.v !== FEED_VERSION) {
    throw new FeedError('unavailable', 'Unknown feed version');
  }
  return meta;
}

export interface AreaResult {
  meta: FeedMeta;
  stations: FeedStation[];
}

export async function loadArea(center: LatLng, radiusMiles: number): Promise<AreaResult> {
  const meta = await fetchMeta();
  if (meta.status !== 'live') return { meta, stations: [] };

  const keys = tilesForArea(center.lat, center.lng, radiusMiles + NEAREST_MARGIN_MILES).filter((key) => meta.tiles[key]);
  const tiles = await Promise.all(
    keys.map(async (key) => {
      const cached = tileCache.get(key);
      if (cached && cached.generatedAt === meta.generatedAt) return cached;
      const tile = await getJson<FeedTile>(`${FEED_URL}/tiles/${key}.json?v=${encodeURIComponent(meta.generatedAt)}`);
      tileCache.set(key, tile);
      return tile;
    }),
  );

  const seen = new Set<string>();
  const stations: FeedStation[] = [];
  for (const tile of tiles) {
    for (const station of tile.stations ?? []) {
      if (seen.has(station.id)) continue;
      seen.add(station.id);
      stations.push(station);
    }
  }
  return { meta, stations };
}

/** For tests. */
export function clearFeedCache(): void {
  tileCache.clear();
}
