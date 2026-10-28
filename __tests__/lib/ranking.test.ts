import type { FeedStation } from '@/lib/feed';
import { distanceKm } from '@/lib/geo';
import { priceBands, rankStations, sortStations } from '@/lib/ranking';

const NOW = new Date('2026-10-29T04:00:00Z'); // Thursday, 12:00 in Perth
const CENTER = { lat: -31.95, lng: 115.86 };
const TODAY = '2026-10-28T22:00:00.000Z'; // 6am Perth today

/** A WA station `km` due north of the centre. */
function st(id: string, km: number, regular: number | null, extra: Partial<FeedStation> = {}): FeedStation {
  return {
    id,
    region: 'wa',
    name: `Station ${id}`,
    brand: 'Brand',
    address: '',
    town: 'Perth',
    postcode: '',
    lat: CENTER.lat + km / 111.2,
    lng: CENTER.lng,
    hours: null,
    tags: [],
    prices: regular === null ? { diesel: { p: 210, at: TODAY } } : { regular: { p: regular, at: TODAY } },
    ...extra,
  };
}

const options = {
  center: CENTER,
  fuel: 'regular' as const,
  radiusKm: 8,
  fillLitres: 40,
  economyL100: 8,
  includeMembersOnly: false,
  now: NOW,
};

describe('rankStations', () => {
  test('finds the nearest, the cheapest in the area and the saving after the drive', () => {
    const stations = [st('near', 0.8, 205.9), st('cheap', 5, 193.9), st('far', 12, 180.9), st('diesel', 0.3, null)];
    const r = rankStations(stations, options);
    expect(r.nearest?.station.id).toBe('near');
    expect(r.cheapest?.station.id).toBe('cheap');
    expect(r.inArea.map((x) => x.station.id)).toEqual(['cheap', 'near']);
    expect(r.loadedWithFuel).toBe(3);

    const trip = (km: number) => 2 * km * 0.08;
    const dNear = distanceKm(CENTER, stations[0] as FeedStation);
    const dCheap = distanceKm(CENTER, stations[1] as FeedStation);
    expect(r.savings?.pumpSaving).toBeCloseTo(4.8, 5);
    expect(r.savings?.extraKm).toBeCloseTo(8.4, 1);
    expect(r.savings?.amount).toBeCloseTo(((40 + trip(dNear)) * 205.9 - (40 + trip(dCheap)) * 193.9) / 100, 6);
    expect(r.savings?.worthIt).toBe(true);
  });

  test('a tiny saving far away is not worth it, and best value counts the drive', () => {
    const r = rankStations([st('near', 0.5, 200.9), st('cheap', 7.8, 200.4)], options);
    expect(r.cheapest?.station.id).toBe('cheap');
    expect(r.savings?.worthIt).toBe(false);
    expect(r.savings?.amount).toBeLessThan(0);
    expect(r.bestValue?.station.id).toBe('near');
  });

  test('no savings line when the cheapest is also the nearest', () => {
    const r = rankStations([st('a', 0.6, 189.9), st('b', 3, 199.9)], options);
    expect(r.cheapest?.station.id).toBe('a');
    expect(r.nearest?.station.id).toBe('a');
    expect(r.savings).toBeNull();
  });

  test('the nearest can be outside the area when nothing is inside it', () => {
    const r = rankStations([st('out', 11, 190)], options);
    expect(r.inArea).toHaveLength(0);
    expect(r.cheapest).toBeNull();
    expect(r.nearest?.station.id).toBe('out');
  });

  test('closed, month-old and permit-only stations are listed but never headline picks', () => {
    const closed = ['0600-0700', '0600-0700', '0600-0700', '0600-0700', '0600-0700', '0600-0700', '0600-0700'];
    const stations = [
      st('closed', 0.2, 170, { hours: closed }),
      st('stale', 0.3, 171, { prices: { regular: { p: 171, at: '2026-09-01T00:00:00Z' } } }),
      st('permit', 0.4, 172, { tags: ['permit-required'] }),
      st('open', 1, 195),
    ];
    const r = rankStations(stations, options);
    expect(r.cheapest?.station.id).toBe('open');
    expect(r.nearest?.station.id).toBe('open');
    expect(r.inArea.map((x) => x.station.id)).toEqual(['closed', 'stale', 'permit', 'open']);
    expect(r.inArea[1]?.stale).toBe(true);
    expect(r.inArea[2]?.restricted).toBe(true);
  });

  test('members-only stations are left out unless the driver is a member', () => {
    const stations = [st('club', 1, 179.9, { tags: ['members-only'] }), st('public', 2, 195.9)];
    expect(rankStations(stations, options).cheapest?.station.id).toBe('public');
    expect(rankStations(stations, options).inArea).toHaveLength(1);
    expect(rankStations(stations, { ...options, includeMembersOnly: true }).cheapest?.station.id).toBe('club');
  });

  test("tomorrow's prices give a trend for the area", () => {
    const withTomorrow = (id: string, km: number, today: number, tomorrow: number) => st(id, km, today, { tomorrow: { regular: tomorrow } });
    const r = rankStations(
      [withTomorrow('a', 1, 200, 196), withTomorrow('b', 2, 202, 199), withTomorrow('c', 3, 199, 201), withTomorrow('d', 4, 205, 201)],
      options,
    );
    expect(r.inArea[0]?.tomorrow).toBe(201);
    expect(r.trend).toEqual({ change: -3.5, count: 4 });
    expect(rankStations([st('a', 1, 200)], options).trend).toBeNull();
  });
});

describe('sortStations', () => {
  test('sorts by price, distance or real cost, breaking ties by distance', () => {
    const r = rankStations([st('a', 2, 200), st('b', 1, 200), st('c', 4, 199)], options);
    expect(sortStations(r.inArea, 'price').map((x) => x.station.id)).toEqual(['c', 'b', 'a']);
    expect(sortStations(r.inArea, 'distance').map((x) => x.station.id)).toEqual(['b', 'a', 'c']);
    expect(sortStations(r.inArea, 'value').map((x) => x.station.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('priceBands', () => {
  test('marks the cheapest and dearest quarter', () => {
    const r = rankStations([st('a', 1, 190), st('b', 1.1, 195), st('c', 1.2, 200), st('d', 1.3, 205), st('e', 1.4, 210)], options);
    const band = priceBands(r.inArea);
    expect(band(190)).toBe('low');
    expect(band(200)).toBe('mid');
    expect(band(210)).toBe('high');
  });
  test('everything is mid with too few prices to compare', () => {
    const r = rankStations([st('a', 1, 190), st('b', 2, 210)], options);
    expect(priceBands(r.inArea)(190)).toBe('mid');
  });
});
