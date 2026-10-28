// Builds the public Pumpwise price feed from the UK Government Fuel Finder API and writes the
// whole GitHub Pages site (legal pages + data) to out/site.
//
// GitHub runs this every 15 minutes (.github/workflows/feed.yml). To run it by hand:
//   FUEL_FINDER_CLIENT_ID=... FUEL_FINDER_CLIENT_SECRET=... npm run feed
// Without the two keys it still writes the site, with an empty feed marked "awaiting-credentials".
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildFeed, emptyMeta, type BuiltFeed, type FeedMeta } from '../../src/lib/feed.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = process.env.FEED_OUT_DIR ?? join(root, 'out', 'site');
const BASE = (process.env.FUEL_FINDER_BASE_URL ?? 'https://www.fuel-finder.service.gov.uk').replace(/\/$/, '');
const USER_AGENT = 'Pumpwise-feed/1.0 (+https://tjcraw6589.github.io/pumpwise/)';
/** Requests are spaced out and sent one at a time, well inside the API's 60-a-minute limit. */
const MIN_GAP_MS = 1100;
const BATCH_SIZE = 500;
const MAX_BATCHES = 100;
/** Fewer forecourts than this means something broke upstream: fail and keep the last good feed online. */
const MIN_STATIONS = 1000;

let lastRequestAt = 0;

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url: string, init: RequestInit, attempt = 1): Promise<Response> {
  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await pause(wait);
  lastRequestAt = Date.now();
  try {
    const response = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...init.headers },
      signal: AbortSignal.timeout(60_000),
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      console.warn(`${response.status} from ${url}, retrying (attempt ${attempt + 1})`);
      await pause(5000 * 2 ** (attempt - 1));
      return request(url, init, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < 4) {
      console.warn(`Network error for ${url}: ${String(error)}, retrying`);
      await pause(5000 * 2 ** (attempt - 1));
      return request(url, init, attempt + 1);
    }
    throw error;
  }
}

function unwrap(body: unknown): unknown {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  return body;
}

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  const url = `${BASE}/api/v1/oauth/generate_access_token`;
  const bodies = [
    { client_id: clientId, client_secret: clientSecret },
    { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'fuelfinder.read' },
  ];
  let lastError = '';
  for (const body of bodies) {
    const response = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status === 429) throw new Error('Token endpoint locked us out (429). Check the client id and secret.');
    if (response.ok) {
      const data = unwrap(await response.json()) as { access_token?: unknown } | null;
      if (data && typeof data.access_token === 'string') return data.access_token;
      lastError = 'token response had no access_token';
      continue;
    }
    lastError = `${response.status} ${response.statusText}`;
  }
  throw new Error(`Could not get a Fuel Finder token: ${lastError}`);
}

async function fetchAll(path: string, token: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let batch = 1; batch <= MAX_BATCHES; batch++) {
    const response = await request(`${BASE}${path}?batch-number=${batch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 404) break;
    if (!response.ok) throw new Error(`${path} batch ${batch}: ${response.status} ${response.statusText}`);
    const page = unwrap(await response.json());
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    if (page.length < BATCH_SIZE) break;
  }
  console.log(`${path}: ${rows.length} records`);
  return rows;
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

export function writeSite(meta: FeedMeta, feed: BuiltFeed | null, target = outDir): void {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const siteSource = join(root, 'site');
  if (existsSync(siteSource)) cpSync(siteSource, target, { recursive: true });
  writeFileSync(join(target, '.nojekyll'), '');
  const dataDir = join(target, 'data', 'v1');
  writeJson(join(dataDir, 'meta.json'), meta);
  for (const tile of feed?.tiles ?? []) writeJson(join(dataDir, 'tiles', `${tile.tile}.json`), tile);
}

async function main(): Promise<void> {
  const clientId = process.env.FUEL_FINDER_CLIENT_ID?.trim();
  const clientSecret = process.env.FUEL_FINDER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.warn('No Fuel Finder keys set: publishing the site with an empty feed (status awaiting-credentials).');
    writeSite(emptyMeta(new Date()), null);
    return;
  }

  const token = await getToken(clientId, clientSecret);
  const stations = await fetchAll('/api/v1/pfs', token);
  const prices = await fetchAll('/api/v1/pfs/fuel-prices', token);
  const feed = buildFeed(stations, prices, new Date());
  console.log(
    `Feed: ${feed.meta.stationCount} forecourts with prices, ${feed.meta.priceCount} prices, ${feed.tiles.length} tiles`,
  );
  if (feed.meta.stationCount < MIN_STATIONS) {
    throw new Error(`Only ${feed.meta.stationCount} forecourts came back; keeping the previous feed online.`);
  }
  writeSite(feed.meta, feed);
  console.log(`Wrote ${outDir}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
