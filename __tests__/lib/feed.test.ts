import {
  buildFeed,
  emptyMeta,
  isInUK,
  normalizePence,
  normalizePrices,
  normalizeStation,
  parseHours,
  TILE_DEG,
  tileKey,
  tilesForArea,
  tidyName,
} from '@/lib/feed';

import { fixtureFeed, fixtureRecords } from '../../scripts/feed/fixture-data.ts';

const NOW = new Date('2026-10-28T12:00:00Z');

function station(overrides: Record<string, unknown> = {}) {
  return {
    node_id: 'abc',
    trading_name: 'TESCO EXTRA ST. ALBANS',
    brand_name: 'TESCO',
    temporary_closure: false,
    permanent_closure: false,
    is_motorway_service_station: false,
    is_supermarket_service_station: true,
    amenities: ['customer_toilets', 'car_wash', 'something_new'],
    location: { address_line_1: '1 HIGH STREET', address_line_2: '', city: 'ST ALBANS', postcode: 'al1 1aa', latitude: '51.7520', longitude: -0.33601234 },
    opening_times: { usual_days: { monday: { open: '06:00:00', close: '22:00:00', is_24_hours: false } } },
    ...overrides,
  };
}

describe('tidyName', () => {
  test('title-cases names sent in capitals and keeps short brand codes', () => {
    expect(tidyName('TESCO EXTRA ST. ALBANS')).toBe('Tesco Extra St. Albans');
    expect(tidyName('BP CONNECT M25 J10')).toBe('BP Connect M25 J10');
    expect(tidyName("SAINSBURY'S PETROL")).toBe("Sainsbury's Petrol");
    expect(tidyName("O'NEILL'S GARAGE")).toBe("O'Neill's Garage");
    expect(tidyName('ESSO (ON THE RUN)')).toBe('Esso (On The Run)');
  });
  test('leaves mixed case alone and squashes spaces', () => {
    expect(tidyName('  Esso   Kings Cross ')).toBe('Esso Kings Cross');
  });
});

describe('parseHours', () => {
  test('reads usual days, 24 hours and closed days', () => {
    const hours = parseHours({
      usual_days: {
        monday: { open: '06:00:00', close: '22:00:00', is_24_hours: false },
        tuesday: { is_24_hours: true },
        wednesday: { open: '00:00:00', close: '00:00:00', is_24_hours: false },
        thursday: { open: '07:30', close: '07:30' },
      },
    });
    expect(hours).toEqual(['0600-2200', '24h', '24h', 'closed', 'unknown', 'unknown', 'unknown']);
  });
  test('returns null when nothing usable is given', () => {
    expect(parseHours(undefined)).toBeNull();
    expect(parseHours({ usual_days: { monday: { open: 'later' } } })).toBeNull();
  });
});

