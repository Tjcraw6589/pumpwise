/**
 * Lithuania: the Lithuanian Energy Agency (Lietuvos energetikos agentūra, LEA). Since 8 April 2026
 * every fuel station operator reports its prices to the agency by 10:00 each working day, and the
 * agency publishes them on a price map (degalukainos.ena.lt) and as one Excel workbook for the year,
 * "Pranešimai ir pradiniai duomenys" on https://www.ena.lt/dk-pr-pr-duomenys/.
 *
 * Permission: Lina Daukšaitė of the agency answered Pumpwise on 19 November 2026 (see LEGAL.md).
 * Reuse is allowed, advertising included, on these terms: credit "Data source: Lithuanian Energy
 * Agency (LEA)" with a link, say that the original prices come from the fuel station operators, and
 * never look like an official LEA system. There is no API; a future one will need the agency's
 * authorisation. So Pumpwise reads ONLY the public workbook, never the price map's own interface.
 * The workbook itself adds that the operating company must be named, so each station keeps its
 * operator's name exactly as the agency prints it.
 *
 * The workbook has one row per station, fuel and day (company, municipality, address, fuel, price,
 * date) and no coordinates. Each address is looked up once on OpenStreetMap (Nominatim, one request
 * a second at most, a limited number per run) and kept in lt-places.json on the "stats" branch, the
 * same way as Denmark. A station enters the feed once its position is known.
 *
 * The share link below is the 2026 workbook. A new year brings a new workbook and a new link: when
 * the newest rows are more than a week old the source gives no stations, and the link must be
 * replaced with the one on the agency's page.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { asNumber, asRecord, type FeedStation, type FuelKind, hashId, inRegion, isEuropeanSummerTime, roundCoord } from '../../../src/lib/feed.ts';
import { politeRequester, USER_AGENT } from '../http.ts';
import { filesInZip } from '../zip.ts';

export const LT_WORKBOOK_URL = 'https://ltenergagen.sharepoint.com/:x:/s/intra/doc/IQBfrNG1U7XYR5LAZBxiytLDARSs2Dah4n5ehD0IaSg0dUs?download=1';
export const LT_GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
/** Address lookups in one run, at one a second. */
export const LT_LOOKUPS_PER_RUN = 60;
/** An address that was not found is tried again after this many days. */
export const LT_RETRY_DAYS = 30;
/** About 740 stations report; far fewer placed means the workbook or the saved positions are missing. */
export const LT_MIN_STATIONS = 400;
/** Euro cents a litre outside this range is a reporting mistake. */
export const LT_MIN_CENTS = 30;
export const LT_MAX_CENTS = 400;
/** A price older than this many days is left out: the station has stopped reporting. */
export const LT_MAX_AGE_DAYS = 7;
/** The newest rows are at the end of the sheet; this much of it holds more than a week of them. */
const LT_TAIL_BYTES = 6_000_000;

export interface LtRow {
  company: string;
  municipality: string;
  address: string;
  fuel: string;
  /** The cell as printed: a number of euros, or words when the fuel is not sold or was not reported. */
  price: string;
  /** Excel's day number. */
  day: number;
}

export interface LtDraft {
  station: Omit<FeedStation, 'lat' | 'lng'>;
  /** The address as published, the key the saved position is checked against. */
  query: string;
  /** What to ask the map, most exact first. Every answer is checked against `where` before it is believed. */
  lookups: string[];
  where: LtWhere;
}

/** The parts of a published address that an answer from the map must agree with. */
export interface LtWhere {
  /** "Kauno rajono savivaldybė", as OpenStreetMap writes it. */
  municipality: string;
  /** The town or village without "k.", in the form the operator wrote (often the genitive: "Sudmantų"). */
  place: string;
  /** "Vilniaus pl." without the house number; empty when the address has no street. */
  road: string;
  house: string;
  postcode: string;
  /** The operator's short name ("Viada"), to recognise its station among the fuel stations near a village. */
  brand: string;
}

export type LtPlaces = Record<string, { a: string; lat?: number; lng?: number; r?: number; miss?: string }>;

export function ltFuelKind(name: string): FuelKind | null {
  const fuel = name.trim().toLowerCase();
  if (fuel === '95 benzinas') return 'regular';
  if (fuel === 'dyzelinas') return 'diesel';
  if (fuel === 'snd') return 'lpg';
  return null;
}

