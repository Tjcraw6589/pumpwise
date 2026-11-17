/**
 * Denmark: the fuel companies' own public price APIs. Since January 2026 the Danish price rules
 * (brændstofprisbekendtgørelsen § 16a) oblige each fuel company to publish the current pump price of
 * every station online and in a public API, at once when the pump price changes. The Danish
 * Competition and Consumer Authority's guidance (kfst.dk, 16 December 2025) says the API must be
 * publicly available and recommends one request for all of a company's stations.
 *
 * There is no government file and no written reuse licence: each company answers for its own prices,
 * so the credit names the companies and says this is not government data (see LEGAL.md).
 *
 * Read here: OK (https://www.ok.dk/globalassets/pdfer/diverse/offentlig-api-dokumentation.pdf, no key,
 * answers may be cached for two minutes) and Shell (linked from shellservice.dk). Both give coordinates.
 * Circle K with INGO and Q8 with F24 publish prices with an address but no coordinates, so each
 * address is looked up once on OpenStreetMap (Nominatim, one request a second at most, a limited
 * number per run) and the position is kept in a small file on the "stats" branch. A station enters
 * the feed once its position is known. Uno-X, OIL! and Go'on are still to be added, so Denmark
 * shows most of the market, not all of it, and the app and the site say so.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { asNumber, asRecord, asString, type FeedStation, type FuelKind, inRegion, type Raw, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const DK_OK_URL = 'https://mobility-prices.ok.dk/api/v1/fuel-prices';
export const DK_SHELL_URL = 'https://shellpumpepriser.geoapp.me/v1/prices';
export const DK_CIRCLEK_URL = 'https://api.circlek.com/eu/prices/v1/fuel/countries/DK';
export const DK_Q8_URL = 'https://beta.q8.dk/Station/GetStationPrices?page=1&pageSize=2000';
export const DK_GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
/** Address lookups in one run: about a minute at one a second, so every station is placed within a few hours. */
export const DK_LOOKUPS_PER_RUN = 50;
/** An address that was not found is tried again after this many days. */
export const DK_RETRY_DAYS = 14;
/** Nominatim's rank for a street; 30 is a house or a named place. Anything coarser (a town) is refused. */
export const DK_MIN_RANK = 26;
/** OK alone lists several hundred stations; far fewer in total means something went wrong. */
export const DK_MIN_STATIONS = 300;
/** Kroner a litre outside this range is a reporting mistake. */
export const DK_MIN_KR = 8;
export const DK_MAX_KR = 40;

/**
 * A pump name as one of Pumpwise's fuels, or null for anything that is not road fuel (AdBlue, charging,
 * heating oil) or that Pumpwise does not list (92 octane). Danish "Blyfri 95" is E10.
 */
export function dkFuelKind(name: string, fuelType = '', octane: number | null = null): FuelKind | null {
  const text = `${name} ${fuelType}`.toLowerCase();
  if (/adblue|kwh|\bhpc\b|\bel\b|ladning|fyringsolie|farvet|petroleum|vask/.test(text)) return null;
  if (/hvo|neste my|xtl/.test(text)) return 'hvo';
  if (/e85/.test(text)) return 'e85';
  const better = /v-power|extra|premium|plus|ultimate|miles/.test(text);
  if (/diesel/.test(text)) return better ? 'premium-diesel' : 'diesel';
  const digits = octane ?? asNumber((/\b(92|95|98|99|100)\b/.exec(text) ?? [])[1]);
  if (digits === 92) return null;
  if (digits !== null && digits >= 98) return 'super';
  if (/v-power/.test(text)) return 'super';
  if (digits === 95 || /blyfri|benzin/.test(text)) return better || /\be5\b/.test(text) ? 'premium' : 'regular';
  return null;
}

/** 16.09 kroner as 1609 (hundredths of the currency, as everywhere in the feed), or null when out of range. */
export function dkPrice(value: unknown): number | null {
  const kr = asNumber(value);
  if (kr === null || kr < DK_MIN_KR || kr > DK_MAX_KR) return null;
  return Math.round(kr * 1000) / 10;
}

