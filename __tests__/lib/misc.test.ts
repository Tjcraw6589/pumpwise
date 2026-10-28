import { dailyLabel, formatChange, formatMoney, formatPrice, freshness, timeAgo } from '@/lib/format';
import { distanceKm, regionForRadius } from '@/lib/geo';
import { nearbyPhase, needsReload, RELOAD_AFTER_MS } from '@/lib/nearby';
import { classifyQuery } from '@/lib/places';
import { rankStations } from '@/lib/ranking';
import { fuelChipLabel, fuelOption, regionInfoAt, regionList, REGIONS } from '@/lib/regions';
import {
  economyFromL100,
  economyLabel,
  economyToL100,
  formatDistance,
  KM_PER_MILE,
  radiusLabel,
  sameEconomy,
  sameRadius,
  toKm,
} from '@/lib/units';

const NOW = new Date('2026-10-29T04:00:00Z'); // 12:00 in Perth

describe('format', () => {
  test('prices, money and changes', () => {
    expect(formatPrice(139.9)).toBe('139.9');
    expect(formatPrice(200)).toBe('200.0');
    expect(formatMoney(2.4, '$')).toBe('$2.40');
    expect(formatMoney(-0.5, '£')).toBe('-£0.50');
    expect(formatChange(-4)).toBe('−4.0');
    expect(formatChange(2.25)).toBe('+2.3');
    expect(formatChange(0.01)).toBe('±0.0');
  });
  test('time ago', () => {
    expect(timeAgo('2026-10-29T03:59:30Z', NOW)).toBe('just now');
    expect(timeAgo('2026-10-29T03:35:00Z', NOW)).toBe('25 min ago');
    expect(timeAgo('2026-10-29T01:00:00Z', NOW)).toBe('3 h ago');
    expect(timeAgo('2026-10-28T02:00:00Z', NOW)).toBe('1 day ago');
    expect(timeAgo('garbage', NOW)).toBe('time unknown');
  });
  test('freshness of reported prices', () => {
    expect(freshness('2026-10-29T01:00:00Z', NOW)).toBe('fresh');
    expect(freshness('2026-10-22T01:00:00Z', NOW)).toBe('recent');
    expect(freshness('2026-10-01T01:00:00Z', NOW)).toBe('old');
  });
  test('daily prices in Perth', () => {
    const perth = 480;
    expect(dailyLabel('2026-10-28T22:00:00.000Z', NOW, perth)).toEqual({ text: "Today's price", level: 'fresh' });
    // 04:00 in Perth: the new price starts at 6am.
    expect(dailyLabel('2026-10-28T22:00:00.000Z', new Date('2026-10-28T20:00:00Z'), perth)).toEqual({ text: 'New price from 6am', level: 'fresh' });
    expect(dailyLabel('2026-10-29T22:00:00.000Z', NOW, perth)).toEqual({ text: 'Price from 6am tomorrow', level: 'fresh' });
    expect(dailyLabel('2026-10-26T22:00:00.000Z', NOW, perth)).toEqual({ text: 'Price from Tuesday', level: 'recent' });
    expect(dailyLabel('2026-09-26T22:00:00.000Z', NOW, perth).level).toBe('old');
  });
});

describe('units', () => {
  test('distances in each region', () => {
    expect(formatDistance(0.45, 'km')).toBe('450 m');
    expect(formatDistance(2.345, 'km')).toBe('2.3 km');
    expect(formatDistance(12.6, 'km')).toBe('13 km');
    expect(formatDistance(0.1, 'mi')).toBe('Under 0.1 mi');
    expect(formatDistance(2 * KM_PER_MILE, 'mi')).toBe('2.0 mi');
    expect(radiusLabel(8, 'km')).toBe('8 km');
    expect(radiusLabel(toKm(5, 'mi'), 'mi')).toBe('5 mi');
    expect(sameRadius(8, 5, 'mi')).toBe(true); // the default is both 8 km and 5 mi
    expect(sameRadius(8, 8, 'km')).toBe(true);
    expect(sameRadius(8, 10, 'km')).toBe(false);
  });
  test('fuel economy', () => {
    expect(economyToL100(8, 'l100')).toBe(8);
    expect(economyToL100(45, 'mpg')).toBeCloseTo(6.28, 2);
    expect(economyFromL100(6.28, 'mpg')).toBeCloseTo(45, 0);
    expect(sameEconomy(economyToL100(45, 'mpg'), 45, 'mpg')).toBe(true);
    expect(economyLabel(45, 'mpg')).toBe('45 mpg');
    expect(economyLabel(8, 'l100')).toBe('8 L/100km');
  });
});

describe('regions', () => {
  test('each region names fuels its own way', () => {
    expect(fuelChipLabel(REGIONS.wa, 'regular')).toBe('Unleaded 91 · ULP');
    expect(fuelChipLabel(REGIONS.uk, 'regular')).toBe('Unleaded · E10');
    expect(fuelChipLabel(REGIONS.wa, 'lpg')).toBe('LPG');
    // A fuel the region doesn't sell falls back to its first fuel.
    expect(fuelOption(REGIONS.wa, 'hvo').kind).toBe('regular');
    expect(regionInfoAt(-31.95, 115.86)?.id).toBe('wa');
    expect(regionInfoAt(40.7, -74)).toBeNull();
  });
  test('names regions for sentences', () => {
    expect(regionList(['wa'])).toBe('Western Australia');
    expect(regionList(['wa', 'uk'])).toBe('Western Australia and the United Kingdom');
    expect(regionList([])).toBe('Western Australia');
  });
});