/** Excel's day number as a date (YYYY-MM-DD). */
export function ltDay(serial: number): string {
  return new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000).toISOString().slice(0, 10);
}

/** Operators report by 10:00 Lithuanian time, so that is the time given to the day's prices. */
export function ltReportedAt(serial: number, now: Date): string {
  const tenUtc = new Date(`${ltDay(serial)}T10:00:00Z`);
  const at = new Date(tenUtc.getTime() - (isEuropeanSummerTime(tenUtc) ? 3 : 2) * 3_600_000);
  return (at.getTime() > now.getTime() ? now : at).toISOString();
}

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

/** The workbook's shared text table: cells hold a number that points into it. */
export function ltSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  for (const item of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [...(item[1] ?? '').matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1] ?? '');
    strings.push(unescapeXml(parts.join('')).replace(/\s+/g, ' ').trim());
  }
  return strings;
}

/** Every complete row in a piece of the sheet, with its cells by column letter. */
export function ltSheetRows(xml: string, strings: string[]): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  for (const row of xml.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<string, string> = {};
    for (const cell of (row[1] ?? '').matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const value = /<v>([\s\S]*?)<\/v>/.exec(cell[3] ?? '')?.[1];
      if (value === undefined) continue;
      cells[cell[1] ?? ''] = /\bt="s"/.test(cell[2] ?? '') ? (strings[Number(value)] ?? '') : unescapeXml(value);
    }
    rows.push(cells);
  }
  return rows;
}

/** True when the sheet still has the six columns this reader expects, in order. */
export function ltHeaderOk(rows: Record<string, string>[]): boolean {
  return rows.some((r) => /mon/i.test(r.A ?? '') && /savivaldyb/i.test(r.B ?? '') && /adres/i.test(r.C ?? '') && /degal/i.test(r.D ?? '') && /kaina/i.test(r.E ?? '') && /data/i.test(r.F ?? ''));
}

export function ltRows(rows: Record<string, string>[]): LtRow[] {
  const out: LtRow[] = [];
  for (const r of rows) {
    const day = asNumber(r.F);
    if (!r.A || !r.C || !r.D || r.E === undefined || day === null || day < 40_000) continue;
    out.push({ company: r.A, municipality: r.B ?? '', address: r.C, fuel: r.D, price: r.E, day });
  }
  return out;
}

/** "UAB Viada LT" as the short name drivers know, for the station's title. The operator's full name is kept as the brand. */
export function ltShortName(company: string): string {
  const name = company
    .replace(/,\s*degalinė\s*$/i, '')
    .replace(/^(UAB|AB|IĮ|MB|VšĮ|KB|ŽŪB)\s+/i, '')
    .replace(/\s+(UAB|AB)$/i, '')
    .trim();
  if (/^viada\b/i.test(name)) return 'Viada';
  if (/^circle k\b/i.test(name)) return 'Circle K';
  if (/^neste\b/i.test(name)) return 'Neste';
  if (/^orlen\b/i.test(name)) return 'Orlen';
  if (/^emsi$/i.test(name)) return 'EMSI';
  return name || company;
}

const LT_VILLAGE = /\s(k|mstl|vs|apyl)\.$/i;
const LT_STREET_NAME = /\s(g|pl|pr|al|kel|kl|aplinkl|tak|skg|a)\.?(\s|$)/i;

/**
 * "Vilnius, Subačiaus g. 64, 11342" as town, street and postcode. Operators write village addresses
 * several ways: without a street ("Kuosiškių k. 4"), without a comma ("Kušliškių k. Suvalkijos g.")
 * or street first ("Alytaus g. 59, Krosnos k.").
 */
