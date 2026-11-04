// France: the government's live fuel price feed (prix-carburants.gouv.fr, Ministry of the Economy),
// a zipped XML file of every station refreshed about every 10 minutes. No key; Licence Ouverte 2.0,
// which asks for the source to be credited. The feed gives addresses but no station or brand names.
import { cleanPrice, type FeedStation, type FuelKind, inRegion, isEuropeanSummerTime, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';
import { firstFileInZip } from '../zip.ts';

export const FR_URL = 'https://donnees.roulez-eco.fr/opendata/instantane';
export const FR_MIN_CENTS = 60;
export const FR_MAX_CENTS = 400;
/** A normal file lists about 9,800 stations; far fewer means something went wrong. */
export const FR_MIN_STATIONS = 7000;

const FUEL_KINDS: Record<string, FuelKind> = {
  E10: 'regular',
  SP95: 'premium',
  SP98: 'super',
  Gazole: 'diesel',
  E85: 'e85',
  GPLc: 'lpg',
};

/** Services worth showing, by the feed's own wording. */
const SERVICE_TAGS: readonly [RegExp, string][] = [
  [/^Toilettes/, 'toilets'],
  [/^Lavage/, 'car-wash'],
  [/^Station de gonflage/, 'air'],
  [/^DAB/, 'atm'],
  [/AdBlue/i, 'adblue'],
  [/^Piste poids lourds/, 'truck'],
  [/^Boutique alimentaire/, 'supermarket'],
];

/** XML text with the five standard entities decoded. */
export function xmlText(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function attr(tag: string, name: string): string {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return match ? xmlText(match[1] ?? '') : '';
}

/** "2026-11-04 04:59:27", Paris time, to ISO 8601 UTC. Null when it can't be read. */
export function parseFrTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map((n) => Number(n ?? 0)) as [number, number, number, number, number, number];
  const local = Date.UTC(year, month - 1, day, hour, minute, Number.isFinite(second) ? second : 0);
  if (!Number.isFinite(local)) return null;
  const winter = local - 60 * 60_000;
  return new Date(local - (isEuropeanSummerTime(new Date(winter)) ? 120 : 60) * 60_000).toISOString();
}

/** "06.30" to "0630". */
function frClock(value: string): string | null {
  const match = /^(\d{1,2})[.:h](\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
}

/**
 * Opening hours. A 24-hour card machine ("automate 24/24") means fuel can be bought at any time, so
 * the station counts as open round the clock. Otherwise each day's opening and closing times are
 * used; a day the feed leaves blank stays "unknown".
 */
export function parseFrHours(block: string): string[] | null {
  if (/automate-24-24="1"/.test(block)) return ['24h', '24h', '24h', '24h', '24h', '24h', '24h'];
  const days: string[] = ['unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown'];
  let known = 0;
  for (const match of block.matchAll(/<jour\b([^>]*?)(?:\/>|>([\s\S]*?)<\/jour>)/g)) {
    const head = match[1] ?? '';
    const index = Number(attr(head, 'id')) - 1;
    if (!(index >= 0 && index < 7)) continue;
    const inner = match[2] ?? '';
    const slots = [...inner.matchAll(/<horaire\b([^>]*)\/?>/g)].map((m) => [frClock(attr(m[1] ?? '', 'ouverture')), frClock(attr(m[1] ?? '', 'fermeture'))]);
    const open = slots[0]?.[0];
    const close = slots[slots.length - 1]?.[1];
    if (attr(head, 'ferme') === '1' && !(open && close && open !== close)) {
      days[index] = 'closed';
      known++;
    } else if (open && close) {
      days[index] = open === close ? '24h' : `${open}-${close === '2400' ? '2359' : close}`;
      known++;
    }
  }
  return known > 0 ? days : null;
}

/** Turns the government XML into feed stations. Anything odd is skipped, never guessed. */
export function buildFrStations(xml: string, now: Date): FeedStation[] {
  const stations: FeedStation[] = [];
  const latest = now.getTime() + 10 * 60_000;
  for (const match of xml.matchAll(/<pdv\b([^>]*)>([\s\S]*?)<\/pdv>/g)) {
    const head = match[1] ?? '';
    const body = match[2] ?? '';
    const id = attr(head, 'id');
    // Coordinates come as degrees times 100,000 (4675351.71 is 46.7535171).
    const lat = Number(attr(head, 'latitude')) / 100_000;
    const lng = Number(attr(head, 'longitude')) / 100_000;
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng) || !inRegion('fr', lat, lng)) continue;
    const prices: FeedStation['prices'] = {};
    for (const p of body.matchAll(/<prix\b([^>]*)\/?>/g)) {
      const tag = p[1] ?? '';
      const kind = FUEL_KINDS[attr(tag, 'nom')];
      if (!kind) continue;
      const price = cleanPrice(attr(tag, 'valeur'), FR_MIN_CENTS, FR_MAX_CENTS);
      const at = parseFrTime(attr(tag, 'maj'));
      if (price === null || !at || Date.parse(at) > latest) continue;
      prices[kind] = { p: price, at };
    }
    if (Object.keys(prices).length === 0) continue;
    const address = tidyName(xmlText(/<adresse>([\s\S]*?)<\/adresse>/.exec(body)?.[1] ?? ''), 'fr');
    const town = tidyName(xmlText(/<ville>([\s\S]*?)<\/ville>/.exec(body)?.[1] ?? ''), 'fr');
    const services = [...body.matchAll(/<service>([\s\S]*?)<\/service>/g)].map((m) => xmlText(m[1] ?? ''));
    const tags = new Set<string>();
    if (attr(head, 'pop') === 'A') tags.add('motorway');
    for (const service of services) for (const [pattern, tag] of SERVICE_TAGS) if (pattern.test(service)) tags.add(tag);
    if (/automate-24-24="1"/.test(body)) tags.add('24h-fuel');
    stations.push({
      id: `fr-${id}`,
      region: 'fr',
      // No station names in the feed: the address is what drivers can match on the road.
      name: address || (town ? `Station, ${town}` : 'Station'),
      brand: '',
      address: '',
      town,
      postcode: attr(head, 'cp'),
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: parseFrHours(/<horaires\b[\s\S]*?<\/horaires>/.exec(body)?.[0] ?? ''),
      tags: [...tags],
      prices,
    });
  }
  return stations;
}

/** One request: the zipped XML for the whole country (about 1 MB, 12 MB unzipped). */
export async function fetchFr(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(0, 'application/zip');
  const response = await request(FR_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { data } = await firstFileInZip(new Uint8Array(await response.arrayBuffer()));
  // The file declares ISO-8859-1.
  const stations = buildFrStations(new TextDecoder('latin1').decode(data), now);
  return stations;
}
