import type { FeedStation } from '@/lib/feed';
import { distanceMiles } from '@/lib/geo';
import { LITRES_PER_UK_GALLON, priceBands, rankStations, sortStations } from '@/lib/ranking';

const NOW = new Date('2026-10-28T12:00:00Z'); // a Wednesday, 12:00 UK time
const CENTER = { lat: 51.5, lng: -0.1 };
const RECENT = '2026-10-28T11:00:00Z';

/** A station `miles` due north of the centre. */
function st(id: string, miles: number, e10: number | null, extra: Partial<FeedStation> = {}): FeedStation {
  return {
    id,
    name: `Station ${id}`,
    brand: 'Brand',
    address: '',
    town: 'Town',
    postcode: '',
    lat: CENTER.lat + miles / 69.0,
    lng: CENTER.lng,
    hours: null,
    tags: [],
    prices: e10 === null ? { B7: { p: 150, at: RECENT } } : { E10: { p: e10, at: RECENT } },
    ...extra,
  };
}

const options = { center: CENTER, fuel: 'E10' as const, radiusMiles: 5, fillLitres: 40, mpg: 45, now: NOW };

describe('rankStations', () => {
  test('finds the nearest, the cheapest in the area and the saving', () => {
    const stations = [st('near', 0.5, 145.9), st('cheap', 3, 139.9), st('far', 8, 129.9), st('diesel', 0.2, null)];
    const r = rankStations(stations, options);
    expect(r.nearest?.station.id).toBe('near');
    expect(r.cheapest?.station.id).toBe('cheap');
    expect(r.inArea.map((x) => x.station.id)).toEqual(['cheap', 'near']);
    expect(r.loadedWithFuel).toBe(3);

    // Pump saving: 40 L x 6p = £2.40, less the extra fuel to drive the 2.5 mi further, there and back.
    const trip = (miles: number) => (2 * miles * LITRES_PER_UK_GALLON) / 45;
    const dNear = distanceMiles(CENTER, stations[0] as FeedStation);
    const dCheap = distanceMiles(CENTER, stations[1] as FeedStation);
    const expected = ((40 + trip(dNear)) * 145.9 - (40 + trip(dCheap)) * 139.9) / 100;
    expect(r.savings?.pumpSaving).toBeCloseTo(2.4, 5);
    expect(r.savings?.extraMiles).toBeCloseTo(5, 1);
    expect(r.savings?.pounds).toBeCloseTo(expected, 6);
    expect(r.savings?.pounds).toBeLessThan(2.4);
    expect(r.savings?.worthIt).toBe(true);
  });

  test('a tiny saving far away is not worth it', () => {
    const r = rankStations([st('near', 0.3, 140.9), st('cheap', 4.8, 140.4)], options);
    expect(r.cheapest?.station.id).toBe('cheap');
    expect(r.savings?.worthIt).toBe(false);
    expect(r.savings?.pounds).toBeLessThan(0);
    // Best value counts the drive, so the nearby station wins.
    expect(r.bestValue?.station.id).toBe('near');
  });

  test('no savings line when the cheapest is also the nearest', () => {
    const r = rankStations([st('a', 0.4, 138.9), st('b', 2, 141.9)], options);
    expect(r.cheapest?.station.id).toBe('a');
    expect(r.nearest?.station.id).toBe('a');
    expect(r.savings).toBeNull();
  });

  test('the nearest can be outside the area when nothing is inside it', () => {
    const r = rankStations([st('out', 7, 140)], options);
    expect(r.inArea).toHaveLength(0);
    expect(r.cheapest).toBeNull();
    expect(r.nearest?.station.id).toBe('out');
  });

  test('closed stations and month-old prices are never headline picks', () => {
    const closedHours = ['0600-0700', '0600-0700', '0600-0700', '0600-0700', '0600-0700', '0600-0700', '0600-0700'];
    const stations = [
      st('closed', 0.2, 120, { hours: closedHours }),
      st('stale', 0.3, 121, { prices: { E10: { p: 121, at: '2026-09-01T00:00:00Z' } } }),
      st('open', 1, 140),
    ];
    const r = rankStations(stations, options);
    expect(r.cheapest?.station.id).toBe('open');
    expect(r.nearest?.station.id).toBe('open');
    // Still listed, so the driver can see them.
    expect(r.inArea.map((x) => x.station.id)).toEqual(['closed', 'stale', 'open']);
    expect(r.inArea[1]?.stale).toBe(true);
  });
});

describe('sortStations', () => {
  test('sorts by price, distance or real cost, breaking ties by distance', () => {
    const r = rankStations([st('a', 2, 140), st('b', 1, 140), st('c', 4, 139)], options);
    expect(sortStations(r.inArea, 'price').map((x) => x.station.id)).toEqual(['c', 'b', 'a']);
    expect(sortStations(r.inArea, 'distance').map((x) => x.station.id)).toEqual(['b', 'a', 'c']);
    expect(sortStations(r.inArea, 'value').map((x) => x.station.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('priceBands', () => {
  test('marks the cheapest and dearest quarter', () => {
    const r = rankStations([st('a', 1, 130), st('b', 1.1, 135), st('c', 1.2, 140), st('d', 1.3, 145), st('e', 1.4, 150)], options);
    const band = priceBands(r.inArea);
    expect(band(130)).toBe('low');
    expect(band(140)).toBe('mid');
    expect(band(150)).toBe('high');
  });
  test('everything is mid with too few prices to compare', () => {
    const r = rankStations([st('a', 1, 130), st('b', 2, 150)], options);
    expect(priceBands(r.inArea)(130)).toBe('mid');
  });
});