export function ltAddress(text: string): { town: string; street: string; postcode: string } {
  let rest = text.replace(/\s+/g, ' ').trim();
  const code = /[,\s]\s*(?:LT-?)?(\d{5})$/.exec(rest);
  const postcode = code?.[1] ?? '';
  if (code) rest = rest.slice(0, code.index).replace(/[,\s]+$/, '');
  let parts = rest.split(/,\s*/).filter(Boolean);
  // "Lazdijų sen., Janaslavo k. 11": the first part is the district, not the place.
  if (parts.length > 1 && /\s(sen|apyl)\.$/i.test(parts[0] ?? '')) parts = parts.slice(1);
  if (parts.length === 1) {
    // "Kušliškių k. Suvalkijos g.": the village, then the street, with no comma between them.
    const joined = /^(.+?\s(?:k|mstl|vs)\.)\s+(\D.*)$/i.exec(parts[0] ?? '');
    if (joined) parts = [joined[1] ?? '', joined[2] ?? ''];
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  if (parts.length === 2 && LT_VILLAGE.test(last) && LT_STREET_NAME.test(first)) return { town: last, street: first, postcode };
  // "Rietavas, Lėgų k. 1": the town the village belongs to, then the village and a house number.
  if (parts.length === 2 && /\s(k|vs)\.?\s*\d+\s?[A-Za-z]?$/i.test(last)) return { town: last.replace(/\s+\d+\s?[A-Za-z]?$/, ''), street: '', postcode };
  if (parts.length > 1) return { town: first, street: parts.slice(1).join(', '), postcode };
  // "Kuosiškių k. 4": a village and a house number, no street.
  return { town: first.replace(/\s+\d+\s?[A-Za-z]?$/, ''), street: '', postcode };
}

/** A village without its "k.": "Sudmantų k." is the village of Sudmantai, written here as "Sudmantų". */
function villageName(town: string): string {
  return town.replace(/\s+(k|mstl|vs|glž\. st|apyl)\.?$/i, '').trim();
}

/** "Kauno r. sav." as OpenStreetMap writes it: "Kauno rajono savivaldybė". */
export function ltMunicipality(short: string): string {
  return short
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\sr\.\s?sav\.?$/i, ' rajono savivaldybė')
    .replace(/\sm\.\s?sav\.?$/i, ' miesto savivaldybė')
    .replace(/\ssav\.?$/i, ' savivaldybė');
}

/** "Vilniaus pl. 6" as the road and the house number. A part that names the village itself is not a road. */
export function ltRoad(part: string): { road: string; house: string } {
  // "Beržų g. 24/Drąsiųjų g. 7": a corner plot, known by its first street.
  const text = (part.split(/\s*\/\s*(?=\D)/)[0] ?? '').trim();
  if (!text || LT_VILLAGE.test(text) || /\s(k|mstl|vs)\.?\s*\d+\s?[A-Za-z]?$/i.test(text)) return { road: '', house: '' };
  const numbered = /^(.*?\D)\s*(\d+\s?[A-Za-z]?(?:\s?\/\s?\d+)?)$/.exec(text);
  if (numbered) return { road: (numbered[1] ?? '').replace(/[,\s]+$/, ''), house: (numbered[2] ?? '').replace(/\s+/g, '') };
  return LT_STREET_NAME.test(text) ? { road: text, house: '' } : { road: '', house: '' };
}

/**
 * The names a Lithuanian place may have on the map when the address gives it in the genitive:
 * "Sudmantų" is Sudmantai, "Kakliniškių" is Kakliniškės, "Girkalnio" is Girkalnis, "Brazavo" is Brazavas.
 */
export function ltNominatives(place: string): string[] {
  const words = place.split(' ');
  const last = words.pop() ?? '';
  const swap = (ending: RegExp, ...to: string[]) => (ending.test(last) ? to.map((t) => last.replace(ending, t)) : null);
  const forms =
    swap(/čių$/, 'čiai', 'tės') ??
    swap(/džių$/, 'džiai', 'dės') ??
    swap(/ių$/, 'iai', 'ės') ??
    swap(/ų$/, 'ai', 'os') ??
    swap(/čio$/, 'tis', 'tys') ??
    swap(/džio$/, 'dis', 'dys') ??
    swap(/io$/, 'is', 'ys') ??
    swap(/o$/, 'as') ??
    swap(/os$/, 'a') ??
    swap(/ės$/, 'ė') ??
    swap(/aus$/, 'us') ??
    [];
  return [...new Set([place, ...forms.map((form) => [...words, form].join(' '))])];
}

const fold = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
/** What is left of a place name once its ending is removed, so the genitive and the nominative compare equal. */
const stem = (name: string) => fold(name.split(' ').pop() ?? '').replace(/(čių|džių|čio|džio|čiai|džiai|ių|iai|io|aus|ės|os|ai|as|is|ys|us|ų|o|a|ė)$/u, '');

