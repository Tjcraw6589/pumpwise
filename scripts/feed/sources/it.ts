/**
 * Italy: the open data of the Ministero delle Imprese e del Made in Italy (MIMIT), from the
 * Osservaprezzi carburanti scheme. Every station must report its prices to the Ministry. Two files
 * are published each morning under the Italian Open Data Licence 2.0 (IODL 2.0), which allows reuse,
 * commercial use included, with the source named: the station register and the prices in force at
 * 8:00.
 *
 * Permission and limits: the Ministry confirmed by email on 18 November 2026 (Mario Barone,
 * Direzione Generale Consumatori e Mercato) that the open files may be reused under IODL 2.0, and
 * asked us not to query the portal's own search service. Pumpwise reads only the two open files.
 *
 * The Ministry's site does not answer connections from outside Europe, and the feed is built on
 * servers in the United States, so the files are fetched through a small relay that runs in
 * Frankfurt (a Supabase function in the "Pumpwise" project, see LEGAL.md). The relay can fetch only
 * these two files and keeps each for 30 minutes.
 */
import { asNumber, type FeedStation, type FuelKind, isEuropeanSummerTime, roundCoord, stationInRegion, tidyName } from '../../../src/lib/feed.ts';
import { USER_AGENT } from '../http.ts';

export const IT_RELAY_URL = 'https://cuxmtbyqffxgsdduhoad.supabase.co/functions/v1/it-open-data';
export const IT_RELAY_REGION = 'eu-central-1';
/** The register lists about 24,000 stations; far fewer with prices means something went wrong. */
export const IT_MIN_STATIONS = 12000;
/** Euro cents a litre outside this range is a reporting mistake. */
export const IT_MIN_CENTS = 40;
export const IT_MAX_CENTS = 400;

const IT_KINDS_OF_SITE = new Set(['Stradale', 'Autostradale']);

/** The Ministry's fuel names as Pumpwise's fuels. Natural gas is not listed. */
export function itFuelKind(name: string): FuelKind | null {
  const text = name.trim().toLowerCase();
  if (!text || /metano|gnl|gnc/.test(text)) return null;
  if (/hvo/.test(text)) return 'hvo';
  if (text === 'gpl') return 'lpg';
  if (/diesel|gasolio/.test(text)) return text === 'gasolio' ? 'diesel' : 'premium-diesel';
  if (text === 'benzina') return 'regular';
  return 'super'; // Blue Super, HiQ Perform+, Benzina speciale, 98 and 100 octane petrols
}

/** "16/11/2026 20:00:07", Italian clock time, as an ISO time. */
export function parseItTime(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [day, month, year, hour, minute, second] = match.slice(1).map(Number) as [number, number, number, number, number, number];
  const local = Date.UTC(year, month - 1, day, hour, minute, second);
  if (!Number.isFinite(local)) return null;
  return new Date(local - (isEuropeanSummerTime(new Date(local)) ? 120 : 60) * 60_000).toISOString();
}

/**
 * The price file as prices by station. For each fuel the self service price is used when the station
 * has one, because that is the price drivers compare; otherwise the served price.
 */
export function readItPrices(csv: string, now: Date): Map<string, FeedStation['prices']> {
  const best = new Map<string, Map<FuelKind, { p: number; at: string; self: boolean }>>();
  for (const line of csv.split(/\r?\n/).slice(2)) {
    const [id, fuel, price, self, when] = line.split('|');
    if (!id || !fuel || !price || !when) continue;
    const kind = itFuelKind(fuel);
    const euros = asNumber(price);
    const at = parseItTime(when);
    if (!kind || euros === null || !at || Date.parse(at) > now.getTime() + 3_600_000) continue;
    const p = Math.round(euros * 1000) / 10;
    if (p < IT_MIN_CENTS || p > IT_MAX_CENTS) continue;
    const isSelf = self === '1';
    const station = best.get(id) ?? new Map<FuelKind, { p: number; at: string; self: boolean }>();
    const have = station.get(kind);
    if (!have || (isSelf && !have.self) || (isSelf === have.self && p < have.p)) station.set(kind, { p, at, self: isSelf });
    best.set(id, station);
  }
  const prices = new Map<string, FeedStation['prices']>();
  for (const [id, station] of best) {
    const entry: FeedStation['prices'] = {};
    for (const [kind, value] of station) entry[kind] = { p: value.p, at: value.at };
    prices.set(id, entry);
  }
  return prices;
}

/** The register joined with the prices. A few names contain the separator, so fields are read from both ends. */
export function buildItStations(register: string, prices: Map<string, FeedStation['prices']>): FeedStation[] {
  const stations: FeedStation[] = [];
  for (const line of register.split(/\r?\n/).slice(2)) {
    const f = line.split('|');
    if (f.length < 10) continue;
    const id = (f[0] ?? '').trim();
    const stationPrices = prices.get(id);
    if (!id || !stationPrices || Object.keys(stationPrices).length === 0) continue;
    const lat = asNumber(f[f.length - 2]);
    const lng = asNumber(f[f.length - 1]);
    if (lat === null || lng === null || !stationInRegion('it', lat, lng)) continue;
    // Ten fields is the normal row: the kind of site is the fourth. With more, look for it.
    let t = 3;
    if (f.length > 10) {
      const found = f.findIndex((value, index) => index >= 3 && index <= f.length - 7 && IT_KINDS_OF_SITE.has(value.trim()));
      if (found === -1) continue;
      t = found;
    }
    const flag = (f[t - 1] ?? '').trim();
    const site = (f[t] ?? '').trim();
    const operator = tidyName(f.slice(1, t - 1).join(' '));
    const address = f.slice(t + 2, f.length - 4).join(' ').replace(/\s+/g, ' ').trim();
    const town = tidyName((f[f.length - 4] ?? '').trim());
    const independent = /pompe bianche/i.test(flag) || !flag;
    const brand = independent ? operator || 'Indipendente' : flag;
    const postcode = /(\d{5})\s*$/.exec(address)?.[1] ?? '';
    stations.push({
      id: `it-${id}`,
      region: 'it',
      name: independent ? brand : [brand, town].filter(Boolean).join(' '),
      brand,
      address: tidyName(address.replace(/\s*\d{5}\s*$/, '')),
      town,
      postcode,
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags: site === 'Autostradale' ? ['motorway'] : [],
      prices: stationPrices,
    });
  }
  return stations;
}

async function relay(file: 'prezzo' | 'anagrafica'): Promise<string> {
  const response = await fetch(`${IT_RELAY_URL}?f=${file}`, {
    headers: { 'User-Agent': USER_AGENT, 'x-region': IT_RELAY_REGION },
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 120)}`);
  const text = await response.text();
  if (!text.startsWith('Estrazione')) throw new Error(`${file}: unexpected content`);
  return text;
}

export async function fetchIt(now: Date): Promise<FeedStation[]> {
  const priceFile = await relay('prezzo');
  const register = await relay('anagrafica');
  const prices = readItPrices(priceFile, now);
  const stations = buildItStations(register, prices);
  console.log(`it: ${priceFile.split('\n', 1)[0]}, ${register.split('\n').length - 3} in the register, ${prices.size} with prices, ${stations.length} stations`);
  return stations;
}
