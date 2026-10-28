import type { BuiltFeed, FeedMeta } from '@/lib/feed';
import { emptyMeta } from '@/lib/feed';
import { clearFeedCache } from '@/services/feedClient';
import { useLive } from '@/store/useLive';
import { createDefaultSettings, useStore } from '@/store/useStore';

import { fixtureFeed } from '../scripts/feed/fixture-data.ts';

export const FIXTURE_NOW = new Date();

export interface FetchLog {
  urls: string[];
}

function json(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/**
 * Serves a feed (the made-up fixture by default) to anything that calls fetch, and answers
 * postcodes.io searches. Returns the list of requested URLs.
 */
export function mockFeedFetch(options: { feed?: BuiltFeed; meta?: FeedMeta; offline?: boolean } = {}): FetchLog {
  const feed = options.feed ?? fixtureFeed(FIXTURE_NOW);
  const meta = options.meta ?? feed.meta;
  const log: FetchLog = { urls: [] };
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    log.urls.push(url);
    if (options.offline) throw new TypeError('Network request failed');
    if (url.includes('/meta.json')) return json(meta);
    const tile = /\/tiles\/([^/?]+)\.json/.exec(url)?.[1];
    if (tile) {
      const found = feed.tiles.find((t) => t.tile === tile);
      return found ? json(found) : json({}, 404);
    }
    if (url.includes('api.postcodes.io/places')) {
      return json({ result: [{ name_1: 'Leeds', local_type: 'City', county_unitary: 'Leeds', region: 'Yorkshire and The Humber', latitude: 53.7965, longitude: -1.5478 }] });
    }
    if (url.includes('api.postcodes.io/postcodes/')) {
      return json({ result: { postcode: 'LS1 4AP', latitude: 53.7981, longitude: -1.5472, admin_district: 'Leeds' } });
    }
    if (url.includes('api.postcodes.io/outcodes/')) {
      return json({ result: { outcode: 'LS1', latitude: 53.7967, longitude: -1.5458, admin_district: ['Leeds'] } });
    }
    return json({}, 404);
  }) as unknown as typeof fetch;
  return log;
}

export function notLiveMeta(): FeedMeta {
  return emptyMeta(FIXTURE_NOW);
}

/** Puts both stores back to a known state. Call in beforeEach. */
export function resetStores(partial: { onboardingComplete?: boolean } = {}): void {
  const settings = createDefaultSettings();
  settings.onboardingComplete = partial.onboardingComplete ?? false;
  useStore.setState({ settings, hydrated: true });
  useLive.setState({
    permission: 'checking',
    canAskAgain: true,
    position: null,
    locating: false,
    locationError: null,
    areaName: null,
    feedStatus: 'idle',
    refreshing: false,
    feedError: null,
    meta: null,
    stations: [],
    loadedFor: null,
    loadedAt: null,
    refreshToken: 0,
  });
  clearFeedCache();
}