/** The newest reported price of each fuel at each station, as drafts waiting for a position. */
export function buildLtDrafts(rows: LtRow[], now: Date): LtDraft[] {
  const newest = rows.reduce((max, r) => Math.max(max, r.day), 0);
  const byStation = new Map<string, { row: LtRow; fuels: Map<FuelKind, { p: number; day: number }> }>();
  for (const row of rows) {
    if (row.day < newest - LT_MAX_AGE_DAYS) continue;
    const kind = ltFuelKind(row.fuel);
    const euros = asNumber(row.price);
    if (!kind || euros === null) continue;
    const p = Math.round(euros * 1000) / 10;
    if (p < LT_MIN_CENTS || p > LT_MAX_CENTS) continue;
    const key = `${row.company}|${row.address}`;
    const entry = byStation.get(key) ?? { row, fuels: new Map<FuelKind, { p: number; day: number }>() };
    const have = entry.fuels.get(kind);
    if (!have || row.day >= have.day) entry.fuels.set(kind, { p, day: row.day });
    byStation.set(key, entry);
  }
  // A workbook whose newest day is long past (a new year's file has replaced it) gives nothing.
  if (Date.parse(`${ltDay(newest)}T00:00:00Z`) < now.getTime() - (LT_MAX_AGE_DAYS + 1) * 86_400_000) return [];
  const drafts: LtDraft[] = [];
  for (const [key, { row, fuels }] of byStation) {
    const where = ltAddress(row.address);
    if (!where.town) continue;
    const prices: FeedStation['prices'] = {};
    for (const [kind, value] of fuels) prices[kind] = { p: value.p, at: ltReportedAt(value.day, now) };
    const village = villageName(where.town);
    const municipality = ltMunicipality(row.municipality);
    // "Grigiškės, Kovo 11-osios g. 75": the street is the last part, the rest says which part of town.
    const { road, house } = where.street.split(', ').map(ltRoad).reverse().find((part) => part.road) ?? { road: '', house: '' };
    const lookups: string[] = [];
    if (road) {
      const line = house ? `${road} ${house}` : road;
      if (where.postcode) lookups.push(`${line}, ${where.postcode}`);
      for (const name of ltNominatives(village).slice(0, 2)) lookups.push(`${line}, ${name}, ${municipality}`);
    } else {
      for (const name of ltNominatives(village)) lookups.push(`${name}, ${municipality}`);
    }
    drafts.push({
      station: {
        id: `lt-${hashId(key)}`,
        region: 'lt',
        name: `${ltShortName(row.company)} ${village}`,
        brand: row.company,
        address: where.street || where.town,
        town: where.town,
        postcode: where.postcode,
        hours: null,
        tags: [],
        prices,
      },
      query: row.address,
      lookups,
      where: { municipality, place: village, road, house, postcode: where.postcode, brand: ltShortName(row.company) },
    });
  }
  return drafts;
}

/** The drafts whose position is known, and the ones still to look up (new, moved, or not found long enough ago). */
export function placeLtDrafts(drafts: LtDraft[], places: LtPlaces, now: Date): { stations: FeedStation[]; todo: LtDraft[] } {
  const stations: FeedStation[] = [];
  const todo: LtDraft[] = [];
  for (const draft of drafts) {
    const saved = places[draft.station.id];
    if (saved && saved.a === draft.query && typeof saved.lat === 'number' && typeof saved.lng === 'number') {
      stations.push({ ...draft.station, lat: saved.lat, lng: saved.lng });
    } else if (!saved || saved.a !== draft.query || !saved.miss || now.getTime() - Date.parse(saved.miss) > LT_RETRY_DAYS * 86_400_000) {
      todo.push(draft);
    }
  }
  return { stations, todo };
}

/**
 * The first of Nominatim's answers that agrees with the published address, as a position; null when
 * none does. A wrong pin is worse than a missing station, so an answer must be in the same
 * municipality and then be one of: the same road and house number; a fuel station on the same road;
 * the same road in the same village (r 26, somewhere along that road); or, for an address with no
 * road, the village itself.
 */
