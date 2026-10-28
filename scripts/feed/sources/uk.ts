// United Kingdom: the UK Government Fuel Finder scheme (OAuth client credentials).
// The service only answers connections from inside the UK, so this source stays off unless the
// job runs somewhere in the UK and FUEL_FINDER_CLIENT_ID / FUEL_FINDER_CLIENT_SECRET are set.
import {
  asNumber,
  asRecord,
  asString,
  cleanPrice,
  type FeedPrice,
  type FeedStation,
  type FuelKind,
  inBounds,
  REGION_BOUNDS,
  roundCoord,
  tidyName,
} from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const UK_MIN_PENCE = 80;
export const UK_MAX_PENCE = 300;

const FUEL_KINDS: Record<string, FuelKind> = {
  E10: 'regular',
  E5: 'premium',
  B7: 'diesel',
  B7_STANDARD: 'diesel',
  B7_PREMIUM: 'premium-diesel',
  SDV: 'premium-diesel',
  B10: 'b10',
  HVO: 'hvo',
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function hhmm(value: unknown): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(asString(value));
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
}

export function parseUkHours(openingTimes: unknown): string[] | null {
  const usual = asRecord(asRecord(openingTimes)?.usual_days);
  if (!usual) return null;
  let known = 0;
  const hours = DAYS.map((day) => {
    const entry = asRecord(usual[day]);
    if (!entry) return 'unknown';
    if (entry.is_24_hours === true) {
      known++;
      return '24h';
    }
    const open = hhmm(entry.open ?? entry.open_time);
    const close = hhmm(entry.close ?? entry.close_time);
    if (!open || !close) return 'unknown';
    known++;
    if (open === close) return open === '0000' ? '24h' : 'closed';
    return `${open}-${close}`;
  });
  return known === 0 ? null : hours;
}

const AMENITY_CODES: Record<string, string> = {
  customer_toilets: 'toilets',
  toilets: 'toilets',
  car_wash: 'car-wash',
  twenty_four_hour_fuel: '24h-fuel',
  adblue_pumps: 'adblue',
  adblue_packaged: 'adblue',
  lpg_pumps: 'lpg',
  air_pump_or_screenwash: 'air',
  water_filling: 'water',
};

export type UkStationInfo = Omit<FeedStation, 'prices'>;

/** One forecourt record from `/pfs`. Null for closed sites and records without a usable location. */
export function normalizeUkStation(raw: unknown): UkStationInfo | null {
  const record = asRecord(raw);
  if (!record) return null;
  const nodeId = asString(record.node_id);
  if (!nodeId) return null;
  if (record.permanent_closure === true || record.temporary_closure === true) return null;
  const location = asRecord(record.location) ?? record;
  const lat = asNumber(location.latitude);
  const lng = asNumber(location.longitude);
  if (lat === null || lng === null || !inBounds(REGION_BOUNDS.uk, lat, lng)) return null;

  const brand = tidyName(asString(record.brand_name));
  const name = tidyName(asString(record.trading_name)) || brand || 'Fuel station';
  const address = [location.address_line_1, location.address_line_2]
    .map((part) => tidyName(asString(part)))
    .filter(Boolean)
    .join(', ');

  const tags: string[] = [];
  if (record.is_motorway_service_station === true) tags.push('motorway');
  if (record.is_supermarket_service_station === true) tags.push('supermarket');
  if (Array.isArray(record.amenities)) {
    for (const amenity of record.amenities) {
      const code = AMENITY_CODES[asString(amenity).toLowerCase()];
      if (code && !tags.includes(code)) tags.push(code);
    }
  }

  return {
    id: `uk-${nodeId}`,
    region: 'uk',
    name,
    brand,
    address,
    town: tidyName(asString(location.city)),
    postcode: asString(location.postcode).toUpperCase(),
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    hours: parseUkHours(record.opening_times),
    tags,
  };
}

