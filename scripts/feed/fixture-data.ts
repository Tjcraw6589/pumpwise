// Made-up forecourts in the same shape as the Fuel Finder API, for tests and the web smoke test.
// Names and brands are fictional. Prices are stamped relative to `now` so freshness labels vary.
import { buildFeed, type BuiltFeed } from '../../src/lib/feed.ts';

const BRANDS = ['Northline', 'Pennant', 'Greenway', 'Harbour', 'Crown Fuels', 'Marlow'];
const STREETS = ['High Street', 'Station Road', 'Church Lane', 'Mill Road', 'Park Avenue', 'Bridge Street', 'London Road', 'Kings Way'];

interface Seed {
  town: string;
  postcode: string;
  lat: number;
  lng: number;
  count: number;
}

const SEEDS: Seed[] = [
  { town: 'LONDON', postcode: 'SW1A', lat: 51.5072, lng: -0.1276, count: 36 },
  { town: 'LEEDS', postcode: 'LS1', lat: 53.8008, lng: -1.5491, count: 18 },
];

/** Small deterministic random number generator so fixtures are identical on every run. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function fixtureRecords(now: Date): { stations: unknown[]; prices: unknown[] } {
  const rand = random(7);
  const stations: unknown[] = [];
  const prices: unknown[] = [];
  let n = 0;
  for (const seed of SEEDS) {
    for (let i = 0; i < seed.count; i++) {
      n++;
      const id = `fixture-${String(n).padStart(3, '0')}`;
      const brand = BRANDS[n % BRANDS.length] ?? 'Northline';
      const street = STREETS[n % STREETS.length] ?? 'High Street';
      // Spread stations from about 0.2 to 9 miles out, in every direction.
      const angle = rand() * Math.PI * 2;
      const miles = 0.2 + rand() * 8.8;
      const lat = seed.lat + (miles / 69) * Math.sin(angle);
      const lng = seed.lng + (miles / (69.172 * Math.cos((seed.lat * Math.PI) / 180))) * Math.cos(angle);
      const allNight = n % 4 === 0;
      stations.push({
        node_id: id,
        trading_name: `${brand.toUpperCase()} ${street.toUpperCase()}`,
        brand_name: brand.toUpperCase(),
        temporary_closure: false,
        permanent_closure: false,
        is_motorway_service_station: n % 17 === 0,
        is_supermarket_service_station: n % 5 === 0,
        amenities: n % 3 === 0 ? ['customer_toilets', 'car_wash'] : ['customer_toilets'],
        location: {
          address_line_1: `${(n * 7) % 180} ${street.toUpperCase()}`,
          city: seed.town,
          postcode: `${seed.postcode} ${(n % 9) + 1}AB`,
          latitude: lat,
          longitude: lng,
        },
        opening_times: {
          usual_days: Object.fromEntries(
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => [
              day,
              allNight ? { is_24_hours: true } : { open: '06:00:00', close: '22:00:00', is_24_hours: false },
            ]),
          ),
        },
      });
      const base = 132.9 + Math.round(rand() * 160) / 10; // 132.9p to 148.9p
      const minutesAgo = Math.round(5 + rand() * 60 * 30); // up to about 30 hours
      const at = new Date(now.getTime() - minutesAgo * 60_000).toISOString();
      const fuelPrices: { fuel_type: string; price: number; price_last_updated: string }[] = [
        { fuel_type: 'E10', price: base, price_last_updated: at },
        { fuel_type: 'B7_STANDARD', price: base + 6, price_last_updated: at },
      ];
      if (n % 2 === 0) fuelPrices.push({ fuel_type: 'E5', price: base + 11, price_last_updated: at });
      if (n % 3 === 0) fuelPrices.push({ fuel_type: 'B7_PREMIUM', price: base + 17, price_last_updated: at });
      prices.push({ node_id: id, fuel_prices: fuelPrices });
    }
  }
  // Records the feed must reject: a 13p reporting error, a closed site and one in the sea off France.
  prices.push({ node_id: 'fixture-001', fuel_prices: [{ fuel_type: 'E5', price: 13, price_last_updated: now.toISOString() }] });
  stations.push({ node_id: 'fixture-closed', permanent_closure: true, location: { latitude: 51.5, longitude: -0.12 } });
  stations.push({ node_id: 'fixture-sea', location: { latitude: 48.5, longitude: -5.5 } });
  return { stations, prices };
}

export function fixtureFeed(now: Date): BuiltFeed {
  const { stations, prices } = fixtureRecords(now);
  return buildFeed(stations, prices, now);
}