export function ltLookupResult(body: unknown, where: LtWhere): { lat: number; lng: number; r: number } | null {
  for (const item of Array.isArray(body) ? body : []) {
    const raw = asRecord(item);
    const address = asRecord(raw?.address);
    if (!raw || !address) continue;
    const lat = asNumber(raw.lat);
    const lng = asNumber(raw.lon);
    if (lat === null || lng === null || !inRegion('lt', lat, lng)) continue;
    if (!fold(String(raw.display_name ?? '')).includes(fold(where.municipality))) continue;
    // The place is looked for in the whole written address: OpenStreetMap files a village under several different keys.
    const named = String(raw.display_name ?? '').split(', ');
    const samePlace = named.some((name) => fold(name) === fold(where.place) || (stem(name).length > 2 && stem(name) === stem(where.place)));
    const samePostcode = Boolean(where.postcode) && String(address.postcode ?? '').replace(/\D/g, '') === where.postcode;
    const at = { lat: roundCoord(lat), lng: roundCoord(lng) };
    if (where.road) {
      const theirs = fold(String(address.road ?? ''));
      const ours = fold(where.road);
      if (!theirs || !(theirs === ours || theirs.startsWith(ours) || ours.startsWith(theirs))) continue;
      if (!samePlace && !samePostcode) continue;
      const sameHouse = Boolean(where.house) && fold(String(address.house_number ?? '')) === fold(where.house);
      if (sameHouse || raw.type === 'fuel') return { ...at, r: 30 };
      if (samePlace && raw.category === 'highway') return { ...at, r: 26 };
      continue;
    }
    // A village is on the map as a place or as the boundary of the village (rank 16 and finer; a district is coarser).
    const rank = asNumber(raw.place_rank) ?? 0;
    const name = String(raw.name ?? '');
    const isVillage = raw.category === 'place' || (raw.category === 'boundary' && raw.type === 'administrative');
    if (isVillage && rank >= 16 && (fold(name) === fold(where.place) || stem(name) === stem(where.place))) return { ...at, r: rank };
  }
  return null;
}

/**
 * The one fuel station near a village or along a road that carries the operator's name, from
 * Nominatim's list of fuel stations in a small box. Null when there is none or more than one:
 * then the village or the road itself stays as the position.
 */
export function ltOwnStation(body: unknown, brand: string): { lat: number; lng: number; r: number } | null {
  const mine: { lat: number; lng: number }[] = [];
  for (const item of Array.isArray(body) ? body : []) {
    const raw = asRecord(item);
    const lat = asNumber(raw?.lat);
    const lng = asNumber(raw?.lon);
    if (!raw || lat === null || lng === null || raw.type !== 'fuel' || !inRegion('lt', lat, lng)) continue;
    if (fold(brand).length > 2 && fold(String(raw.name ?? '')).includes(fold(brand))) mine.push({ lat: roundCoord(lat), lng: roundCoord(lng) });
  }
  return mine.length === 1 && mine[0] ? { ...mine[0], r: 30 } : null;
}

/** The workbook through its public share link: the first answer sets a cookie and points to the file. */
export async function downloadLtWorkbook(): Promise<Uint8Array> {
  let url = LT_WORKBOOK_URL;
  const cookies = new Map<string, string>();
  for (let hop = 0; hop < 6; hop++) {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': USER_AGENT, ...(cookies.size ? { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') } : {}) },
      signal: AbortSignal.timeout(120_000),
    });
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(';', 1)[0] ?? '';
      const eq = pair.indexOf('=');
      if (eq > 0) cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
    }
    const next = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && next) {
      url = new URL(next, url).href;
      if (new URL(url).hostname !== new URL(LT_WORKBOOK_URL).hostname) throw new Error('the share link leads away from the agency’s SharePoint');
      continue;
    }
    if (!response.ok) throw new Error(`workbook: HTTP ${response.status}`);
    const data = new Uint8Array(await response.arrayBuffer());
    if (data[0] !== 0x50 || data[1] !== 0x4b) throw new Error('workbook: not an Excel file');
    return data;
  }
  throw new Error('workbook: too many redirects');
}

/** The newest rows of the workbook. Only the end of the sheet is turned into text: the whole sheet is about 100 MB. */
export async function readLtWorkbook(workbook: Uint8Array): Promise<LtRow[]> {
  let sheetName = '';
  let sheetSize = 0;
  await filesInZip(workbook, (name, size) => {
    if (/^xl\/worksheets\/[^/]+\.xml$/.test(name) && size > sheetSize) {
      sheetName = name;
      sheetSize = size;
    }
    return false;
  });
  if (!sheetName) throw new Error('workbook: no sheet');
  const files = await filesInZip(workbook, (name) => name === sheetName || name === 'xl/sharedStrings.xml');
  const sheet = files.get(sheetName);
  const shared = files.get('xl/sharedStrings.xml');
  if (!sheet || !shared) throw new Error('workbook: sheet or text table missing');
  const decoder = new TextDecoder();
  const strings = ltSharedStrings(decoder.decode(shared));
  if (!ltHeaderOk(ltSheetRows(decoder.decode(sheet.subarray(0, 20_000)), strings))) throw new Error('workbook: the columns have changed');
  return ltRows(ltSheetRows(decoder.decode(sheet.subarray(Math.max(0, sheet.length - LT_TAIL_BYTES))), strings));
}

