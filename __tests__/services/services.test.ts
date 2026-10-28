import { Linking } from 'react-native';

import { directionsUrls, openDirections } from '@/services/directions';
import { FeedError, loadArea } from '@/services/feedClient';
import { searchPlaces } from '@/services/placeSearch';

import { mockFeedFetch, notLiveMeta, resetStores } from '../helpers';

const WESTMINSTER = { lat: 51.5072, lng: -0.1276 };

describe('feed client', () => {
  beforeEach(() => resetStores());

  test('downloads only the tiles around the search centre', async () => {
    const log = mockFeedFetch();
    const { meta, stations } = await loadArea(WESTMINSTER, 5);
    expect(meta.status).toBe('live');
    // London stations only; Leeds is in tiles far away.
    expect(stations.length).toBeGreaterThan(20);
    expect(stations.every((s) => s.lat < 52.5)).toBe(true);
    expect(log.urls.some((u) => u.includes('107_'))).toBe(false);
    expect(log.urls[0]).toMatch(/meta\.json\?t=\d+$/);
  });

  test('reuses tiles that have not changed', async () => {
    const log = mockFeedFetch();
    await loadArea(WESTMINSTER, 5);
    const first = log.urls.filter((u) => u.includes('/tiles/')).length;
    await loadArea(WESTMINSTER, 5);
    const second = log.urls.filter((u) => u.includes('/tiles/')).length;
    expect(first).toBeGreaterThan(0);
    expect(second).toBe(first);
  });

  test('a feed that is not live yet returns no stations', async () => {
    mockFeedFetch({ meta: notLiveMeta() });
    const { meta, stations } = await loadArea(WESTMINSTER, 5);
    expect(meta.status).toBe('awaiting-credentials');
    expect(stations).toEqual([]);
  });

  test('no connection is reported as offline', async () => {
    mockFeedFetch({ offline: true });
    await expect(loadArea(WESTMINSTER, 5)).rejects.toMatchObject({ kind: 'offline' });
    await expect(loadArea(WESTMINSTER, 5)).rejects.toBeInstanceOf(FeedError);
  });

  test('an unknown feed version is refused', async () => {
    mockFeedFetch({ meta: { ...notLiveMeta(), v: 99 } });
    await expect(loadArea(WESTMINSTER, 5)).rejects.toMatchObject({ kind: 'unavailable' });
  });
});

describe('place search', () => {
  test('postcodes, outcodes and town names', async () => {
    mockFeedFetch();
    expect(await searchPlaces('LS1 4AP')).toEqual([{ name: 'LS1 4AP', detail: 'Leeds', lat: 53.7981, lng: -1.5472 }]);
    expect(await searchPlaces('ls1')).toEqual([{ name: 'LS1', detail: 'Leeds', lat: 53.7967, lng: -1.5458 }]);
    expect(await searchPlaces('Leeds')).toEqual([{ name: 'Leeds', detail: 'Leeds, Yorkshire and The Humber', lat: 53.7965, lng: -1.5478 }]);
    expect(await searchPlaces('x')).toEqual([]);
  });
});

describe('directions', () => {
  test('builds links for each maps app', () => {
    const to = { lat: 51.5, lng: -0.12 };
    expect(directionsUrls('apple', to, 'A & B').web).toBe('https://maps.apple.com/?daddr=51.5,-0.12&dirflg=d&q=A%20%26%20B');
    expect(directionsUrls('google', to, 'x').native).toBe('comgooglemaps://?daddr=51.5,-0.12&directionsmode=driving');
    expect(directionsUrls('waze', to, 'x').web).toBe('https://waze.com/ul?ll=51.5,-0.12&navigate=yes');
  });

  test('falls back to the web link when the app is not installed', async () => {
    const canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await openDirections('waze', { lat: 51.5, lng: -0.12 }, 'x');
    expect(open).toHaveBeenCalledWith('https://waze.com/ul?ll=51.5,-0.12&navigate=yes');
    canOpen.mockRestore();
    open.mockRestore();
  });
});
