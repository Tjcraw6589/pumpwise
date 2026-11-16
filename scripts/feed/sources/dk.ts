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
 * Q8 with F24 and Circle K with INGO publish prices with an address but no coordinates, so they wait
 * for a way to place their stations; Uno-X, OIL! and Go'on are still to be added. Until then Denmark
 * shows part of the market, and the app and the site say so.
 */
import { asNumber, asRecord, asString, type FeedStation, type FuelKind, inRegion, type Raw, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const DK_OK_URL = 'https://mobility-prices.ok.dk/api/v1/fuel-prices';
export const DK_SHELL_URL = 'https://shellpumpepriser.geoapp.me/v1/prices';
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

/** One request per company. A company that fails is left out of this run; the others still count. */
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
  return stations;
}