/** One record from `/pfs/fuel-prices`: a forecourt id and its latest price for each fuel. */
export function normalizeUkPrices(raw: unknown, now: Date): { id: string; prices: Partial<Record<FuelKind, FeedPrice>> } | null {
  const record = asRecord(raw);
  if (!record) return null;
  const nodeId = asString(record.node_id);
  if (!nodeId || !Array.isArray(record.fuel_prices)) return null;
  const prices: Partial<Record<FuelKind, FeedPrice>> = {};
  for (const entry of record.fuel_prices) {
    const item = asRecord(entry);
    if (!item) continue;
    const kind = FUEL_KINDS[asString(item.fuel_type).toUpperCase()];
    const pence = cleanPrice(item.price, UK_MIN_PENCE, UK_MAX_PENCE);
    if (!kind || pence === null) continue;
    const stamp = Date.parse(asString(item.price_last_updated) || asString(item.price_change_effective_timestamp));
    if (!Number.isFinite(stamp)) continue;
    // A time in the future is a clock mistake on the forecourt's side; treat it as "now".
    const at = new Date(Math.min(stamp, now.getTime())).toISOString();
    const existing = prices[kind];
    if (!existing || existing.at < at) prices[kind] = { p: pence, at };
  }
  return { id: `uk-${nodeId}`, prices };
}

/** Joins forecourts with their prices. */
export function buildUkStations(stationRecords: unknown[], priceRecords: unknown[], now: Date): FeedStation[] {
  const prices = new Map<string, Partial<Record<FuelKind, FeedPrice>>>();
  for (const raw of priceRecords) {
    const parsed = normalizeUkPrices(raw, now);
    if (parsed) prices.set(parsed.id, { ...prices.get(parsed.id), ...parsed.prices });
  }
  const stations: FeedStation[] = [];
  for (const raw of stationRecords) {
    const info = normalizeUkStation(raw);
    const stationPrices = info ? prices.get(info.id) : undefined;
    if (info && stationPrices && Object.keys(stationPrices).length > 0) stations.push({ ...info, prices: stationPrices });
  }
  return stations;
}

// ---------------------------------------------------------------------------------------------
// Fetching (only runs with credentials).
// ---------------------------------------------------------------------------------------------

const BASE = (process.env.FUEL_FINDER_BASE_URL ?? 'https://www.fuel-finder.service.gov.uk').replace(/\/$/, '');
const BATCH_SIZE = 500;
const MAX_BATCHES = 100;
export const UK_MIN_STATIONS = 1000;

function unwrap(body: unknown): unknown {
  const record = asRecord(body);
  return record && 'data' in record ? record.data : body;
}

export function ukCredentials(): { id: string; secret: string } | null {
  const id = process.env.FUEL_FINDER_CLIENT_ID?.trim();
  const secret = process.env.FUEL_FINDER_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

export async function fetchUk(credentials: { id: string; secret: string }, now: Date): Promise<FeedStation[]> {
  // One request at a time, about 55 a minute: inside the API's published limit.
  const request = politeRequester(1100);
  const url = `${BASE}/api/v1/oauth/generate_access_token`;
  let token = '';
  for (const body of [
    { client_id: credentials.id, client_secret: credentials.secret },
    { grant_type: 'client_credentials', client_id: credentials.id, client_secret: credentials.secret, scope: 'fuelfinder.read' },
  ]) {
    const response = await request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (response.status === 429) throw new Error('Fuel Finder token endpoint locked us out (429). Check the client id and secret.');
    if (!response.ok) continue;
    const data = asRecord(unwrap(await response.json()));
    if (data && typeof data.access_token === 'string') {
      token = data.access_token;
      break;
    }
  }
  if (!token) throw new Error('Could not get a Fuel Finder token');

  const fetchAll = async (path: string): Promise<unknown[]> => {
    const rows: unknown[] = [];
    for (let batch = 1; batch <= MAX_BATCHES; batch++) {
      const response = await request(`${BASE}${path}?batch-number=${batch}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 404) break;
      if (!response.ok) throw new Error(`${path} batch ${batch}: ${response.status} ${response.statusText}`);
      const page = unwrap(await response.json());
      if (!Array.isArray(page) || page.length === 0) break;
      rows.push(...page);
      if (page.length < BATCH_SIZE) break;
    }
    return rows;
  };

  const stations = await fetchAll('/api/v1/pfs');
  const prices = await fetchAll('/api/v1/pfs/fuel-prices');
  return buildUkStations(stations, prices, now);
}
