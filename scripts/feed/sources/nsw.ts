// New South Wales (with the ACT) and Tasmania: the NSW Government Fuel API (FuelCheck), which also
// carries FuelCheck TAS (v2 endpoints, with states=NSW|TAS). Free key from https://api.nsw.gov.au (Fuel API, free plan: 2,500 calls a
// month, so the feed calls it every 45 minutes: one token and one price request each time).
// Off unless NSW_FUEL_API_KEY and NSW_FUEL_API_SECRET are set as GitHub secrets.
//
// Stations must report every price change, so a price stands until the station reports a new one.
import {
  asNumber,
  asRecord,
  asString,
  cleanPrice,
  type FeedStation,
  type FuelKind,
  inBounds,
  type Raw,
  REGION_BOUNDS,
  type RegionId,
  roundCoord,
  tidyName,
} from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const NSW_MIN_CENTS = 60;
export const NSW_MAX_CENTS = 500;
/** A normal day has about 2,500 NSW and ACT stations; far fewer means something went wrong. */
export const NSW_MIN_STATIONS = 1500;

const API = 'https://api.onegov.nsw.gov.au';

const FUEL_KINDS: Record<string, FuelKind> = {
  U91: 'regular',
  E10: 'e10',
  P95: 'premium',
  P98: 'super',
  DL: 'diesel',
  PDL: 'premium-diesel',
  LPG: 'lpg',
  E85: 'e85',
  B20: 'b20',
};

export interface NswCredentials {
  key: string;
  secret: string;
}

export function nswCredentials(): NswCredentials | null {
  const key = process.env.NSW_FUEL_API_KEY?.trim();
  const secret = process.env.NSW_FUEL_API_SECRET?.trim();
  return key && secret ? { key, secret } : null;
}

/**
 * "29/05/2026 23:28:20" or "2026-05-29 23:28:20", in UTC, to ISO 8601. The v2 API stamps prices in UTC:
 * checked live on 4 November 2026, the newest price in each answer is minutes old in UTC, and reading
 * the stamps as Sydney time made every price look 11 hours older than it was.
 * Null when it can't be read, or when it is in the future (a clock mistake at the station).
 */
export function parseNswTime(value: unknown, now: Date): string | null {
  const text = asString(value);
  const match =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(text) ??
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(text);
  if (!match) return null;
  const parts = match.slice(1).map(Number) as [number, number, number, number, number, number];
  const [day, month, year] = text.includes('/') ? [parts[0], parts[1], parts[2]] : [parts[2], parts[1], parts[0]];
  const utc = Date.UTC(year, month - 1, day, parts[3], parts[4], Number.isFinite(parts[5]) ? parts[5] : 0);
  if (!Number.isFinite(utc)) return null;
  if (utc > now.getTime() + 10 * 60_000) return null;
  return new Date(utc).toISOString();
}

/** "123 Fake Street, Hurstville NSW 2220" to town "Hurstville" and postcode "2220". */
export function splitAddress(address: string): { street: string; town: string; postcode: string } {
  const match = /^(.*?),?\s*([^,]+?)\s+(NSW|ACT|TAS)\s+(\d{4})\s*$/i.exec(address);
  if (!match) return { street: address, town: '', postcode: '' };
  return { street: (match[1] ?? '').replace(/,\s*$/, '').trim(), town: tidyName((match[2] ?? '').trim()), postcode: match[4] ?? '' };
}

function regionFor(state: string, lat: number, lng: number): RegionId | null {
  const s = state.toUpperCase();
  if (s === 'TAS') return inBounds(REGION_BOUNDS.tas, lat, lng) ? 'tas' : null;
  if (s === 'NSW' || s === 'ACT') return inBounds(REGION_BOUNDS.nsw, lat, lng) ? 'nsw' : null;
  // No state given: go by the map.
  if (inBounds(REGION_BOUNDS.tas, lat, lng)) return 'tas';
  if (inBounds(REGION_BOUNDS.nsw, lat, lng)) return 'nsw';
  return null;
}

