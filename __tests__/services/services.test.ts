import { Linking } from 'react-native';

import { directionsUrls, openDirections } from '@/services/directions';
import { FeedError, loadArea } from '@/services/feedClient';
import { citiesFor, searchPlaces } from '@/services/placeSearch';

import { mockFeedFetch, PERTH, resetStores, waDownMeta } from '../helpers';

describe('feed client', () => {
  beforeEach(() => resetStores());

  test('downloads only the tiles around the search centre', async () => {
    const log = mockFeedFetch();
    const { meta, stations } = await loadArea(PERTH, 8);
    expect(meta.regions.wa?.status).toBe('live');
    // Perth stations only: Bunbury, the remote roadhouse and the UK are in tiles far away.
    expect(stations.length).toBeGreaterThan(20);
    expect(stations.every((s) => s.region === 'wa' && s.lat > -32.5)).toBe(true);
    expect(log.urls.some((u) => u.includes('/tiles/-67_'))).toBe(false);
    expect(log.urls[0]).toMatch(/meta\.json\?t=\d+$/);
  });

  test('reuses tiles that have not changed', async () => {
    const log = mockFeedFetch();
    await loadArea(PERTH, 8);
    const first = log.urls.filter((u) => u.includes('/tiles/')).length;
    await loadArea(PERTH, 8);
    expect(first).toBeGreaterThan(0);
    expect(log.urls.filter((u) => u.includes('/tiles/')).length).toBe(first);
  });

  test('a region with no prices returns no stations', async () => {
    mockFeedFetch({ meta: waDownMeta() });
    const { meta, stations } = await loadArea(PERTH, 8);
    expect(meta.regions.wa?.status).toBe('error');
    expect(stations).toEqual([]);
  });

  test('no connection is reported as offline', async () => {
    mockFeedFetch({ offline: true });
    await expect(loadArea(PERTH, 8)).rejects.toMatchObject({ kind: 'offline' });
    await expect(loadArea(PERTH, 8)).rejects.toBeInstanceOf(FeedError);
  });

  test('an unknown feed version is refused', async () => {
    mockFeedFetch({ meta: { ...waDownMeta(), v: 99 } });
    await expect(loadArea(PERTH, 8)).rejects.toMatchObject({ kind: 'unavailable' });
  });
});

describe('place search', () => {
  test('WA suburbs and postcodes through Apple, inside covered regions only', async () => {
    mockFeedFetch();
    expect(await searchPlaces('Cannington', ['wa'])).toEqual([{ name: 'Cannington', detail: 'Perth, WA', lat: -32.0167, lng: 115.9333 }]);
    expect((await searchPlaces('6000', ['wa']))[0]).toMatchObject({ lat: -31.9535, lng: 115.857 });
    // "Perth" alone finds Perth in Scotland first; the search retries inside Western Australia.
    expect((await searchPlaces('Perth', ['wa']))[0]).toMatchObject({ lat: -31.9523, lng: 115.8613 });
    expect(await searchPlaces('Atlantis', ['wa'])).toEqual([]);
    expect(await searchPlaces('x', ['wa'])).toEqual([]);
  });

  test('UK postcodes through postcodes.io when the UK is covered', async () => {
    mockFeedFetch();
    expect(await searchPlaces('LS1 4AP', ['wa', 'uk'])).toEqual([{ name: 'LS1 4AP', detail: 'Leeds', lat: 53.7981, lng: -1.5472 }]);
    expect(await searchPlaces('ls1', ['uk'])).toEqual([{ name: 'LS1', detail: 'Leeds', lat: 53.7967, lng: -1.5458 }]);
    // Not covered: no UK results while only WA is live.
    expect(await searchPlaces('LS1 4AP', ['wa'])).toEqual([]);
  });

  test('city shortcuts for covered regions', () => {
    expect(citiesFor(['wa'])[0]?.name).toBe('Perth');
    expect(citiesFor(['wa', 'uk']).some((p) => p.name === 'London')).toBe(true);
  });
});

describe('directions', () => {
  test('builds links for each maps app', () => {
    const to = { lat: -31.95, lng: 115.86 };
    expect(directionsUrls('apple', to, 'A & B').web).toBe('https://maps.apple.com/?daddr=-31.95,115.86&dirflg=d&q=A%20%26%20B');
    expect(directionsUrls('google', to, 'x').native).toBe('comgooglemaps://?daddr=-31.95,115.86&directionsmode=driving');
    expect(directionsUrls('waze', to, 'x').web).toBe('https://waze.com/ul?ll=-31.95,115.86&navigate=yes');
  });

  test('falls back to the web link when the app is not installed', async () => {
    const canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await openDirections('waze', { lat: -31.95, lng: 115.86 }, 'x');
    expect(open).toHaveBeenCalledWith('https://waze.com/ul?ll=-31.95,115.86&navigate=yes');
    canOpen.mockRestore();
    open.mockRestore();
  });
});
