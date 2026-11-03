import {
  auEasternOffsetMinutes,
  buildFeed,
  cleanPrice,
  FEED_VERSION,
  LEGACY_VERSION,
  legacyFeed,
  groupIntoTiles,
  hashId,
  regionAt,
  TILE_DEG,
  tileKey,
  tilesForArea,
  tidyName,
} from '@/lib/feed';

import { fixtureFeed, nswFixtureResponse, nswLocalTime, ukFixtureRecords, waFixtureFeeds, waFixtureRss, waPriceDate } from '../../scripts/feed/fixture-data.ts';
import { buildNswStations, NSW_PRICES_URL, parseNswTime, requestTimestamp, splitAddress } from '../../scripts/feed/sources/nsw.ts';
import { buildUkStations, normalizeUkPrices, normalizeUkStation, parseUkHours } from '../../scripts/feed/sources/uk.ts';
import {
  buildWaStations,
  decodeEntities,
  parseRss,
  parseWaHours,
  tomorrowPublished,
  waPriceStart,
  waRefetchMoments,
  waTags,
} from '../../scripts/feed/sources/wa.ts';

const NOW = new Date('2026-10-28T12:00:00Z');

describe('shared helpers', () => {
  test('tidyName title-cases capitals and keeps short brand codes', () => {
    expect(tidyName('TESCO EXTRA ST. ALBANS')).toBe('Tesco Extra St. Albans');
    expect(tidyName('BP CONNECT M25 J10')).toBe('BP Connect M25 J10');
    expect(tidyName("SAINSBURY'S PETROL")).toBe("Sainsbury's Petrol");
    expect(tidyName("O'NEILL'S GARAGE")).toBe("O'Neill's Garage");
    expect(tidyName('ESSO (ON THE RUN)')).toBe('Esso (On The Run)');
    expect(tidyName('VIBE KWINANA OPT')).toBe('Vibe Kwinana OPT');
    expect(tidyName('  Esso   Kings Cross ')).toBe('Esso Kings Cross');
  });

  test('cleanPrice keeps sensible prices and drops reporting mistakes', () => {
    expect(cleanPrice(139.9, 80, 300)).toBe(139.9);
    expect(cleanPrice('142.94', 80, 300)).toBe(142.9);
    expect(cleanPrice(1.999, 100, 500)).toBe(199.9);
    expect(cleanPrice(13, 80, 300)).toBeNull();
    expect(cleanPrice(1500, 80, 300)).toBeNull();
    expect(cleanPrice('', 80, 300)).toBeNull();
    expect(cleanPrice(null, 80, 300)).toBeNull();
  });

  test('hashId is stable and short', () => {
    expect(hashId('BURK MALAGA|1 HARLOND AVE|MALAGA')).toBe(hashId('BURK MALAGA|1 HARLOND AVE|MALAGA'));
    expect(hashId('a')).not.toBe(hashId('b'));
    expect(hashId('anything').length).toBeLessThanOrEqual(7);
  });

  test('regions by location', () => {
    expect(regionAt(-31.95, 115.86)).toBe('wa'); // Perth
    expect(regionAt(-17.96, 122.24)).toBe('wa'); // Broome
    expect(regionAt(-33.87, 151.21)).toBe('nsw'); // Sydney
    expect(regionAt(-35.28, 149.13)).toBe('nsw'); // Canberra: in NSW FuelCheck
    expect(regionAt(-42.88, 147.33)).toBe('tas'); // Hobart
    expect(regionAt(-37.81, 144.96)).toBeNull(); // Melbourne
    expect(regionAt(-27.47, 153.03)).toBeNull(); // Brisbane
    expect(regionAt(-34.93, 138.6)).toBeNull(); // Adelaide
    expect(regionAt(51.5, -0.12)).toBe('uk');
    expect(regionAt(54.6, -5.93)).toBe('uk'); // Belfast
    expect(regionAt(48.85, 2.35)).toBeNull(); // Paris
  });

  test('tiles are half-degree squares and cover every point of an area', () => {
    expect(TILE_DEG).toBe(0.5);
    expect(tileKey(51.5072, -0.1276)).toBe('103_-1');
    expect(tileKey(-31.9523, 115.8613)).toBe('-64_231');
    const center = { lat: -31.98, lng: 115.99 };
    const keys = tilesForArea(center.lat, center.lng, 16);
    for (const [dLat, dLng] of [
      [0.14, 0],
      [-0.14, 0],
      [0, 0.16],
      [0, -0.16],
    ] as const) {
      expect(keys).toContain(tileKey(center.lat + dLat, center.lng + dLng));
    }
  });
});

