// United Kingdom, from the retailers' own price files.
//
// In 2023 the Competition and Markets Authority asked the large fuel retailers to publish their pump prices
// in a common JSON file on their own websites, "open to third party developers", until the government's
// Fuel Finder service replaced it. Fuel Finder only answers connections from inside the UK (see uk.ts), but
// several retailers still keep their own file up to date. Each file gives every station's position and
// prices in pence, and one time for the whole file.
//
// A file that has not changed for two days is treated as abandoned and left out (Tesco's and Rontec's froze
// in spring 2026), so only prices a retailer is still standing behind are shown. These are company prices,
// not government data, and cover only the retailers below.
import { asNumber, asRecord, asString, type FeedStation, type FuelKind, inRegion, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const UK_RETAIL_MIN_STATIONS = 300;
export const UK_RETAIL_MIN_PENCE = 80;
export const UK_RETAIL_MAX_PENCE = 300;
/** A retailer's file older than this is no longer being kept up. */
export const UK_RETAIL_MAX_AGE_HOURS = 48;

export const UK_RETAILERS: { key: string; name: string; url: string }[] = [
  { key: 'asda', name: 'Asda', url: 'https://storelocator.asda.com/fuel_prices_data.json' },
  { key: 'esso', name: 'Esso', url: 'https://fuelprices.esso.co.uk/latestdata.json' },
  { key: 'sgn', name: 'SGN', url: 'https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json' },
  { key: 'jet', name: 'JET', url: 'https://jetlocal.co.uk/fuel_prices_data.json' },
  { key: 'moto', name: 'Moto', url: 'https://moto-way.com/fuel-price/fuel_prices.json' },
  { key: 'tesco', name: 'Tesco', url: 'https://www.tesco.com/fuel_prices/fuel_prices_data.json' },
  { key: 'rontec', name: 'Rontec', url: 'https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json' },
  { key: 'applegreen', name: 'Applegreen', url: 'https://applegreenstores.com/fuel-prices/data.json' },
];

const FUEL_KINDS: Record<string, FuelKind> = { E10: 'regular', E5: 'premium', B7: 'diesel', SDV: 'premium-diesel' };

/** British Summer Time: from 01:00 UTC on the last Sunday of March to 01:00 UTC on the last Sunday of October. */
function lastSunday(year: number, month: number): number {
  const end = new Date(Date.UTC(year, month + 1, 0, 1));
  return end.getTime() - end.getUTCDay() * 86400000;
}

/** "17/11/2026 11:00:00", UK clock time, as an ISO time. Null when unreadable or in the future. */
export function ukRetailTime(value: unknown, now: Date): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(asString(value).trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6] ?? '0');
  let ms = Date.UTC(year, month - 1, day, hour, minute, second);
  if (!Number.isFinite(ms) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (ms - 3600000 >= lastSunday(year, 2) && ms - 3600000 < lastSunday(year, 9)) ms -= 3600000;
  if (ms > now.getTime() + 15 * 60000) return null;
  return new Date(ms).toISOString();
}

/** Pence a litre (159.7), which is already hundredths of a pound. Null outside any real pump price. */
export function ukRetailPrice(value: unknown): number | null {
  const pence = asNumber(value);
  if (pence === null || pence < UK_RETAIL_MIN_PENCE || pence > UK_RETAIL_MAX_PENCE) return null;
  return Math.round(pence * 10) / 10;
}

/** "Abbey Park - North London Road, Coventry" as a street and a town: the town is the last part with letters. */
export function ukRetailPlace(address: string, postcode: string): { street: string; town: string } {
  const parts = address.split(',').map((p) => tidyName(p.trim())).filter((p) => p && p.replace(/\s+/g, '').toUpperCase() !== postcode.replace(/\s+/g, '').toUpperCase());
  if (parts.length < 2) return { street: parts[0] ?? '', town: '' };
  // A trailing county ("Lancashire") is common; the town is then the part before it. Without a list of
  // counties the last part is used, which is the town in the files that give no county.
  return { street: parts.slice(0, -1).join(', '), town: parts[parts.length - 1] ?? '' };
}

/** One retailer's file as feed stations; nothing when the file is stale or unreadable. */
export function buildUkRetailStations(body: unknown, key: string, retailer: string, now: Date): FeedStation[] {
  const file = asRecord(body);
  const at = ukRetailTime(file?.last_updated, now);
  if (!file || !at || !Array.isArray(file.stations)) return [];
  if (now.getTime() - Date.parse(at) > UK_RETAIL_MAX_AGE_HOURS * 3600000) return [];
  const stations: FeedStation[] = [];
  for (const item of file.stations) {
    const raw = asRecord(item);
    if (!raw) continue;
    const id = asString(raw.site_id);
    const where = asRecord(raw.location);
    const lat = asNumber(where?.latitude);
    const lng = asNumber(where?.longitude);
    if (!id || lat === null || lng === null || !inRegion('uk', lat, lng)) continue;
    const prices: FeedStation['prices'] = {};
    for (const [code, value] of Object.entries(asRecord(raw.prices) ?? {})) {
      const kind = FUEL_KINDS[code.toUpperCase()];
      const p = ukRetailPrice(value);
      if (kind && p !== null) prices[kind] = { p, at };
    }
    if (Object.keys(prices).length === 0) continue;
    const postcode = asString(raw.postcode).trim().toUpperCase();
    const { street, town } = ukRetailPlace(asString(raw.address), postcode);
    const brand = tidyName(asString(raw.brand)) || retailer;
    stations.push({
      id: `uk-${key}-${id}`,
      region: 'uk',
      name: [brand, town || street].filter(Boolean).join(' '),
      brand,
      address: street,
      town,
      postcode,
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags: [],
      prices,
    });
  }
  return stations;
}

/** One request per retailer. A retailer that fails or has gone stale is left out; the others still count. */
export async function fetchUkRetail(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000);
  const seen = new Set<string>();
  const stations: FeedStation[] = [];
  for (const retailer of UK_RETAILERS) {
    try {
      // Some retailers' sites refuse a request now and then (SGN answered 403 once in the audit of 17 Nov 2026): try twice more.
      let response = await request(retailer.url);
      for (let attempt = 0; attempt < 2 && !response.ok; attempt += 1) {
        await new Promise((done) => setTimeout(done, 4000));
        response = await request(retailer.url);
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const built = buildUkRetailStations(await response.json(), retailer.key, retailer.name, now);
      // The same forecourt can be in two files (a motorway site in its operator's and its fuel brand's).
      const fresh = built.filter((s) => {
        const spot = `${s.lat.toFixed(3)},${s.lng.toFixed(3)}`;
        if (seen.has(spot)) return false;
        seen.add(spot);
        return true;
      });
      console.log(`uk: ${retailer.name} ${fresh.length} stations${built.length ? '' : ' (file stale or empty)'}`);
      stations.push(...fresh);
    } catch (error) {
      console.warn(`uk: ${retailer.name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return stations;
}