function readPlaces(file: string): LtPlaces {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as LtPlaces) : {};
  } catch {
    return {};
  }
}

export function writeLtPlaces(file: string, places: LtPlaces): void {
  const sorted = Object.entries(places).sort(([a], [b]) => a.localeCompare(b));
  writeFileSync(file, `{\n${sorted.map(([id, v]) => `${JSON.stringify(id)}:${JSON.stringify(v)}`).join(',\n')}\n}\n`);
}

/** Looks up as many of `todo` as `limit` allows, saving each answer (found or not) in `places`. */
export async function lookUpLt(todo: LtDraft[], places: LtPlaces, now: Date, limit: number): Promise<{ stations: FeedStation[]; found: number; missed: number }> {
  const lookup = politeRequester(1100);
  const stations: FeedStation[] = [];
  let found = 0;
  let missed = 0;
  let asked = 0;
  for (const draft of todo) {
    if (asked >= limit) break;
    try {
      let at: { lat: number; lng: number; r: number } | null = null;
      for (const attempt of draft.lookups) {
        asked += 1;
        const response = await lookup(`${LT_GEOCODE_URL}?format=jsonv2&limit=5&addressdetails=1&countrycodes=lt&q=${encodeURIComponent(attempt)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        at = ltLookupResult(await response.json(), draft.where);
        if (at) break;
      }
      if (at && at.r < 30) {
        // Only the village or the road is known: look for the operator's own station within about three kilometres.
        asked += 1;
        const box = `${at.lng - 0.05},${at.lat + 0.03},${at.lng + 0.05},${at.lat - 0.03}`;
        const response = await lookup(`${LT_GEOCODE_URL}?format=jsonv2&limit=20&countrycodes=lt&bounded=1&viewbox=${box}&q=${encodeURIComponent('[fuel]')}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        at = ltOwnStation(await response.json(), draft.where.brand) ?? at;
      }
      if (at) {
        places[draft.station.id] = { a: draft.query, ...at };
        stations.push({ ...draft.station, lat: at.lat, lng: at.lng });
        found += 1;
      } else {
        places[draft.station.id] = { a: draft.query, miss: now.toISOString().slice(0, 10) };
        missed += 1;
      }
    } catch (error) {
      console.warn(`lt: lookup failed, stopping for this run: ${error instanceof Error ? error.message : String(error)}`);
      break;
    }
  }
  return { stations, found, missed };
}

/** GEO_DIR is the folder holding the saved positions (the "stats" branch in the feed job); without it no station can be placed. */
export async function fetchLt(now: Date): Promise<FeedStation[]> {
  const rows = await readLtWorkbook(await downloadLtWorkbook());
  const drafts = buildLtDrafts(rows, now);
  const newest = rows.reduce((max, r) => Math.max(max, r.day), 0);
  const dir = process.env.GEO_DIR;
  if (!dir) {
    console.log(`lt: ${drafts.length} stations with prices, newest day ${newest ? ltDay(newest) : 'none'}; no GEO_DIR, so none can be placed`);
    return [];
  }
  const file = join(dir, 'lt-places.json');
  const places = readPlaces(file);
  const placed = placeLtDrafts(drafts, places, now);
  const looked = await lookUpLt(placed.todo, places, now, LT_LOOKUPS_PER_RUN);
  if (looked.found + looked.missed > 0) writeLtPlaces(file, places);
  console.log(
    `lt: newest day ${newest ? ltDay(newest) : 'none'}, ${drafts.length} stations with prices, ${placed.stations.length + looked.found} placed, ${looked.found} found and ${looked.missed} not found this run, ${Math.max(0, placed.todo.length - looked.found - looked.missed)} still to look up`,
  );
  return [...placed.stations, ...looked.stations];
}