describe('geo', () => {
  test('Perth to Fremantle is about 17 km in a straight line', () => {
    const d = distanceKm({ lat: -31.9523, lng: 115.8613 }, { lat: -32.0569, lng: 115.7439 });
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(18);
  });
  test('map regions grow with the radius', () => {
    expect(regionForRadius({ lat: -31.9, lng: 115.8 }, 16).latitudeDelta).toBeGreaterThan(regionForRadius({ lat: -31.9, lng: 115.8 }, 3).latitudeDelta);
  });
});

describe('places', () => {
  test('recognises postcodes and names', () => {
    expect(classifyQuery('6000')).toEqual({ kind: 'au-postcode', value: '6000' });
    expect(classifyQuery('ls1 4ap')).toEqual({ kind: 'uk-postcode', value: 'LS14AP' });
    expect(classifyQuery('m1')).toEqual({ kind: 'uk-outcode', value: 'M1' });
    expect(classifyQuery('  Cannington ')).toEqual({ kind: 'name', value: 'Cannington' });
    expect(classifyQuery('a')).toBeNull();
  });
});

describe('needsReload', () => {
  const center = { lat: -31.95, lng: 115.86 };
  const loaded = { ...center, radiusKm: 8 };
  const t = NOW.getTime();
  test('loads the first time, after five minutes, after a bigger area or a move', () => {
    expect(needsReload(null, null, center, 8, t)).toBe(true);
    expect(needsReload(loaded, t, center, 8, t + 60_000)).toBe(false);
    expect(needsReload(loaded, t, center, 8, t + RELOAD_AFTER_MS + 1)).toBe(true);
    expect(needsReload(loaded, t, center, 15, t)).toBe(true);
    expect(needsReload(loaded, t, center, 5, t)).toBe(false);
    expect(needsReload(loaded, t, { lat: -31.92, lng: 115.86 }, 8, t)).toBe(true);
    expect(needsReload(loaded, t, { lat: -31.945, lng: 115.86 }, 8, t)).toBe(false);
  });
});

describe('nearbyPhase', () => {
  const ranking = rankStations(
    [
      {
        id: 'wa-a',
        region: 'wa',
        name: 'A',
        brand: '',
        address: '',
        town: '',
        postcode: '',
        lat: -31.95,
        lng: 115.86,
        hours: null,
        tags: [],
        prices: { regular: { p: 199.9, at: '2026-10-28T22:00:00.000Z' } },
      },
    ],
    { center: { lat: -31.95, lng: 115.86 }, fuel: 'regular', radiusKm: 8, fillLitres: 40, economyL100: 8, includeMembersOnly: false, now: NOW },
  );
  const base = {
    mode: 'gps' as const,
    permission: 'granted' as const,
    center: { lat: -31.95, lng: 115.86 },
    locationError: null,
    feedStatus: 'ready' as const,
    liveRegions: ['wa'] as const,
    downRegions: [] as const,
    hasStations: true,
    ranking,
  };
  test('walks through every state', () => {
    expect(nearbyPhase(base)).toBe('ready');
    expect(nearbyPhase({ ...base, permission: 'checking' })).toBe('locating');
    expect(nearbyPhase({ ...base, permission: 'undetermined' })).toBe('need-permission');
    expect(nearbyPhase({ ...base, permission: 'denied' })).toBe('denied');
    expect(nearbyPhase({ ...base, center: null })).toBe('locating');
    expect(nearbyPhase({ ...base, center: null, locationError: 'unavailable' })).toBe('location-error');
    // New York is in no region; Sydney isn't covered yet; London is a region the feed doesn't serve now.
    expect(nearbyPhase({ ...base, center: { lat: 40.7, lng: -74 } })).toBe('not-covered');
    expect(nearbyPhase({ ...base, center: { lat: -33.87, lng: 151.21 } })).toBe('not-covered');
    expect(nearbyPhase({ ...base, center: { lat: 51.5, lng: -0.12 } })).toBe('not-covered');
    expect(nearbyPhase({ ...base, liveRegions: [], downRegions: ['wa'] })).toBe('region-down');
    // Before the feed has loaded once, a covered place just waits for it.
    expect(nearbyPhase({ ...base, liveRegions: null, feedStatus: 'loading', hasStations: false, ranking: null })).toBe('loading');
    expect(nearbyPhase({ ...base, feedStatus: 'error', hasStations: false, ranking: null })).toBe('error');
    expect(nearbyPhase({ ...base, feedStatus: 'ready', hasStations: false, ranking: null })).toBe('empty');
    expect(nearbyPhase({ ...base, ranking: { ...ranking, inArea: [] } })).toBe('empty');
    // A chosen place does not need location permission.
    expect(nearbyPhase({ ...base, mode: 'place', permission: 'denied' })).toBe('ready');
  });
});