/** The companies give UTC, some without the "Z". Null when unreadable or in the future. */
export function dkTime(value: unknown, now: Date): string | null {
  const text = asString(value);
  if (!text) return null;
  const ms = Date.parse(/(Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}Z`);
  if (!Number.isFinite(ms) || ms > now.getTime() + 10 * 60_000) return null;
  return new Date(ms).toISOString();
}

function place(raw: Raw): { lat: number; lng: number } | null {
  const c = asRecord(raw.coordinates) ?? raw;
  const lat = asNumber(c.latitude ?? c.lat);
  const lng = asNumber(c.longitude ?? c.lng ?? c.lon);
  return lat !== null && lng !== null && inRegion('dk', lat, lng) ? { lat, lng } : null;
}

/** One company's stations as feed stations. Both companies use nearly the authority's suggested layout. */
export function buildDkStations(items: unknown[], brand: string, prefix: string, now: Date): FeedStation[] {
  const stations: FeedStation[] = [];
  for (const item of items) {
    const raw = asRecord(item);
    if (!raw) continue;
    const id = asString(raw.stationId ?? raw.facility_number ?? raw.id);
    const at = place(raw);
    if (!id || !at) continue;
    const street = tidyName(asString(raw.street));
    const house = asString(raw.houseNumber ?? raw.house_number);
    const town = tidyName(asString(raw.city));
    const fallbackAt = dkTime(raw.last_updated_time ?? raw.lastUpdated, now);
    const prices: FeedStation['prices'] = {};
    for (const entry of Array.isArray(raw.prices) ? raw.prices : []) {
      const row = asRecord(entry);
      if (!row) continue;
      const kind = dkFuelKind(asString(row.productName ?? row.product_name), asString(row.fuelType), asNumber(row.octane));
      const p = dkPrice(row.price);
      const time = dkTime(row.lastUpdated ?? row.last_updated_time, now) ?? fallbackAt;
      if (!kind || p === null || !time) continue;
      // Two pump names can be the same kind (two premium diesels): keep the cheaper, as a driver would.
      const existing = prices[kind];
      if (!existing || p < existing.p) prices[kind] = { p, at: time };
    }
    if (Object.keys(prices).length === 0) continue;
    const address = [street, house].filter(Boolean).join(' ');
    stations.push({
      id: `dk-${prefix}-${id}`,
      region: 'dk',
      name: [brand, town || street].filter(Boolean).join(' '),
      brand: asString(raw.brand) || brand,
      address,
      town,
      postcode: asString(raw.postalCode ?? raw.postal_code),
      lat: roundCoord(at.lat),
      lng: roundCoord(at.lng),
      hours: null,
      tags: [],
      prices,
    });
  }
  return stations;
}

/** A station that has prices and an address but no position yet. */
export type DkDraft = { station: Omit<FeedStation, 'lat' | 'lng'>; query: string };
/** The saved positions: station id to the address that was looked up and where it is, or the day it was not found. */
export type DkPlaces = Record<string, { a: string; lat?: number; lng?: number; r?: number; miss?: string }>;

function addPrice(prices: FeedStation['prices'], kind: FuelKind | null, p: number | null, time: string | null): void {
  if (!kind || p === null || !time) return;
  const existing = prices[kind];
  if (!existing || p < existing.p) prices[kind] = { p, at: time };
}

/** Circle K and INGO: "miles 95" is the ordinary petrol and "miles+" the better grade. */
export function buildDkCircleK(body: unknown, now: Date): DkDraft[] {
  const sites = asRecord(body)?.sites;
  const drafts: DkDraft[] = [];
  for (const item of Array.isArray(sites) ? sites : []) {
    const raw = asRecord(item);
    const address = asRecord(raw?.address);
    const id = asString(raw?.id);
    if (!raw || !address || !id) continue;
    const street = tidyName(asString(address.street));
    const town = tidyName(asString(address.city));
    const postcode = asString(address.postalCode);
    if (!street || !town) continue;
    const prices: FeedStation['prices'] = {};
    for (const entry of Array.isArray(raw.fuelPrices) ? raw.fuelPrices : []) {
      const row = asRecord(entry);
      if (!row) continue;
      const name = asString(row.displayName).toLowerCase().replace(/miles\s*\+/, 'plus').replace(/miles/, '');
      addPrice(prices, dkFuelKind(name), dkPrice(row.price), dkTime(row.lastUpdated, now));
    }
    if (Object.keys(prices).length === 0) continue;
    const brand = /^\s*ingo/i.test(asString(raw.name)) ? 'INGO' : 'Circle K';
    drafts.push({
      station: { id: `dk-ck-${id}`, region: 'dk', name: `${brand} ${town}`, brand, address: street, town, postcode, hours: null, tags: [], prices },
      query: `${street}, ${postcode} ${town}`,
    });
  }
  return drafts;
}

/** "Dronningemaen 34 Svendborg 5700 Danmark" as street, town and postcode; null when it does not read that way. */
export function dkQ8Address(text: string): { street: string; town: string; postcode: string } | null {
  const clean = text.replace(/\s+/g, ' ').replace(/,/g, '').replace(/\s*Danmark\s*$/i, '').trim();
  const match = /^(.*\d+\s?[A-Za-z]?(?:\s?-\s?\d+)?)\s+(\D+?)\s+(\d{4})$/.exec(clean);
  if (!match) return null;
  return { street: tidyName(match[1] ?? ''), town: tidyName(match[2] ?? ''), postcode: match[3] ?? '' };
}

/** Q8 and F24. */
export function buildDkQ8(body: unknown, now: Date): DkDraft[] {
  const rows = asRecord(asRecord(body)?.data)?.stationsPrices;
  const drafts: DkDraft[] = [];
  for (const item of Array.isArray(rows) ? rows : []) {
    const raw = asRecord(item);
    const id = asString(raw?.stationId);
    const where = dkQ8Address(asString(raw?.address));
    if (!raw || !id || !where) continue;
    const prices: FeedStation['prices'] = {};
    for (const entry of Array.isArray(raw.products) ? raw.products : []) {
      const row = asRecord(entry);
      if (!row) continue;
      addPrice(prices, dkFuelKind(asString(row.productName)), dkPrice(row.price), dkTime(row.priceChangeDate, now));
    }
    if (Object.keys(prices).length === 0) continue;
    const brand = /f24/i.test(asString(raw.stationName)) ? 'F24' : 'Q8';
    // Shown as "København V", not "København v", and without notes such as "(nord)". The lookup keeps the text as published.
    const town = where.town.replace(/\s*\([^)]*\)\s*/g, ' ').trim().replace(/\s([a-zæøå])$/, (_, letter: string) => ` ${letter.toUpperCase()}`);
    drafts.push({
      station: { id: `dk-q8-${id}`, region: 'dk', name: `${brand} ${town}`, brand, address: where.street, town, postcode: where.postcode, hours: null, tags: [], prices },
      query: `${where.street}, ${where.postcode} ${where.town}`,
    });
  }
  return drafts;
}

/** The drafts whose position is known, and the ones still to look up (new, moved, or not found long enough ago). */
export function placeDkDrafts(drafts: DkDraft[], places: DkPlaces, now: Date): { stations: FeedStation[]; todo: DkDraft[] } {
  const stations: FeedStation[] = [];
  const todo: DkDraft[] = [];
  for (const draft of drafts) {
    const saved = places[draft.station.id];
    if (saved && saved.a === draft.query && typeof saved.lat === 'number' && typeof saved.lng === 'number') {
      stations.push({ ...draft.station, lat: saved.lat, lng: saved.lng });
    } else if (!saved || saved.a !== draft.query || !saved.miss || now.getTime() - Date.parse(saved.miss) > DK_RETRY_DAYS * 86_400_000) {
      todo.push(draft);
    }
  }
  return { stations, todo };
}

/** Nominatim's answer as a position, or null when it is outside Denmark or coarser than a street. */
export function dkLookupResult(body: unknown): { lat: number; lng: number; r: number } | null {
  const first = asRecord(Array.isArray(body) ? body[0] : null);
  if (!first) return null;
  const lat = asNumber(first.lat);
  const lng = asNumber(first.lon);
  const r = asNumber(first.place_rank) ?? 0;
  if (lat === null || lng === null || r < DK_MIN_RANK || !inRegion('dk', lat, lng)) return null;
  return { lat: roundCoord(lat), lng: roundCoord(lng), r };
}

function readPlaces(file: string): DkPlaces {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as DkPlaces) : {};
  } catch {
    return {};
  }
}

/**
 * One request per company. A company that fails is left out of this run; the others still count.
 * GEO_DIR is the folder holding the saved positions (the "stats" branch in the feed job); without it
 * only the companies that give coordinates are read.
 */
export async function fetchDk(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1500);
  const companies: { brand: string; prefix: string; url: string; list: (body: unknown) => unknown }[] = [
    { brand: 'OK', prefix: 'ok', url: DK_OK_URL, list: (body) => asRecord(body)?.items },
    { brand: 'Shell', prefix: 'shell', url: DK_SHELL_URL, list: (body) => body },
  ];
  const stations: FeedStation[] = [];
  for (const company of companies) {
    try {
      const response = await request(company.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = company.list(await response.json());
      if (!Array.isArray(items)) throw new Error('unexpected response shape');
      const built = buildDkStations(items, company.brand, company.prefix, now);
      console.log(`dk: ${company.brand} ${items.length} rows, ${built.length} stations`);
      stations.push(...built);
    } catch (error) {
      console.warn(`dk: ${company.brand} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const dir = process.env.GEO_DIR;
  if (!dir) return stations;
  const file = join(dir, 'dk-places.json');
  const places = readPlaces(file);
  const byAddress: { brand: string; url: string; headers?: Record<string, string>; build: (body: unknown, now: Date) => DkDraft[] }[] = [
    { brand: 'Circle K', url: DK_CIRCLEK_URL, headers: { 'X-App-Name': 'PRICES' }, build: buildDkCircleK },
    { brand: 'Q8', url: DK_Q8_URL, build: buildDkQ8 },
  ];
  const todo: DkDraft[] = [];
  for (const company of byAddress) {
    try {
      const response = await request(company.url, { headers: company.headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const drafts = company.build(await response.json(), now);
      const placed = placeDkDrafts(drafts, places, now);
      console.log(`dk: ${company.brand} ${drafts.length} with prices, ${placed.stations.length} placed, ${placed.todo.length} to look up`);
      stations.push(...placed.stations);
      todo.push(...placed.todo);
    } catch (error) {
      console.warn(`dk: ${company.brand} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Look up a limited number of addresses, taking the companies in turn so both fill in together.
  todo.sort((a, b) => a.station.id.slice(-2).localeCompare(b.station.id.slice(-2)) || a.station.id.localeCompare(b.station.id));
  const lookup = politeRequester(1100);
  let found = 0;
  let missed = 0;
  for (const draft of todo.slice(0, DK_LOOKUPS_PER_RUN)) {
    try {
      const response = await lookup(`${DK_GEOCODE_URL}?format=jsonv2&limit=1&countrycodes=dk&q=${encodeURIComponent(draft.query)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const at = dkLookupResult(await response.json());
      if (at) {
        places[draft.station.id] = { a: draft.query, ...at };
        stations.push({ ...draft.station, lat: at.lat, lng: at.lng });
        found += 1;
      } else {
        places[draft.station.id] = { a: draft.query, miss: now.toISOString().slice(0, 10) };
        missed += 1;
      }
    } catch (error) {
      console.warn(`dk: lookup failed, stopping for this run: ${error instanceof Error ? error.message : String(error)}`);
      break;
    }
  }
  if (found + missed > 0) {
    const sorted = Object.fromEntries(Object.entries(places).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(file, `{\n${Object.entries(sorted).map(([id, v]) => `${JSON.stringify(id)}:${JSON.stringify(v)}`).join(',\n')}\n}\n`);
    console.log(`dk: looked up ${found + missed} addresses, ${found} found, ${missed} not found, ${Math.max(0, todo.length - found - missed)} left`);
  }
  return stations;
}