describe('UK source', () => {
  const record = {
    node_id: 'abc',
    trading_name: 'TESCO EXTRA ST. ALBANS',
    brand_name: 'TESCO',
    is_supermarket_service_station: true,
    amenities: ['customer_toilets', 'car_wash', 'something_new'],
    location: { address_line_1: '1 HIGH STREET', city: 'ST ALBANS', postcode: 'al1 1aa', latitude: '51.7520', longitude: -0.33601234 },
    opening_times: { usual_days: { monday: { open: '06:00:00', close: '22:00:00', is_24_hours: false } } },
  };

  test('reads a forecourt', () => {
    expect(normalizeUkStation(record)).toMatchObject({
      id: 'uk-abc',
      region: 'uk',
      name: 'Tesco Extra St. Albans',
      brand: 'Tesco',
      address: '1 High Street',
      town: 'St Albans',
      postcode: 'AL1 1AA',
      lat: 51.752,
      lng: -0.33601,
      tags: ['supermarket', 'toilets', 'car-wash'],
    });
    expect(normalizeUkStation({ ...record, permanent_closure: true })).toBeNull();
    expect(normalizeUkStation({ ...record, location: { latitude: 48.5, longitude: -5.5 } })).toBeNull();
  });

  test('reads opening hours', () => {
    expect(
      parseUkHours({
        usual_days: {
          monday: { open: '06:00:00', close: '22:00:00' },
          tuesday: { is_24_hours: true },
          wednesday: { open: '00:00:00', close: '00:00:00' },
          thursday: { open: '07:30', close: '07:30' },
        },
      }),
    ).toEqual(['0600-2200', '24h', '24h', 'closed', 'unknown', 'unknown', 'unknown']);
    expect(parseUkHours(undefined)).toBeNull();
  });

  test('maps fuel types to fuel kinds and keeps the newest price', () => {
    const result = normalizeUkPrices(
      {
        node_id: 'abc',
        fuel_prices: [
          { fuel_type: 'E10', price: 139.9, price_last_updated: '2026-10-28T10:00:00Z' },
          { fuel_type: 'E10', price: 138.9, price_last_updated: '2026-10-28T11:00:00Z' },
          { fuel_type: 'B7_STANDARD', price: '145.9', price_last_updated: '2026-10-27T09:00:00Z' },
          { fuel_type: 'B7_PREMIUM', price: 159.9, price_change_effective_timestamp: '2026-10-27T09:00:00Z' },
          { fuel_type: 'E5', price: 13, price_last_updated: '2026-10-27T09:00:00Z' },
          { fuel_type: 'HVO', price: 170, price_last_updated: '2027-01-01T00:00:00Z' },
        ],
      },
      NOW,
    );
    expect(result?.prices).toEqual({
      regular: { p: 138.9, at: '2026-10-28T11:00:00.000Z' },
      diesel: { p: 145.9, at: '2026-10-27T09:00:00.000Z' },
      'premium-diesel': { p: 159.9, at: '2026-10-27T09:00:00.000Z' },
      hvo: { p: 170, at: NOW.toISOString() },
    });
  });

  test('joins forecourts and prices, rejecting bad records', () => {
    const { stations, prices } = ukFixtureRecords(NOW);
    const built = buildUkStations(stations, prices, NOW);
    expect(built).toHaveLength(54);
    expect(built.find((s) => s.id === 'uk-fixture-closed')).toBeUndefined();
    expect(built.find((s) => s.id === 'uk-fixture-001')?.prices.premium).toBeUndefined();
    expect(buildUkStations(stations, [], NOW)).toHaveLength(0);
  });
});

