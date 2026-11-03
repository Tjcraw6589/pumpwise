// Builds the public Pumpwise price feed from every country's free official source and writes the
// whole GitHub Pages site (landing page, legal pages and data) to out/site.
//
// GitHub runs this every 15 minutes (.github/workflows/feed.yml). By hand: `npm run feed`.
// Each source refreshes on its own schedule. When a source is not due, or fails, its previous
// prices are carried over from the live site, so one bad source never wipes the others.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type BuiltFeed,
  buildFeed,
  type FeedMeta,
  type FeedStation,
  type FeedTile,
  FEED_VERSION,
  LEGACY_VERSION,
  legacyFeed,
  type RegionId,
  type RegionStatus,
} from '../../src/lib/feed.ts';
import { fetchNsw, NSW_MIN_STATIONS, nswCredentials } from './sources/nsw.ts';
import { fetchUk, UK_MIN_STATIONS, ukCredentials } from './sources/uk.ts';
import { fetchWa, WA_MIN_STATIONS, waRefetchMoments } from './sources/wa.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = process.env.FEED_OUT_DIR ?? join(root, 'out', 'site');
const PUBLIC_FEED = (process.env.FEED_PUBLIC_URL ?? `https://tjcraw6589.github.io/pumpwise/data/v${FEED_VERSION}`).replace(/\/$/, '');
const FORCE = process.env.FEED_FORCE === '1';

interface Source {
  id: string;
  /** The regions this source supplies. The first one's status decides when to fetch again. */
  regions: RegionId[];
  /** Minutes between real fetches; in between, the previous prices are reused. */
  everyMinutes: number;
  minStations: number;
  enabled: () => boolean;
  fetch: (now: Date) => Promise<{ stations: FeedStation[]; tomorrow: boolean }>;
  /** Moments after which the previous prices must not be reused, such as the start of a new price day. */
  refetchMoments?: (now: Date) => Date[];
}

const SOURCES: Source[] = [
  // FuelWatch prices change once a day (6am) and tomorrow's appear at 2:30pm, so hourly is plenty.
  { id: 'wa', regions: ['wa'], everyMinutes: 55, minStations: WA_MIN_STATIONS, enabled: () => true, fetch: fetchWa, refetchMoments: waRefetchMoments },
  // NSW FuelCheck (with the ACT and Tasmania). The free plan allows 2,500 calls a month and each
  // fetch uses two, so fetch at the first run 40+ minutes after the last: every 45 minutes,
  // about 2,000 calls a month.
  {
    id: 'nsw',
    regions: ['nsw', 'tas'],
    everyMinutes: 40,
    minStations: NSW_MIN_STATIONS,
    enabled: () => nswCredentials() !== null,
    fetch: async (now) => ({ stations: await fetchNsw(nswCredentials() as { key: string; secret: string }, now), tomorrow: false }),
  },
  {
    id: 'uk',
    regions: ['uk'],
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

function writeData(feed: BuiltFeed, dataDir: string): void {
  writeJson(join(dataDir, 'meta.json'), feed.meta);
  for (const tile of feed.tiles) writeJson(join(dataDir, 'tiles', `${tile.tile}.json`), tile);
}

/** The site, the current feed (data/v3) and the Western Australia feed Pumpwise 1.0 reads (data/v2). */
export function writeSite(feed: BuiltFeed, legacy: BuiltFeed | null, target = outDir): void {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const siteSource = join(root, 'site');
  if (existsSync(siteSource)) cpSync(siteSource, target, { recursive: true });
  writeFileSync(join(target, '.nojekyll'), '');
  writeData(feed, join(target, 'data', `v${FEED_VERSION}`));
  if (legacy) writeData(legacy, join(target, 'data', `v${LEGACY_VERSION}`));
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
    const before = previous?.meta.regions[source.regions[0] as RegionId];
    const kept = source.regions.flatMap((id) => previous?.byRegion.get(id) ?? []);
    const ageMinutes = before ? (now.getTime() - Date.parse(before.updatedAt)) / 60_000 : Infinity;
    const crossed = before ? (source.refetchMoments?.(now) ?? []).some((m) => Date.parse(before.updatedAt) < m.getTime()) : false;
    if (!FORCE && before?.status === 'live' && kept.length > 0 && ageMinutes < source.everyMinutes && !crossed) {
      console.log(`${source.id}: reusing prices from ${Math.round(ageMinutes)} min ago`);
      stations.push(...kept);
      for (const id of source.regions) if (previous?.meta.regions[id]) regions[id] = previous.meta.regions[id];
      continue;
    }
    try {
      const result = await source.fetch(now);
      const withPrices = result.stations.filter((s) => Object.keys(s.prices).length > 0);
      if (withPrices.length < source.minStations) {
        throw new Error(`only ${withPrices.length} stations with prices (expected at least ${source.minStations})`);
      }
      stations.push(...withPrices);
      for (const id of source.regions) {
        const count = withPrices.filter((s) => s.region === id).length;
        if (count > 0) regions[id] = { status: 'live', updatedAt: now.toISOString(), stationCount: count, tomorrow: result.tomorrow };
      }
      fetchedSomething = true;
      console.log(`${source.id}: ${withPrices.length} stations${result.tomorrow ? ', with tomorrow\'s prices' : ''}`);
    } catch (error) {
      failures++;
      console.error(`${source.id}: ${error instanceof Error ? error.message : String(error)}`);
      if (before && kept.length > 0) {
        console.warn(`${source.id}: keeping the previous prices from ${before.updatedAt}`);
        stations.push(...kept);
        for (const id of source.regions) if (previous?.meta.regions[id]) regions[id] = previous.meta.regions[id];
      } else {
        regions[source.regions[0] as RegionId] = { status: 'error', updatedAt: now.toISOString(), stationCount: 0, tomorrow: false };
      }
    }
  }

  if (stations.length === 0 && failures > 0) {
    throw new Error('No prices from any source; keeping the previous site online.');
  }
  const feed = buildFeed(stations, regions, now);
  writeSite(feed, legacyFeed(stations, regions, now));
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
