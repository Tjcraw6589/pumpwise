// Mexico: the Energy Regulatory Commission's (CRE) open data on fuel prices. Two XML lists, one of
// stations (name and position) and one of the prices each station reports, joined on the station
// number. No key. The lists carry no addresses, opening hours or dates, so prices are shown as the
// ones in force ("current") rather than with a report time. The town and state come from the
// station's position, looked up offline in INEGI's municipal boundaries (mx-municipios.ts).
import { asNumber, type FeedStation, type FuelKind, inRegion, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';
import { mxMunicipio } from './mx-municipios.ts';

export const MX_PLACES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/places';
export const MX_PRICES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/prices';
/** Pesos per litre allowed, in centavos: 10 to 40 pesos. */
export const MX_MIN_CENTAVOS = 1000;
export const MX_MAX_CENTAVOS = 4000;
/** About 12,000 stations report prices; far fewer means something went wrong. */
export const MX_MIN_STATIONS = 9000;

const FUEL_KINDS: Record<string, FuelKind> = { regular: 'regular', premium: 'premium', diesel: 'diesel' };

function decode(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/** "ESTACION HIPODROMO SA DE CV" to "Estacion Hipodromo": the company form is noise on a sign. */
export function mxName(raw: string): string {
  const text = decode(raw)
    .replace(/[,.]?\s*\b(S\.?\s*A\.?\s*P\.?\s*I\.?|S\.?\s*A\.?|S\.?\s*(?:DE\s*)?R\.?\s*L\.?)(\s*(DE|D\.)\s*C\.?\s*V\.?)?\s*$/i, '')
    .replace(/[,\s]+$/, '');
  return tidyName(text, 'es');
}

/** Pesos to centavos with one decimal, or null outside a believable range. */
export function mxPrice(value: unknown): number | null {
  const pesos = asNumber(value);
  if (pesos === null) return null;
  const centavos = Math.round(pesos * 1000) / 10;
  return centavos >= MX_MIN_CENTAVOS && centavos <= MX_MAX_CENTAVOS ? centavos : null;
}

/** Joins the two CRE lists into feed stations. Anything odd is skipped, never guessed. */
export function buildMxStations(placesXml: string, pricesXml: string, now: Date): FeedStation[] {
  const at = now.toISOString();
  // A station can be listed more than once, each time with some of its fuels (about one in nine in
  // November 2026), so the entries are combined. A fuel listed at two different prices is left out.
  const offers = new Map<string, Map<FuelKind, Set<number>>>();
  for (const match of pricesXml.matchAll(/<place\s+place_id="(\d+)"\s*>([\s\S]*?)<\/place>/g)) {
    const id = match[1] as string;
    const station = offers.get(id) ?? new Map<FuelKind, Set<number>>();
    for (const p of (match[2] ?? '').matchAll(/<gas_price\s+type="([a-z]+)"\s*>([^<]*)<\/gas_price>/g)) {
      const kind = FUEL_KINDS[p[1] ?? ''];
      const price = mxPrice(p[2]);
      if (kind && price !== null) station.set(kind, (station.get(kind) ?? new Set<number>()).add(price));
    }
    offers.set(id, station);
  }
  const prices = new Map<string, FeedStation['prices']>();
  for (const [id, station] of offers) {
    const list: FeedStation['prices'] = {};
    for (const [kind, seen] of station) if (seen.size === 1) list[kind] = { p: [...seen][0] as number, at };
    if (Object.keys(list).length > 0) prices.set(id, list);
  }
  const stations: FeedStation[] = [];
  for (const match of placesXml.matchAll(/<place\s+place_id="(\d+)"\s*>([\s\S]*?)<\/place>/g)) {
    const id = match[1] as string;
    const body = match[2] ?? '';
    const list = prices.get(id);
    if (!list) continue;
    const lng = asNumber(/<x>([^<]*)<\/x>/.exec(body)?.[1]);
    const lat = asNumber(/<y>([^<]*)<\/y>/.exec(body)?.[1]);
    if (lat === null || lng === null || !inRegion('mx', lat, lng)) continue;
    // No street address in the source: the town is the municipality the position falls in.
    const place = mxMunicipio(lat, lng);
    stations.push({
      id: `mx-${id}`,
      region: 'mx',
      name: mxName(/<name>([\s\S]*?)<\/name>/.exec(body)?.[1] ?? '') || 'Gasolinera',
      brand: '',
      address: '',
      town: place?.municipio ?? '',
      ...(place ? { state: place.estado } : {}),
      postcode: '',
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags: [],
      prices: list,
    });
  }
  return stations;
}

/** Two requests: the station list and the price list (about 3 MB each). */
export async function fetchMx(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000, 'application/xml');
  const places = await request(MX_PLACES_URL);
  if (!places.ok) throw new Error(`places: HTTP ${places.status}`);
  const placesXml = await places.text();
  const pricesResponse = await request(MX_PRICES_URL);
  if (!pricesResponse.ok) throw new Error(`prices: HTTP ${pricesResponse.status}`);
  const stations = buildMxStations(placesXml, await pricesResponse.text(), now);
  return stations;
}
