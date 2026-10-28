// Made-up stations in the same shape as each real source, for tests and the web smoke test.
// Names and brands are fictional. WA stations are written as FuelWatch RSS and UK stations as
// Fuel Finder JSON, so the real parsers run on them.
import { buildFeed, type BuiltFeed, type FeedStation } from '../../src/lib/feed.ts';
import { buildUkStations } from './sources/uk.ts';
import { buildWaStations, parseRss, WA_PRODUCTS, type WaProductFeed } from './sources/wa.ts';

const BRANDS = ['Northline', 'Pennant', 'Greenway', 'Harbour', 'Crown Fuels', 'Marlow'];
const STREETS = ['High Street', 'Station Road', 'Church Lane', 'Mill Road', 'Park Avenue', 'Bridge Street', 'Canning Hwy', 'Albany Hwy'];

/** Small deterministic random number generator so fixtures are identical on every run. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function scatter(rand: () => number, lat: number, lng: number, maxKm: number): { lat: number; lng: number } {
  const angle = rand() * Math.PI * 2;
  const km = 0.3 + rand() * (maxKm - 0.3);
  return {
    lat: lat + (km / 111) * Math.sin(angle),
    lng: lng + (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle),
  };
}

// ---------------------------------------------------------------------------------------------
// Western Australia (FuelWatch RSS)
// ---------------------------------------------------------------------------------------------

interface WaSite {
  name: string;
  brand: string;
  suburb: string;
  address: string;
  lat: number;
  lng: number;
  base: number;
  features: string;
  restrictions: string;
}

function waSites(): WaSite[] {
  const rand = random(11);
  const sites: WaSite[] = [];
  const seeds = [
    { suburb: 'PERTH', lat: -31.9523, lng: 115.8613, count: 34, maxKm: 14 },
    { suburb: 'BUNBURY', lat: -33.3271, lng: 115.6414, count: 10, maxKm: 8 },
  ];
  let n = 0;
  for (const seed of seeds) {
    for (let i = 0; i < seed.count; i++) {
      n++;
      const brand = BRANDS[n % BRANDS.length] ?? 'Northline';
      const street = STREETS[n % STREETS.length] ?? 'High Street';
      const { lat, lng } = scatter(rand, seed.lat, seed.lng, seed.maxKm);
      // Most sample stations are open around the clock so tests pass at any hour of the day.
      const allNight = n % 4 !== 0;
      sites.push({
        name: `${brand} ${street}`,
        brand,
        suburb: seed.suburb,
        address: `${(n * 7) % 180} ${street}`,
        lat,
        lng,
        base: 184.9 + Math.round(rand() * 260) / 10,
        features: allNight
          ? 'Open 24 hours, Fuel Cards ATM Toilets EFTPOS Air Water Ice'
          : 'Open Mon-Fri: 05:30-21:00, Sat: 06:00-21:00, Sun: 07:00-20:00, Toilets EFTPOS Air',
        restrictions: n % 9 === 0 ? 'Unmanned site (credit card charges may apply);' : '',
      });
    }
  }
  // A members-only warehouse with the lowest price in Perth, and a remote site that needs a permit.
  sites.push({
    name: 'Bulk Club Perth Airport',
    brand: 'Bulk Club',
    suburb: 'PERTH AIRPORT',
    address: '1 Club Way',
    lat: -31.94,
    lng: 115.95,
    base: 172.9,
    features: 'Open 24 hours',
    restrictions: 'Membership Required;',
  });
  sites.push({
    name: 'Desert Roadhouse',
    brand: 'Independent',
    suburb: 'KUNAWARRITJI',
    address: 'Lot 1 Community Rd',
    lat: -22.55,
    lng: 122.7,
    base: 330.0,
    features: 'Open Mon-Fri: 08:00-16:00, Sat: -, Sun: -',
    restrictions: 'Unmanned site (credit card charges may apply); Entry Permit Required; Low Aromatic Fuel',
  });
  return sites;
}

const WA_OFFSETS: Record<number, number> = { 1: 0, 2: 14, 6: 24, 4: 26, 11: 33, 5: 0, 10: 0 };

/** The Perth date (YYYY-MM-DD) whose 6am price is in force at `now`. */
export function waPriceDate(now: Date): string {
  return new Date(now.getTime() + 8 * 3_600_000 - 6 * 3_600_000).toISOString().slice(0, 10);
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A FuelWatch RSS document for one product. Tomorrow's prices drop 3c, a few rise. */
export function waFixtureRss(product: number, day: 'today' | 'tomorrow', now: Date): string {
  const sites = waSites();
  const items = sites
    .map((site, i) => {
      // LPG and E85 only at a few sites; premium diesel at every other site.
      if ((product === 5 || product === 10) && i % 7 !== 0) return '';
      if (product === 11 && i % 2 === 1) return '';
      const today = site.base + (WA_OFFSETS[product] ?? 0);
      const price = day === 'today' ? today : today + (i % 5 === 0 ? 2.0 : -3.0);
      return `    <item>
      <title>${price.toFixed(1)}: ${escapeXml(site.name)}</title>
      <brand>${escapeXml(site.brand)}</brand>
      <date>${waPriceDate(new Date(now.getTime() + (day === 'tomorrow' ? 86_400_000 : 0)))}</date>
      <price>${price.toFixed(1)}</price>
      <trading-name>${escapeXml(site.name)}</trading-name>
      <location>${site.suburb}</location>
      <address>${escapeXml(site.address)}</address>
      <phone></phone>
      <latitude>${site.lat.toFixed(8)}</latitude>
      <longitude>${site.lng.toFixed(8)}</longitude>
      <site-features>${escapeXml(site.features)}</site-features>
      <restrictions>${escapeXml(site.restrictions)}</restrictions>
    </item>`;
    })
    .filter(Boolean)
    .join('\n');
  return `﻿<rss version="2.0">
  <channel>
    <title>FuelWatch Prices For All Metro Regions</title>
${items}
  </channel>
</rss>`;
}

export function waFixtureFeeds(now: Date): { today: WaProductFeed[]; tomorrow: WaProductFeed[] } {
  return {
    today: WA_PRODUCTS.map(({ product, kind }) => ({ kind, items: parseRss(waFixtureRss(product, 'today', now)) })),
    tomorrow: WA_PRODUCTS.map(({ product, kind }) => ({ kind, items: parseRss(waFixtureRss(product, 'tomorrow', now)) })),
  };
}

// ---------------------------------------------------------------------------------------------
// United Kingdom (Fuel Finder JSON)
// ---------------------------------------------------------------------------------------------

export function ukFixtureRecords(now: Date): { stations: unknown[]; prices: unknown[] } {
  const rand = random(7);
  const stations: unknown[] = [];
  const prices: unknown[] = [];
  const seeds = [
    { town: 'LONDON', postcode: 'SW1A', lat: 51.5072, lng: -0.1276, count: 36 },
    { town: 'LEEDS', postcode: 'LS1', lat: 53.8008, lng: -1.5491, count: 18 },
  ];
  let n = 0;
  for (const seed of seeds) {
    for (let i = 0; i < seed.count; i++) {
      n++;
      const id = `fixture-${String(n).padStart(3, '0')}`;
      const brand = BRANDS[n % BRANDS.length] ?? 'Northline';
      const street = STREETS[n % STREETS.length] ?? 'High Street';
      const { lat, lng } = scatter(rand, seed.lat, seed.lng, 14);
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
      const base = 132.9 + Math.round(rand() * 160) / 10;
      const at = new Date(now.getTime() - Math.round(5 + rand() * 60 * 30) * 60_000).toISOString();
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

/** The whole made-up feed: Perth and Bunbury (with tomorrow's prices), London and Leeds. */
export function fixtureFeed(now: Date, regions: ('wa' | 'uk')[] = ['wa', 'uk']): BuiltFeed {
  const stations: FeedStation[] = [];
  const status: BuiltFeed['meta']['regions'] = {};
  if (regions.includes('wa')) {
    const { today, tomorrow } = waFixtureFeeds(now);
    const wa = buildWaStations(today, tomorrow);
    stations.push(...wa);
    status.wa = { status: 'live', updatedAt: now.toISOString(), stationCount: wa.length, tomorrow: true };
  }
  if (regions.includes('uk')) {
    const { stations: ukRaw, prices: ukPrices } = ukFixtureRecords(now);
    const uk = buildUkStations(ukRaw, ukPrices, now);
    stations.push(...uk);
    status.uk = { status: 'live', updatedAt: now.toISOString(), stationCount: uk.length, tomorrow: false };
  }
  return buildFeed(stations, status, now);
}