describe('WA source (FuelWatch RSS)', () => {
  test('parses items and decodes entities', () => {
    const items = parseRss(waFixtureRss(1, 'today', NOW));
    expect(items.length).toBeGreaterThan(40);
    expect(items[0]).toMatchObject({ brand: expect.any(String), tradingName: expect.any(String), date: waPriceDate(NOW) });
    expect(decodeEntities('Fish &amp; Chips &#39;n&#x27; more &lt;3')).toBe("Fish & Chips 'n' more <3");
    expect(decodeEntities('<![CDATA[A & B]]>')).toBe('A & B');
  });

  test('reads opening hours in each FuelWatch style', () => {
    expect(parseWaHours('Open 24 hours')).toEqual(Array(7).fill('24h'));
    expect(parseWaHours('Open Mon-Fri: 05:30-21:00, Sat: 06:00-21:00, Sun: -')).toEqual([
      '0530-2100',
      '0530-2100',
      '0530-2100',
      '0530-2100',
      '0530-2100',
      '0600-2100',
      'closed',
    ]);
    expect(parseWaHours('Open Mon: 06:00-20:30, Tue: 06:00-20:30, Wed: 06:00-20:30, Thu: 06:00-20:30, Fri: 06:00-20:30, Sat: 07:00-19:00, Sun: 07:00-19:00, Toilets ATM')?.[6]).toBe('0700-1900');
    expect(parseWaHours('Fuel Cards ATM EFTPOS')).toBeNull();
    expect(parseWaHours('')).toBeNull();
  });

  test('turns restrictions and features into tags', () => {
    expect(waTags('Toilets Carwash Pumped AdBlue Air ATM Truck Friendly', 'Membership Required;')).toEqual([
      'members-only',
      'toilets',
      'car-wash',
      'adblue',
      'air',
      'atm',
      'truck',
    ]);
    expect(waTags('', 'Unmanned site (credit card charges may apply); Entry Permit Required; Low Aromatic Fuel')).toEqual([
      'permit-required',
      'unmanned',
      'low-aromatic',
    ]);
  });

  test('a daily price starts at 6am Perth time', () => {
    expect(waPriceStart('2026-10-29')).toBe('2026-10-28T22:00:00.000Z');
    expect(waPriceStart('29/10/2026')).toBeNull();
  });

  test("tomorrow's prices come out at 2:30pm Perth time", () => {
    expect(tomorrowPublished(new Date('2026-10-29T06:29:00Z'))).toBe(false); // 14:29 in Perth
    expect(tomorrowPublished(new Date('2026-10-29T06:30:00Z'))).toBe(true);
    expect(tomorrowPublished(new Date('2026-10-29T15:59:00Z'))).toBe(true); // 23:59
    expect(tomorrowPublished(new Date('2026-10-29T16:00:00Z'))).toBe(false); // midnight
  });

  test('refetch moments are the last 6am and 2:30pm in Perth', () => {
    // 10:00 Perth on 29 Oct.
    const [six, halfTwo] = waRefetchMoments(new Date('2026-10-29T02:00:00Z'));
    expect(six?.toISOString()).toBe('2026-10-28T22:00:00.000Z');
    expect(halfTwo?.toISOString()).toBe('2026-10-28T06:30:00.000Z');
    // 15:00 Perth: 2:30pm was half an hour ago.
    expect(waRefetchMoments(new Date('2026-10-29T07:00:00Z'))[1]?.toISOString()).toBe('2026-10-29T06:30:00.000Z');
  });

  test('joins products into stations with tomorrow prices', () => {
    const { today, tomorrow } = waFixtureFeeds(NOW);
    const stations = buildWaStations(today, tomorrow);
    expect(stations).toHaveLength(46);
    const first = stations[0];
    expect(first?.id).toMatch(/^wa-/);
    expect(first?.region).toBe('wa');
    expect(Object.keys(first?.prices ?? {})).toEqual(expect.arrayContaining(['regular', 'premium', 'super', 'diesel']));
    expect(first?.tomorrow?.regular).toBeDefined();
    // Same id every time for the same station.
    expect(buildWaStations(today, [])[0]?.id).toBe(first?.id);
    expect(stations.find((s) => s.tags.includes('members-only'))?.name).toBe('Bulk Club Perth Airport');
    // "Independent" is not shown as a brand.
    expect(stations.find((s) => s.name === 'Desert Roadhouse')?.brand).toBe('');
    expect(buildWaStations(today, [])[0]?.tomorrow).toBeUndefined();
  });
});

describe('buildFeed', () => {
  test('groups every region into tiles with a status for each', () => {
    const feed = fixtureFeed(NOW, ['wa', 'uk']);
    expect(feed.meta.v).toBe(FEED_VERSION);
    expect(feed.meta.stationCount).toBe(100);
    expect(feed.meta.regions.wa).toMatchObject({ status: 'live', stationCount: 46, tomorrow: true });
    expect(feed.meta.regions.uk).toMatchObject({ status: 'live', stationCount: 54, tomorrow: false });
    for (const tile of feed.tiles) {
      expect(feed.meta.tiles[tile.tile]).toBe(tile.stations.length);
      for (const s of tile.stations) expect(tileKey(s.lat, s.lng)).toBe(tile.tile);
    }
  });

  test('drops duplicates and stations without prices', () => {
    const { today } = waFixtureFeeds(NOW);
    const wa = buildWaStations(today, []);
    const noPrice = { ...(wa[0] as (typeof wa)[number]), id: 'wa-empty', prices: {} };
    const tiled = groupIntoTiles([...wa, ...wa, noPrice], NOW.toISOString());
    expect(tiled.stationCount).toBe(wa.length);
    expect(buildFeed([], {}, NOW).meta.stationCount).toBe(0);
  });
});

