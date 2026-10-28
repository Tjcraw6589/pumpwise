// Builds the public Pumpwise price feed from every country's free official source and writes the
// whole GitHub Pages site (landing page, legal pages and data) to out/site.
//
// GitHub runs this every 15 minutes (.github/workflows/feed.yml). By hand: `npm run feed`.
// Each source refreshes on its own schedule. When a source is not due, or fails, its previous
// prices are carried over from the live site, so one bad source never wipes the others.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildFeed, type FeedMeta, type FeedStation, type FeedTile, FEED_VERSION, type RegionId, type RegionStatus } from '../../src/lib/feed.ts';
import { fetchUk, UK_MIN_STATIONS, ukCredentials } from './sources/uk.ts';
import { fetchWa, WA_MIN_STATIONS } from './sources/wa.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = process.env.FEED_OUT_DIR ?? join(root, 'out', 'site');
const PUBLIC_FEED = (process.env.FEED_PUBLIC_URL ?? 'https://tjcraw6589.github.io/pumpwise/data/v2').replace(/\/$/, '');
const FORCE = process.env.FEED_FORCE === '1';

interface Source {
  id: RegionId;
  /** Minutes between real fetches; in between, the previous prices are reused. */
  everyMinutes: number;
  minStations: number;
  enabled: () => boolean;
  fetch: (now: Date) => Promise<{ stations: FeedStation[]; tomorrow: boolean }>;
}

const SOURCES: Source[] = [
  // FuelWatch prices change once a day (6am) and tomorrow's appear at 2:30pm, so hourly is plenty.
  { id: 'wa', everyMinutes: 55, minStations: WA_MIN_STATIONS, enabled: () => true, fetch: fetchWa },
  {
    id: 'uk',
    everyMinutes: 0,
    minStations: UK_MIN_STATIONS,
    enabled: () => ukCredentials() !== null,
    fetch: async (now) => ({ stations: await fetchUk(ukCredentials() as { id: string; secret: string }, now), tomorrow: false }),
  },
];

interface Previous {
  meta: FeedMeta;
  byRegion: Map<RegionId, FeedStation[]>;
}

/** The feed that is online now, so sources that are not due (or fail) keep their prices. */
async function loadPrevious(): Promise<Previous | null> {
  try {
    const metaResponse = await fetch(`${PUBLIC_FEED}/meta.json?t=${Date.now()}`, { signal: AbortSignal.timeout(30_000) });
    if (!metaResponse.ok) return null;
    const meta = (await metaResponse.json()) as FeedMeta;
    if (meta.v !== FEED_VERSION) return null;
    const byRegion = new Map<RegionId, FeedStation[]>();
    for (const key of Object.keys(meta.tiles)) {
      const response = await fetch(`${PUBLIC_FEED}/tiles/${key}.json?v=${encodeURIComponent(meta.generatedAt)}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) return null;
      const tile = (await response.json()) as FeedTile;
      for (const station of tile.stations) {
        const list = byRegion.get(station.region) ?? [];
        list.push(station);
        byRegion.set(station.region, list);
      }
    }
    return { meta, byRegion };
  } catch (error) {
    console.warn(`Could not read the previous feed: ${String(error)}`);
    return null;
  }
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

export function writeSite(feed: { meta: FeedMeta; tiles: FeedTile[] }, target = outDir): void {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const siteSource = join(root, 'site');
  if (existsSync(siteSource)) cpSync(siteSource, target, { recursive: true });
  writeFileSync(join(target, '.nojekyll'), '');
  const dataDir = join(target, 'data', `v${FEED_VERSION}`);
  writeJson(join(dataDir, 'meta.json'), feed.meta);
  for (const tile of feed.tiles) writeJson(join(dataDir, 'tiles', `${tile.tile}.json`), tile);
}

async function main(): Promise<void> {
  const now = new Date();
  const previous = await loadPrevious();
  const stations: FeedStation[] = [];
  const regions: Partial<Record<RegionId, RegionStatus>> = {};
  let fetchedSomething = false;
  let failures = 0;

  for (const source of SOURCES) {
    if (!source.enabled()) {
      console.log(`${source.id}: off`);
      continue;
    }
    const before = previous?.meta.regions[source.id];
    const kept = previous?.byRegion.get(source.id) ?? [];
    const ageMinutes = before ? (now.getTime() - Date.parse(before.updatedAt)) / 60_000 : Infinity;
    if (!FORCE && before?.status === 'live' && kept.length > 0 && ageMinutes < source.everyMinutes) {
      console.log(`${source.id}: reusing prices from ${Math.round(ageMinutes)} min ago`);
      stations.push(...kept);
      regions[source.id] = before;
      continue;
    }
    try {
      const result = await source.fetch(now);
      const withPrices = result.stations.filter((s) => Object.keys(s.prices).length > 0);
      if (withPrices.length < source.minStations) {
        throw new Error(`only ${withPrices.length} stations with prices (expected at least ${source.minStations})`);
      }
      stations.push(...withPrices);
      regions[source.id] = { status: 'live', updatedAt: now.toISOString(), stationCount: withPrices.length, tomorrow: result.tomorrow };
      fetchedSomething = true;
      console.log(`${source.id}: ${withPrices.length} stations${result.tomorrow ? ', with tomorrow\'s prices' : ''}`);
    } catch (error) {
      failures++;
      console.error(`${source.id}: ${error instanceof Error ? error.message : String(error)}`);
      if (before && kept.length > 0) {
        console.warn(`${source.id}: keeping the previous prices from ${before.updatedAt}`);
        stations.push(...kept);
        regions[source.id] = before;
      } else {
        regions[source.id] = { status: 'error', updatedAt: now.toISOString(), stationCount: 0, tomorrow: false };
      }
    }
  }

  if (stations.length === 0 && failures > 0) {
    throw new Error('No prices from any source; keeping the previous site online.');
  }
  const feed = buildFeed(stations, regions, now);
  writeSite(feed);
  console.log(
    `Feed: ${feed.meta.stationCount} stations, ${feed.meta.priceCount} prices, ${feed.tiles.length} tiles` +
      (fetchedSomething ? '' : ' (all reused)'),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