describe('normalizeStation', () => {
  test('tidies a forecourt record', () => {
    expect(normalizeStation(station())).toEqual({
      id: 'abc',
      name: 'Tesco Extra St. Albans',
      brand: 'Tesco',
      address: '1 High Street',
      town: 'St Albans',
      postcode: 'AL1 1AA',
      lat: 51.752,
      lng: -0.33601,
      hours: ['0600-2200', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown'],
      tags: ['supermarket', 'toilets', 'car-wash'],
    });
  });
  test('drops closed sites, missing ids and locations outside the UK', () => {
    expect(normalizeStation(station({ permanent_closure: true }))).toBeNull();
    expect(normalizeStation(station({ temporary_closure: true }))).toBeNull();
    expect(normalizeStation(station({ node_id: '' }))).toBeNull();
    expect(normalizeStation(station({ location: { latitude: 48.5, longitude: -5.5 } }))).toBeNull();
    expect(normalizeStation(station({ location: { latitude: 'x', longitude: 1 } }))).toBeNull();
    expect(normalizeStation('nonsense')).toBeNull();
  });
  test('falls back to the brand when there is no trading name', () => {
    expect(normalizeStation(station({ trading_name: '' }))?.name).toBe('Tesco');
  });
});

describe('normalizePence', () => {
  test('accepts pence and pounds, numbers and strings', () => {
    expect(normalizePence(139.9)).toBe(139.9);
    expect(normalizePence('142.94')).toBe(142.9);
    expect(normalizePence(1.399)).toBe(139.9);
  });
  test('rejects reporting mistakes', () => {
    expect(normalizePence(13)).toBeNull();
    expect(normalizePence(1500)).toBeNull();
    expect(normalizePence(0)).toBeNull();
    expect(normalizePence('')).toBeNull();
    expect(normalizePence(null)).toBeNull();
  });
});

describe('normalizePrices', () => {
  test('maps fuel types to pump codes and keeps the newest of each', () => {
    const result = normalizePrices(
      {
        node_id: 'abc',
        fuel_prices: [
          { fuel_type: 'E10', price: 139.9, price_last_updated: '2026-10-28T10:00:00Z' },
          { fuel_type: 'E10', price: 138.9, price_last_updated: '2026-10-28T11:00:00Z' },
          { fuel_type: 'B7_STANDARD', price: '145.9', price_last_updated: '2026-10-27T09:00:00Z' },
          { fuel_type: 'B7_PREMIUM', price: 159.9, price_change_effective_timestamp: '2026-10-27T09:00:00Z' },
          { fuel_type: 'LPG', price: 89.9, price_last_updated: '2026-10-27T09:00:00Z' },
          { fuel_type: 'E5', price: 13, price_last_updated: '2026-10-27T09:00:00Z' },
          { fuel_type: 'HVO', price: 170, price_last_updated: 'not a date' },
        ],
      },
      NOW,
    );
    expect(result).toEqual({
      id: 'abc',
      prices: {
        E10: { p: 138.9, at: '2026-10-28T11:00:00.000Z' },
        B7: { p: 145.9, at: '2026-10-27T09:00:00.000Z' },
        SDV: { p: 159.9, at: '2026-10-27T09:00:00.000Z' },
      },
    });
  });
  test('treats a time in the future as now', () => {
    const result = normalizePrices({ node_id: 'x', fuel_prices: [{ fuel_type: 'E10', price: 140, price_last_updated: '2027-01-01T00:00:00Z' }] }, NOW);
    expect(result?.prices.E10?.at).toBe(NOW.toISOString());
  });
  test('ignores records without an id or price list', () => {
    expect(normalizePrices({ fuel_prices: [] }, NOW)).toBeNull();
    expect(normalizePrices({ node_id: 'x' }, NOW)).toBeNull();
  });
});

describe('tiles', () => {
  test('tile keys are half-degree squares', () => {
    expect(TILE_DEG).toBe(0.5);
    expect(tileKey(51.5072, -0.1276)).toBe('103_-1');
    expect(tileKey(53.8008, -1.5491)).toBe('107_-4');
  });
  test('the tiles for an area cover every point inside it', () => {
    const center = { lat: 51.49, lng: -0.01 };
    const keys = tilesForArea(center.lat, center.lng, 10);
    for (const [dLat, dLng] of [
      [0.14, 0],
      [-0.14, 0],
      [0, 0.23],
      [0, -0.23],
    ] as const) {
      expect(keys).toContain(tileKey(center.lat + dLat, center.lng + dLng));
    }
  });
  test('UK bounds include Shetland and Belfast but not France', () => {
    expect(isInUK(60.15, -1.15)).toBe(true);
    expect(isInUK(54.6, -5.93)).toBe(true);
    expect(isInUK(48.85, 2.35)).toBe(false);
  });
});

describe('buildFeed', () => {
  test('joins forecourts with prices, groups them in tiles and rejects bad records', () => {
    const feed = fixtureFeed(NOW);
    expect(feed.meta.status).toBe('live');
    expect(feed.meta.stationCount).toBe(54);
    expect(feed.meta.generatedAt).toBe(NOW.toISOString());
    const all = feed.tiles.flatMap((t) => t.stations);
    expect(all).toHaveLength(54);
    expect(all.find((s) => s.id === 'fixture-closed')).toBeUndefined();
    expect(all.find((s) => s.id === 'fixture-sea')).toBeUndefined();
    // The 13p super unleaded mistake for fixture-001 is dropped, not merged.
    const first = all.find((s) => s.id === 'fixture-001');
    expect(first?.prices.E5).toBeUndefined();
    for (const tile of feed.tiles) {
      expect(feed.meta.tiles[tile.tile]).toBe(tile.stations.length);
      for (const s of tile.stations) expect(tileKey(s.lat, s.lng)).toBe(tile.tile);
    }
  });
  test('leaves out forecourts with no valid price', () => {
    const { stations } = fixtureRecords(NOW);
    expect(buildFeed(stations, [], NOW).meta.stationCount).toBe(0);
  });
  test('an empty feed says it is waiting for credentials', () => {
    expect(emptyMeta(NOW)).toMatchObject({ status: 'awaiting-credentials', stationCount: 0, tiles: {} });
  });
});