describe('NSW, ACT and Tasmania (NSW Fuel API)', () => {
  test('Sydney time: 10 hours ahead in winter, 11 in summer, switching on the first Sundays of October and April', () => {
    expect(auEasternOffsetMinutes(new Date('2026-07-01T00:00:00Z'))).toBe(600);
    expect(auEasternOffsetMinutes(new Date('2027-01-15T00:00:00Z'))).toBe(660);
    expect(auEasternOffsetMinutes(new Date('2026-10-03T15:59:00Z'))).toBe(600);
    expect(auEasternOffsetMinutes(new Date('2026-10-03T16:00:00Z'))).toBe(660);
    expect(auEasternOffsetMinutes(new Date('2027-04-03T15:59:00Z'))).toBe(660);
    expect(auEasternOffsetMinutes(new Date('2027-04-03T16:00:00Z'))).toBe(600);
  });

  test('reads both of the API date formats as Sydney time, and refuses future dates', () => {
    expect(parseNswTime('29/05/2026 23:28:20', NOW)).toBe('2026-05-29T13:28:20.000Z');
    expect(parseNswTime('2026-01-10 08:00:00', NOW)).toBe('2026-01-09T21:00:00.000Z');
    expect(parseNswTime('rubbish', NOW)).toBeNull();
    expect(parseNswTime(nswLocalTime(new Date(NOW.getTime() + 86_400_000)), NOW)).toBeNull();
    expect(parseNswTime(nswLocalTime(NOW), NOW)).toBe(new Date(Math.floor(NOW.getTime() / 1000) * 1000).toISOString());
  });

  test('asks for Tasmania by name and stamps requests in UTC, as the published API spec says', () => {
    expect(NSW_PRICES_URL).toBe('https://api.onegov.nsw.gov.au/FuelPriceCheck/v2/fuel/prices?states=NSW%7CTAS');
    expect(requestTimestamp(new Date('2026-11-03T21:05:09Z'))).toBe('03/11/2026 09:05:09 PM');
    expect(requestTimestamp(new Date('2026-01-09T00:30:00Z'))).toBe('09/01/2026 12:30:00 AM');
  });

  test('splits addresses into street, town and postcode', () => {
    expect(splitAddress('123 Fake Street, Hurstville NSW 2220')).toEqual({ street: '123 Fake Street', town: 'Hurstville', postcode: '2220' });
    expect(splitAddress('1 Main Rd, NORTH HOBART TAS 7000')).toEqual({ street: '1 Main Rd', town: 'North Hobart', postcode: '7000' });
    expect(splitAddress('Somewhere odd')).toEqual({ street: 'Somewhere odd', town: '', postcode: '' });
  });

  test('builds stations for NSW (with Canberra) and Tasmania, skipping bad records', () => {
    const stations = buildNswStations(nswFixtureResponse(NOW), NOW);
    const nsw = stations.filter((s) => s.region === 'nsw');
    const tas = stations.filter((s) => s.region === 'tas');
    expect(nsw).toHaveLength(37); // 30 Sydney + 6 Canberra + Costco
    expect(tas).toHaveLength(8);
    const costco = stations.find((s) => s.name === 'Costco Fixture Park');
    expect(costco?.tags).toContain('members-only');
    const first = stations.find((s) => s.id === 'nsw-1001');
    expect(first?.prices.super).toBeDefined();
    expect(first?.prices.super?.p).not.toBe(2.1);
    expect(stations.some((s) => s.id === 'nsw-424242')).toBe(false);
    expect(first?.prices.e10).toBeDefined();
    expect(tas.every((s) => s.prices.e10 === undefined)).toBe(true);
    expect(first?.town).toBe('Sydney');
    expect(first?.postcode).toBe('2000');
    expect(first?.hours).toBeNull();
  });

  test('the version 2 feed for Pumpwise 1.0 keeps only the regions it knows', () => {
    const full = fixtureFeed(NOW);
    expect(full.meta.regions.nsw?.stationCount).toBe(37);
    expect(full.meta.regions.tas?.stationCount).toBe(8);
    const stations = full.tiles.flatMap((t) => t.stations);
    const legacy = legacyFeed(stations, full.meta.regions, NOW);
    expect(legacy.meta.v).toBe(LEGACY_VERSION);
    expect(Object.keys(legacy.meta.regions).sort()).toEqual(['uk', 'wa']);
    expect(legacy.tiles.every((t) => t.v === LEGACY_VERSION && t.stations.every((s) => s.region === 'wa' || s.region === 'uk'))).toBe(true);
    expect(legacy.meta.stationCount).toBe(100);
  });
});
