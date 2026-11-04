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
  type FeedMeta,
  feedForVersion,
  type FeedStation,
  type FeedTile,
  LATEST_FEED_VERSION,
  PUBLISHED_FEEDS,
  type RegionId,
  type RegionStatus,
} from '../../src/lib/feed.ts';
import { ES_MIN_STATIONS, fetchEs } from './sources/es.ts';
import { fetchFr, FR_MIN_STATIONS } from './sources/fr.ts';
import { fetchMx, MX_MIN_STATIONS } from './sources/mx.ts';
import { fetchNsw, NSW_MIN_STATIONS, nswCredentials } from './sources/nsw.ts';
import { fetchQld, QLD_MIN_STATIONS, qldToken } from './sources/qld.ts';
import { fetchUk, UK_MIN_STATIONS, ukCredentials } from './sources/uk.ts';
import { fetchWa, WA_MIN_STATIONS, waRefetchMoments } from './sources/wa.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = process.env.FEED_OUT_DIR ?? join(root, 'out', 'site');
/** The live site's data folder; the previous run's prices are read from the newest version there. */
const PUBLIC_DATA = (process.env.FEED_PUBLIC_DATA ?? 'https://tjcraw6589.github.io/pumpwise/data').replace(/\/$/, '');
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
  // Queensland: free data-consumer API, off until the QLD_FUEL_API_TOKEN secret exists.
  {
    id: 'qld',
    regions: ['qld'],
    everyMinutes: 25,
    minStations: QLD_MIN_STATIONS,
    enabled: () => qldToken() !== null,
    fetch: async (now) => ({ stations: await fetchQld(qldToken() as string, now), tomorrow: false }),
  },
  // Spain: the Ministry republishes every half hour, so every other run (about 12 MB each time).
  { id: 'es', regions: ['es'], everyMinutes: 25, minStations: ES_MIN_STATIONS, enabled: () => true, fetch: async () => ({ stations: await fetchEs(), tomorrow: false }) },
  // France: refreshed about every 10 minutes, so every run (about 1 MB zipped).
  { id: 'fr', regions: ['fr'], everyMinutes: 10, minStations: FR_MIN_STATIONS, enabled: () => true, fetch: async (now) => ({ stations: await fetchFr(now), tomorrow: false }) },
  // Mexico: the CRE lists change a few times a day at most, so every three hours.
  { id: 'mx', regions: ['mx'], everyMinutes: 170, minStations: MX_MIN_STATIONS, enabled: () => true, fetch: async (now) => ({ stations: await fetchMx(now), tomorrow: false }) },
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

async function getJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  return response.ok ? ((await response.json()) as T) : null;
}

/** Every tile of a published feed, a few at a time, sorted into regions. */
async function stationsFromTiles(base: string, meta: FeedMeta): Promise<Map<RegionId, FeedStation[]> | null> {
  const byRegion = new Map<RegionId, FeedStation[]>();
  const keys = Object.keys(meta.tiles);
  for (let i = 0; i < keys.length; i += 16) {
    const tiles = await Promise.all(
      keys.slice(i, i + 16).map((key) => getJson<FeedTile>(`${base}/tiles/${key}.json?v=${encodeURIComponent(meta.generatedAt)}`)),
    );
    if (tiles.some((t) => t === null)) return null;
    for (const tile of tiles as FeedTile[]) {
      for (const station of tile.stations) {
        const list = byRegion.get(station.region) ?? [];
        list.push(station);
        byRegion.set(station.region, list);
      }
    }
  }
  return byRegion;
}

/**
 * The feed that is online now, so sources that are not due (or fail) keep their prices. Read from the
 * newest version's per-region bundles (one file per region); before those exist, from its tiles, or
 * from the previous version on the first run after a new version is introduced.
 */
async function loadPrevious(): Promise<Previous | null> {
  for (const version of [LATEST_FEED_VERSION, LATEST_FEED_VERSION - 1]) {
    const base = `${PUBLIC_DATA}/v${version}`;
    try {
      const meta = await getJson<FeedMeta>(`${base}/meta.json?t=${Date.now()}`);
      if (!meta || meta.v !== version) continue;
      const ids = Object.keys(meta.regions) as RegionId[];
      const bundles = await Promise.all(ids.map((id) => getJson<FeedStation[]>(`${base}/regions/${id}.json?v=${encodeURIComponent(meta.generatedAt)}`)));
      if (bundles.every((b) => Array.isArray(b))) {
        return { meta, byRegion: new Map(ids.map((id, i) => [id, bundles[i] as FeedStation[]])) };
      }
      const byRegion = await stationsFromTiles(base, meta);
      if (byRegion) return { meta, byRegion };
    } catch (error) {
      console.warn(`Could not read the previous feed (v${version}): ${String(error)}`);
    }
  }
  return null;
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

function writeData(feed: BuiltFeed, dataDir: string): void {
  writeJson(join(dataDir, 'meta.json'), feed.meta);
  for (const tile of feed.tiles) writeJson(join(dataDir, 'tiles', `${tile.tile}.json`), tile);
}

/**
 * The site and every published feed version: data/v4 with every region (plus one bundle file per
 * region, for the next run to reuse), data/v3 for Pumpwise 1.1 and data/v2 for 1.0, each limited to
 * the regions its app knows.
 */
export function writeSite(
  stations: FeedStation[],
  regions: Partial<Record<RegionId, RegionStatus>>,
  now: Date,
  target = outDir,
): BuiltFeed[] {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const siteSource = join(root, 'site');
  if (existsSync(siteSource)) cpSync(siteSource, target, { recursive: true });
  writeFileSync(join(target, '.nojekyll'), '');
  const built: BuiltFeed[] = [];
  for (const published of PUBLISHED_FEEDS) {
    const feed = feedForVersion(stations, regions, now, published);
    const dataDir = join(target, 'data', `v${published.version}`);
    writeData(feed, dataDir);
    if (published.version === LATEST_FEED_VERSION) {
      for (const id of Object.keys(feed.meta.regions) as RegionId[]) {
        writeJson(join(dataDir, 'regions', `${id}.json`), stations.filter((s) => s.region === id));
      }
    }
    built.push(feed);
  }
  return built;
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
        for (const id of source.regions) regions[id] = { status: 'error', updatedAt: now.toISOString(), stationCount: 0, tomorrow: false };
      }
    }
  }

  if (stations.length === 0 && failures > 0) {
    throw new Error('No prices from any source; keeping the previous site online.');
  }
  const [feed, ...older] = writeSite(stations, regions, now);
  if (!feed) throw new Error('no feed versions configured');
  console.log(
    `Feed v${feed.meta.v}: ${feed.meta.stationCount} stations, ${feed.meta.priceCount} prices, ${feed.tiles.length} tiles` +
      (fetchedSomething ? '' : ' (all reused)') +
      older.map((f) => `; v${f.meta.v}: ${f.meta.stationCount} stations`).join(''),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