/** Turns one "all prices" response into feed stations. Anything odd is skipped, never guessed. */
export function buildNswStations(response: unknown, now: Date): FeedStation[] {
  const body = asRecord(response);
  const rawStations = Array.isArray(body?.stations) ? body.stations : [];
  const rawPrices = Array.isArray(body?.prices) ? body.prices : [];

  const byCode = new Map<string, FeedStation>();
  for (const item of rawStations) {
    const s = asRecord(item);
    if (!s) continue;
    const code = asString(s.code);
    const location = asRecord(s.location);
    const lat = asNumber(location?.latitude);
    const lng = asNumber(location?.longitude);
    if (!code || lat === null || lng === null) continue;
    const region = regionFor(asString(s.state), lat, lng);
    if (!region) continue;
    const brand = tidyName(asString(s.brand));
    const name = tidyName(asString(s.name)) || brand;
    if (!name) continue;
    const { street, town, postcode } = splitAddress(asString(s.address));
    const tags: string[] = [];
    if (/costco/i.test(brand) || /costco/i.test(name)) tags.push('members-only');
    if (s.isAdBlueAvailable === true) tags.push('adblue');
    byCode.set(`${region}:${code}`, {
      id: `${region}-${code}`,
      region,
      name,
      brand,
      address: street,
      town,
      postcode,
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags,
      prices: {},
    });
  }

  for (const item of rawPrices) {
    const p: Raw | null = asRecord(item);
    if (!p) continue;
    const code = asString(p.stationcode);
    const kind = FUEL_KINDS[asString(p.fueltype).toUpperCase()];
    if (!code || !kind) continue;
    const state = asString(p.state).toUpperCase();
    const station =
      (state === 'TAS' ? byCode.get(`tas:${code}`) : state ? byCode.get(`nsw:${code}`) : null) ??
      byCode.get(`nsw:${code}`) ??
      byCode.get(`tas:${code}`);
    if (!station) continue;
    const price = cleanPrice(p.price, NSW_MIN_CENTS, NSW_MAX_CENTS);
    const at = parseNswTime(p.lastupdated, now);
    if (price === null || at === null) continue;
    const existing = station.prices[kind];
    if (!existing || existing.at < at) station.prices[kind] = { p: price, at };
  }

  return [...byCode.values()].filter((s) => Object.keys(s.prices).length > 0);
}

/** UTC "dd/MM/yyyy hh:mm:ss AM", as the API's published spec asks for the requesttimestamp header. */
export function requestTimestamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = now.getUTCHours();
  return `${pad(now.getUTCDate())}/${pad(now.getUTCMonth() + 1)}/${now.getUTCFullYear()} ${pad(h % 12 || 12)}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The v2 "all prices" call returns only NSW (with the ACT) unless Tasmania is asked for by name. */
export const NSW_PRICES_URL = `${API}/FuelPriceCheck/v2/fuel/prices?states=${encodeURIComponent('NSW|TAS')}`;

/**
 * The API's own words when a request fails ("ClientId is Invalid" means the key is wrong), cut short,
 * with the key and secret blanked out so they can never reach a log.
 */
export async function failureDetail(response: Response, credentials: NswCredentials): Promise<string> {
  let body = '';
  try {
    body = (await response.text()).replace(/\s+/g, ' ').trim();
  } catch {
    body = '';
  }
  for (const value of [credentials.key, credentials.secret]) if (value) body = body.split(value).join('[hidden]');
  return `HTTP ${response.status}${body ? ` ${body.slice(0, 160)}` : ''}`;
}

/** One token and one "all prices" request: two of the month's 2,500 calls. */
export async function fetchNsw(credentials: NswCredentials, now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1500);
  const basic = btoa(`${credentials.key}:${credentials.secret}`);
  const tokenResponse = await request(`${API}/oauth/client_credential/accesstoken?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!tokenResponse.ok) {
    // Lengths only (a NSW key is 32 characters and a secret 16), to spot a swapped or partial paste.
    const sizes = `key ${credentials.key.length} characters, secret ${credentials.secret.length}`;
    throw new Error(`token request: ${await failureDetail(tokenResponse, credentials)} (${sizes})`);
  }
  const token = asString(asRecord(await tokenResponse.json())?.access_token);
  if (!token) throw new Error('token request: no access_token in the answer');

  const pricesResponse = await request(NSW_PRICES_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      apikey: credentials.key,
      transactionid: crypto.randomUUID(),
      requesttimestamp: requestTimestamp(now),
    },
  });
  if (!pricesResponse.ok) throw new Error(`prices request: ${await failureDetail(pricesResponse, credentials)}`);
  const stations = buildNswStations(await pricesResponse.json(), now);
  const tas = stations.filter((s) => s.region === 'tas').length;
  console.log(`nsw: ${stations.length - tas} NSW and ACT stations, ${tas} Tasmanian stations`);
  return stations;
}
