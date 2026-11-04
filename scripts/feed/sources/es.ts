// Spain: the Geoportal de Gasolineras of the Ministry for the Ecological Transition and the
// Demographic Challenge (REST, no key). One answer lists every station open to the public with the
// prices in force, refreshed by the Ministry every half hour. Reuse is allowed with attribution.
import {
  asRecord,
  asString,
  cleanPrice,
  type FeedStation,
  type FuelKind,
  inRegion,
  isEuropeanSummerTime,
  type Raw,
  roundCoord,
  tidyName,
} from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const ES_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
export const ES_MIN_CENTS = 60;
export const ES_MAX_CENTS = 400;
/** A normal answer lists about 11,500 stations; far fewer means something went wrong. */
export const ES_MIN_STATIONS = 8000;

/** The Ministry's price fields, in order of preference for each fuel kind. */
const FUELS: readonly { field: string; kind: FuelKind }[] = [
  { field: 'Precio Gasolina 95 E5', kind: 'regular' },
  { field: 'Precio Gasolina 95 E10', kind: 'e10' },
  { field: 'Precio Gasolina 95 E5 Premium', kind: 'premium' },
  { field: 'Precio Gasolina 98 E5', kind: 'super' },
  { field: 'Precio Gasolina 98 E10', kind: 'super' },
  { field: 'Precio Gasoleo A', kind: 'diesel' },
  { field: 'Precio Gasoleo Premium', kind: 'premium-diesel' },
  { field: 'Precio Gases licuados del petróleo', kind: 'lpg' },
  { field: 'Precio Gasolina 95 E85', kind: 'e85' },
  { field: 'Precio Diésel Renovable', kind: 'hvo' },
];

/** "39,211417" to 39.211417. */
export function esNumber(value: unknown): number | null {
  const text = asString(value).replace(',', '.');
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** "04/11/2026 5:22:06", Madrid time, to ISO 8601 UTC. Null when it can't be read. */
export function parseEsTime(value: unknown): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(asString(value));
  if (!match) return null;
  const [day, month, year, hour, minute, second] = match.slice(1).map((n) => Number(n ?? 0)) as [number, number, number, number, number, number];
  const local = Date.UTC(year, month - 1, day, hour, minute, Number.isFinite(second) ? second : 0);
  if (!Number.isFinite(local)) return null;
  // Central European Time, an hour more in summer. Guess from winter time, then correct.
  const winter = local - 60 * 60_000;
  const utc = local - (isEuropeanSummerTime(new Date(winter)) ? 120 : 60) * 60_000;
  return new Date(utc).toISOString();
}

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

function hhmm(text: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
}

/**
 * "L-D: 24H", "L-V: 07:00-22:00; S: 08:00-14:00", "L-S: 07:00-14:00 y 16:00-21:00" to the feed's
 * Monday-to-Sunday hours. A split day becomes its first opening to its last closing. Days the text
 * does not mention stay "unknown" rather than closed: many stations write only "L:" for every day.
 */
export function parseEsHours(value: unknown): string[] | null {
  const text = asString(value).toUpperCase();
  if (!text) return null;
  const hours: string[] = DAY_LETTERS.map(() => 'unknown');
  let known = 0;
  for (const part of text.split(';')) {
    const match = /^\s*([LMXJVSD])(?:\s*-\s*([LMXJVSD]))?\s*:\s*(.+)$/.exec(part);
    if (!match) continue;
    const from = DAY_LETTERS.indexOf(match[1] as (typeof DAY_LETTERS)[number]);
    const to = match[2] ? DAY_LETTERS.indexOf(match[2] as (typeof DAY_LETTERS)[number]) : from;
    const spec = (match[3] ?? '').trim();
    let value: string | null = null;
    if (/^24\s*H/.test(spec)) value = '24h';
    else if (/CERRAD/.test(spec)) value = 'closed';
    else {
      const ranges = spec.split(/\s+Y\s+/).map((r) => r.split('-').map((t) => hhmm(t)));
      const open = ranges[0]?.[0];
      const close = ranges[ranges.length - 1]?.[1];
      if (open && close) value = open === close ? '24h' : `${open}-${close === '2400' ? '2359' : close}`;
    }
    if (!value || from < 0 || to < 0) continue;
    for (let d = from; d <= (to >= from ? to : to + 7); d++) {
      hours[d % 7] = value;
      known++;
    }
  }
  return known > 0 ? hours : null;
}

/** Turns the Ministry's answer into feed stations. Anything odd is skipped, never guessed. */
export function buildEsStations(response: unknown): FeedStation[] {
  const body = asRecord(response);
  const list = Array.isArray(body?.ListaEESSPrecio) ? body.ListaEESSPrecio : [];
  const at = parseEsTime(body?.Fecha);
  if (!at) return [];
  const stations: FeedStation[] = [];
  for (const item of list) {
    const s: Raw | null = asRecord(item);
    if (!s) continue;
    const id = asString(s.IDEESS);
    const lat = esNumber(s.Latitud);
    const lng = esNumber(s['Longitud (WGS84)']);
    if (!id || lat === null || lng === null || !inRegion('es', lat, lng)) continue;
    const prices: FeedStation['prices'] = {};
    for (const { field, kind } of FUELS) {
      if (prices[kind]) continue;
      const price = cleanPrice(esNumber(s[field]), ES_MIN_CENTS, ES_MAX_CENTS);
      if (price !== null) prices[kind] = { p: price, at };
    }
    if (Object.keys(prices).length === 0) continue;
    const sign = tidyName(asString(s['Rótulo']), 'es');
    const tags: string[] = [];
    if (asString(s['Tipo Venta']).toUpperCase() === 'R') tags.push('members-only');
    stations.push({
      id: `es-${id}`,
      region: 'es',
      name: sign || 'Gasolinera',
      brand: '',
      address: tidyName(asString(s['Dirección']), 'es'),
      town: tidyName(asString(s.Municipio) || asString(s.Localidad), 'es'),
      postcode: asString(s['C.P.']),
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: parseEsHours(s.Horario),
      tags,
      prices,
    });
  }
  return stations;
}

/** One request for the whole country (about 12 MB). */
export async function fetchEs(): Promise<FeedStation[]> {
  const request = politeRequester(0);
  const response = await request(ES_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const stations = buildEsStations(await response.json());
  return stations;
}
