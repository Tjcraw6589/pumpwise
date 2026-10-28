import { formatMiles, formatPence, formatPounds, freshness, timeAgo } from '@/lib/format';
import { fuelInfo, FUELS } from '@/lib/fuels';
import { distanceMiles, regionForRadius } from '@/lib/geo';
import { nearbyPhase, needsReload, RELOAD_AFTER_MS } from '@/lib/nearby';
import { classifyQuery } from '@/lib/places';
import { rankStations } from '@/lib/ranking';

const NOW = new Date('2026-10-28T12:00:00Z');

describe('format', () => {
  test('prices, pounds and miles', () => {
    expect(formatPence(139.9)).toBe('139.9');
    expect(formatPence(140)).toBe('140.0');
    expect(formatPounds(2.4)).toBe('£2.40');
    expect(formatPounds(-0.5)).toBe('-£0.50');
    expect(formatMiles(0.05)).toBe('Under 0.1 mi');
    expect(formatMiles(2.345)).toBe('2.3 mi');
    expect(formatMiles(12.6)).toBe('13 mi');
  });
  test('time ago', () => {
    expect(timeAgo('2026-10-28T11:59:30Z', NOW)).toBe('just now');
    expect(timeAgo('2026-10-28T11:35:00Z', NOW)).toBe('25 min ago');
    expect(timeAgo('2026-10-28T09:00:00Z', NOW)).toBe('3 h ago');
    expect(timeAgo('2026-10-27T10:00:00Z', NOW)).toBe('1 day ago');
    expect(timeAgo('2026-10-20T12:00:00Z', NOW)).toBe('8 days ago');
    expect(timeAgo('garbage', NOW)).toBe('time unknown');
  });
  test('freshness levels', () => {
    expect(freshness('2026-10-28T08:00:00Z', NOW)).toBe('fresh');
    expect(freshness('2026-10-21T08:00:00Z', NOW)).toBe('recent');
    expect(freshness('2026-10-01T08:00:00Z', NOW)).toBe('old');
  });
});

describe('fuels', () => {
  test('four common fuels and a fallback', () => {
    expect(FUELS.filter((f) => f.common).map((f) => f.code)).toEqual(['E10', 'E5', 'B7', 'SDV']);
    expect(fuelInfo('SDV').pumpCode).toBe('B7+');
  });
});

describe('geo', () => {
  test('London to Leeds is about 170 miles in a straight line', () => {
    expect(distanceMiles({ lat: 51.5072, lng: -0.1276 }, { lat: 53.8008, lng: -1.5491 })).toBeGreaterThan(165);
    expect(distanceMiles({ lat: 51.5072, lng: -0.1276 }, { lat: 53.8008, lng: -1.5491 })).toBeLessThan(175);
  });
  test('map regions grow with the radius', () => {
    expect(regionForRadius({ lat: 51.5, lng: 0 }, 10).latitudeDelta).toBeGreaterThan(regionForRadius({ lat: 51.5, lng: 0 }, 2).latitudeDelta);
  });
});

describe('places', () => {
  test('recognises postcodes, outcodes and names', () => {
    expect(classifyQuery('ls1 4ap')).toEqual({ kind: 'postcode', value: 'LS14AP' });
    expect(classifyQuery('SW1A 1AA')).toEqual({ kind: 'postcode', value: 'SW1A1AA' });
    expect(classifyQuery('m1')).toEqual({ kind: 'outcode', value: 'M1' });
    expect(classifyQuery('  Harrogate ')).toEqual({ kind: 'name', value: 'Harrogate' });
    expect(classifyQuery('a')).toBeNull();
  });
});

describe('needsReload', () => {
  const center = { lat: 51.5, lng: -0.1 };
  const loaded = { ...center, radiusMiles: 5 };
  const t = NOW.getTime();
  test('loads the first time, after five minutes, after a bigger area or a move', () => {
    expect(needsReload(null, null, center, 5, t)).toBe(true);
    expect(needsReload(loaded, t, center, 5, t + 60_000)).toBe(false);
    expect(needsReload(loaded, t, center, 5, t + RELOAD_AFTER_MS + 1)).toBe(true);
    expect(needsReload(loaded, t, center, 10, t)).toBe(true);
    expect(needsReload(loaded, t, center, 3, t)).toBe(false);
    expect(needsReload(loaded, t, { lat: 51.53, lng: -0.1 }, 5, t)).toBe(true);
    expect(needsReload(loaded, t, { lat: 51.51, lng: -0.1 }, 5, t)).toBe(false);
  });
});

describe('nearbyPhase', () => {
  const base = {
    mode: 'gps' as const,
    permission: 'granted' as const,
    center: { lat: 51.5, lng: -0.1 },
    locationError: null,
    feedStatus: 'ready' as const,
    hasStations: true,
    ranking: rankStations(
      [{ id: 'a', name: 'A', brand: '', address: '', town: '', postcode: '', lat: 51.5, lng: -0.1, hours: null, tags: [], prices: { E10: { p: 140, at: NOW.toISOString() } } }],
      { center: { lat: 51.5, lng: -0.1 }, fuel: 'E10', radiusMiles: 5, fillLitres: 40, mpg: 45, now: NOW },
    ),
  };
  test('walks through every state', () => {
    expect(nearbyPhase(base)).toBe('ready');
    expect(nearbyPhase({ ...base, permission: 'checking' })).toBe('locating');
    expect(nearbyPhase({ ...base, permission: 'undetermined' })).toBe('need-permission');
    expect(nearbyPhase({ ...base, permission: 'denied' })).toBe('denied');
    expect(nearbyPhase({ ...base, center: null })).toBe('locating');
    expect(nearbyPhase({ ...base, center: null, locationError: 'unavailable' })).toBe('location-error');
    expect(nearbyPhase({ ...base, center: { lat: 40.7, lng: -74 } })).toBe('outside-uk');
    expect(nearbyPhase({ ...base, feedStatus: 'not-live', hasStations: false })).toBe('not-live');
    expect(nearbyPhase({ ...base, feedStatus: 'loading', hasStations: false, ranking: null })).toBe('loading');
    expect(nearbyPhase({ ...base, feedStatus: 'error', hasStations: false, ranking: null })).toBe('error');
    expect(nearbyPhase({ ...base, feedStatus: 'ready', hasStations: false, ranking: null })).toBe('empty');
    expect(nearbyPhase({ ...base, ranking: { ...base.ranking, inArea: [] } })).toBe('empty');
    // A chosen place does not need location permission.
    expect(nearbyPhase({ ...base, mode: 'place', permission: 'denied' })).toBe('ready');
  });
});
