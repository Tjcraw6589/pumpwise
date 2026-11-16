/**
 * Slovenia: goriva.si, the Republic of Slovenia's official fuel price portal, run under the Ministry
 * responsible for energy. Fuel sellers report their own prices to it.
 *
 * Its terms of data reuse (https://goriva.si/goriva/terms-of-use/, first published 6 November 2026)
 * allow free reuse for any lawful purpose, commercial included, as long as the source is named where
 * the end user can see it: "Source: goriva.si, official fuel price portal of the Republic of Slovenia".
 * The terms describe API access with credentials, given on request to the Ministry (gp.mzie@gov.si).
 * This source uses no key: it reads the same public search pages the portal's own web app reads, a
 * few times a day, 25 stations a page with a pause between pages. The terms do not mention those
 * pages, so whether reading them without credentials is welcome is unclear until the Ministry says.
 * If it issues a key, this source should move to the route it names.
 *
 * The pages carry no price times, so each price is stamped with the time it was fetched. In
 * November 2026 the price of 95 octane petrol and of diesel is capped by the government away from
 * motorways, which is why most stations show the same two figures. Stations give a street and a
 * postcode but no town: the town is the post office name for the postcode (si-postcodes.ts, from
 * GeoNames, CC BY 4.0).
 */
import { asNumber, asRecord, asString, cleanPrice, type FeedStation, type FuelKind, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';
import { SI_POSTCODES } from './si-postcodes.ts';

export const SI_URL = 'https://goriva.si/api/v1/search/?format=json';
/** About 550 stations report prices; far fewer means something went wrong. */
export const SI_MIN_STATIONS = 400;
/** 23 pages today. Past this many the listing is not what it was, so the fetch stops with an error. */
export const SI_MAX_PAGES = 60;
/** Euros per litre allowed. Some Shell stations report 0.001 for 95 where they have no price to give. */
const SI_MIN_EUROS = 0.5;
const SI_MAX_EUROS = 3;
/**
 * The whole country with a little room, not the narrower boxes the app uses to tell Slovenia from
 * Croatia: a station close to the border is still a Slovenian station.
 */
const SI_BOX = { minLat: 45.3, maxLat: 46.95, minLng: 13.3, maxLng: 16.7 };

/**
 * The goriva.si price keys Pumpwise lists, read by key because their order changes. Heating oil
 * ("KOEL") and natural gas ("cng", "lng", empty on every station seen, unit not known) are left
 * out. Super is 100 octane, which is what Slovenian stations sell as premium petrol; the rare 98
 * stands in where there is no 100.
 */
const FUEL_KEYS: readonly { kind: FuelKind; keys: readonly string[] }[] = [
  { kind: 'regular', keys: ['95'] },
  { kind: 'super', keys: ['100', '98'] },
  { kind: 'diesel', keys: ['dizel'] },
  { kind: 'premium-diesel', keys: ['dizel-premium'] },
  { kind: 'lpg', keys: ['avtoplin-lpg'] },
  { kind: 'hvo', keys: ['hvo'] },
];

/**
 * The portal's "franchise" list (https://goriva.si/api/v1/franchise/, read 15 November 2026), by its
 * number. These are the names of the companies that report, not always what the sign says, so the
 * list is kept here rather than fetched: SI_BRANDS gives the sign for the big chains, and the rest
 * show the company name without its legal form.
 */
const SI_FRANCHISES: Record<number, string> = {
  1: 'Petrol d.d., Ljubljana',
  2: 'MOL & INA d.o.o.',
  3: 'M – ENERGIJA, d.o.o.',
  4: 'MOL SLOVENIJA d.o.o.',
  5: 'Shell Adria d.o.o.',
  6: 'EKO-NAFTA d.o.o.',
  7: 'LOGO ENERGIJA',
  9: 'TehnoSTOR',
  10: 'Butan plin d.d.',
  11: 'ECO OIL',
  12: 'INA Slovenija',
  13: 'FE - Trading',
  14: 'West oil',
  15: 'DISCONT Oil',
  16: 'Agas',
  17: 'HOJNIK Oil',
  18: 'Merkantil',
  19: 'LOGO BENCINSKI SERVISI d.o.o.',
  21: 'Mini Marketing d.o.o. Stranice',
  22: 'BS Demol',
  23: 'Prektur d.o.o.',
  24: 'Postonjske mesnine oil',
  25: 'URMA d.o.o.',
  26: 'EKSTRA OLJE',
  27: 'AVTOTRANSPORT KOVAČIČ d.o.o.',
  28: 'BENCINSKI SERVIS BUČAR',
  29: 'Mi oskrba d.o.o.',
  30: 'kaolje',
  31: 'Istrabenz Plini',
  32: 'Energetski-center Dolenjske',
  33: 'Volantes d.o.o.',
};

/**
 * The sign on the forecourt, where it differs from the company name. Both MOL companies trade as
 * MOL, and every M – ENERGIJA station is named "BS MAXEN ...".
 */
const SI_BRANDS: Record<number, string> = { 1: 'Petrol', 2: 'MOL', 3: 'Maxen', 4: 'MOL', 5: 'Shell', 12: 'INA' };

/**
 * Words that stay in capitals: "BS" is short for bencinski servis (filling station), "IC" for
 * industrijska cona, "AC" for avtocesta and "BTC" is a shopping district of Ljubljana.
 */
const KEEP_UPPER = new Set(['BS', 'MOL', 'INA', 'OMV', 'IC', 'AC', 'LPG', 'BTC']);
/** Words Slovenian writes small inside a name: "Šempeter pri Gorici", "Most na Soči", "Tivolska cesta". */
const SMALL_WORDS = new Set(['pri', 'ob', 'na', 'v', 'pod', 'nad', 'in', 'cesta', 'ulica', 'trg', 'pot']);

/** One word in capitals to a word with a capital first letter, each part of "LJUBLJANA-BTC" on its own. */
function tidyWord(word: string): string {
  return word
    .split('-')
    .map((part) => {
      // Roman numerals: "IX." (an ordinal) or two or more of I, V and X.
      if (KEEP_UPPER.has(part) || /^(?:[IVX]+\.|[IVX]{2,})$/.test(part)) return part;
      // "C.SVOBODE" to "C.Svobode": a full stop inside a word starts a new one.
      return tidyName(part).replace(/\.(\p{Ll})/gu, (_m, ch: string) => `.${ch.toUpperCase()}`);
    })
    .join('-');
}

/**
 * "PETROL LJUBLJANA - TIVOLSKA" becomes "Petrol Ljubljana - Tivolska" and "CESTA IX. KORPUSA 67"
 * becomes "Cesta IX. Korpusa 67". Text that already has small letters keeps its case, but for long
 * words left in capitals: "SHELL MURSKA SOBOTA Lendavska" becomes "Shell Murska Sobota Lendavska".
 * Short ones stay, since they are mostly initials ("BS", "MOL", "B.H.").
 */
export function siTidy(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return text;
  const words = text.split(' ');
  if (/\p{Ll}/u.test(text)) {
    const long = (word: string): boolean => !/\p{Ll}/u.test(word) && (word.match(/\p{Lu}/gu)?.length ?? 0) >= 5;
    return tidyName(words.map((word) => (long(word) ? tidyWord(word) : word)).join(' '));
  }
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && words[i - 1] !== '-' && SMALL_WORDS.has(lower)) return lower;
      return tidyWord(word);
    })
    .join(' ');
}

/** The brand for a franchise number: the sign for the big chains, else the company name without "d.o.o." or "d.d.". */
export function siBrand(franchise: unknown): string {
  const pk = asNumber(franchise);
  if (pk === null) return '';
  const brand = SI_BRANDS[pk];
  if (brand) return brand;
  // The legal form and anything after it (the company's seat) go: "Mini Marketing d.o.o. Stranice".
  const company = (SI_FRANCHISES[pk] ?? '').replace(/[,\s]*\bd\.\s?(?:o\.\s?o|d)\..*$/i, '');
  return siTidy(company);
}

/** Euros per litre to cents with one decimal (1.506 is 150.6), or null when it is not a believable price. */
export function siPrice(value: unknown): number | null {
  const euros = asNumber(value);
  if (euros === null || euros < SI_MIN_EUROS || euros > SI_MAX_EUROS) return null;
  return cleanPrice(euros * 100, SI_MIN_EUROS * 100, SI_MAX_EUROS * 100);
}

/** Monday first, as the portal writes the days. "Praznik" (public holiday) has no place in a weekly list. */
const SI_DAYS = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

/**
 * One day's times, "06:00-22:00" or "07:00-10:30, 11:00-13:00", in the feed's form. A split day
 * becomes its first opening to its last closing, as in the other sources. A closing time of 00:00
 * is midnight at the end of the day, so "00:00-06:00, 06:00-21:00, 21:00-00:00" is all day.
 */
function siDayHours(text: string): string | null {
  let open = 1440;
  let close = 0;
  for (const part of text.split(',')) {
    const match = /^\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$/.exec(part);
    if (!match) return null;
    const [h1, m1, h2, m2] = match.slice(1).map(Number) as [number, number, number, number];
    const from = h1 * 60 + m1;
    const to = h2 * 60 + m2;
    if (m1 > 59 || m2 > 59 || from >= 1440 || to > 1440) return null;
    const end = to === 0 ? 1440 : to;
    if (end <= from) return null;
    open = Math.min(open, from);
    close = Math.max(close, end);
  }
  if (open === 0 && close >= 1439) return '24h';
  const clock = (total: number): string => `${String(Math.floor(total / 60)).padStart(2, '0')}${String(total % 60).padStart(2, '0')}`;
  return `${clock(open)}-${close >= 1440 ? '2359' : clock(close)}`;
}

/**
 * Opening hours, Monday to Sunday. Three kinds of text are read:
 * - plainly open all day, every day: "00:00-23:59", "0-24", "24/7", "24 ur - črpalka brez osebja";
 * - one line of times with no days, which is the same hours every day: "06:00-22:00";
 * - the portal's own layout, a line of day names and then a line of times, with an optional
 *   "01.09.2025 –" line (in force since) before the days:
 *   "Ponedeljek, Torek, Sreda, Četrtek, Petek\n06:00-22:00\n\nSobota\n07:00-21:00".
 * A day the text does not list stays "unknown" rather than closed. Anything else is hours a person
 * typed in their own way ("Pon - Pet.: 6-22", "Mon-Sat: 6-22h"), and gives null rather than a guess.
 */
export function siHours(text: string, now: Date = new Date()): string[] | null {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  const allDay = /^0 ?- ?24$/.test(oneLine) || /^24 ur(?![\p{L}\d])/iu.test(oneLine) || /^(?:neprenehoma )?24\/7$/i.test(oneLine);
  if (allDay) return Array<string>(7).fill('24h');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (lines.length === 1) {
    const everyDay = siDayHours(lines[0] ?? '');
    return everyDay ? Array<string>(7).fill(everyDay) : null;
  }
  const hours = Array<string>(7).fill('unknown');
  let days: number[] | null = null;
  let known = 0;
  for (const line of lines) {
    const since = /^(\d{2})\.(\d{2})\.(\d{4}) ?[–-]$/.exec(line);
    if (since) {
      // Hours that are not in force yet, or a date where the times should be: not read.
      if (days || Date.UTC(Number(since[3]), Number(since[2]) - 1, Number(since[1])) > now.getTime()) return null;
      continue;
    }
    if (!days) {
      days = [];
      for (const name of line.split(',')) {
        const day = name.trim().toLowerCase();
        if (day === 'praznik') continue;
        const index = SI_DAYS.indexOf(day);
        // Not a list of days, or a day listed twice (two sets of hours, say summer and winter).
        if (index < 0 || hours[index] !== 'unknown' || days.includes(index)) return null;
        days.push(index);
      }
      continue;
    }
    const times = siDayHours(line);
    if (!times) return null;
    for (const day of days) hours[day] = times;
    known += days.length;
    days = null;
  }
  return !days && known > 0 ? hours : null;
}

/**
 * "Senožeti 93, 1262 Senožeti" to the street and the postcode: a few stations write the postcode and
 * the place into the street. Only a postcode the table knows counts.
 */
function siAddress(value: string): { street: string; postcode: string } {
  const match = /^(.*\S)\s*,\s*(\d{4})\s+\p{L}[\p{L}\s.\-/]*$/u.exec(value);
  const postcode = match?.[2] ?? '';
  return match && SI_POSTCODES[postcode] !== undefined ? { street: match[1] ?? '', postcode } : { street: value, postcode: '' };
}

/**
 * The address a page's "next" points to, or null on the last page. Only https pages on goriva.si
 * are followed; anything else is an error.
 */
export function siNextUrl(next: unknown): string | null {
  if (next === null || next === undefined || next === '') return null;
  let url: URL | null = null;
  try {
    url = new URL(asString(next));
  } catch {
    url = null;
  }
  if (!url || url.protocol !== 'https:' || url.hostname !== 'goriva.si') throw new Error(`unexpected next page: ${String(next)}`);
  return url.href;
}

/** Turns goriva.si search results into feed stations. Anything odd is skipped, never guessed. */
export function buildSiStations(rows: unknown[], now: Date): FeedStation[] {
  const at = now.toISOString();
  const byId = new Map<string, FeedStation>();
  for (const item of rows) {
    const row = asRecord(item);
    if (!row) continue;
    const pk = asNumber(row.pk);
    const lat = asNumber(row.lat);
    const lng = asNumber(row.lng);
    if (pk === null || !Number.isInteger(pk) || lat === null || lng === null) continue;
    if (lat < SI_BOX.minLat || lat > SI_BOX.maxLat || lng < SI_BOX.minLng || lng > SI_BOX.maxLng) continue;
    // The listing is sorted by price, so a station can show up on two pages if prices change mid-fetch.
    if (byId.has(`si-${pk}`)) continue;
    const reported = asRecord(row.prices) ?? {};
    const prices: FeedStation['prices'] = {};
    for (const { kind, keys } of FUEL_KEYS) {
      for (const key of keys) {
        const p = siPrice(reported[key]);
        if (p === null) continue;
        prices[kind] = { p, at };
        break;
      }
    }
    if (Object.keys(prices).length === 0) continue;
    const brand = siBrand(row.franchise);
    const openHours = asString(row.open_hours);
    const zip = asString(row.zip_code);
    const address = siAddress(asString(row.address));
    const postcode = /^\d{4}$/.test(zip) ? zip : address.postcode;
    byId.set(`si-${pk}`, {
      id: `si-${pk}`,
      region: 'si',
      name: siTidy(asString(row.name)) || brand || 'Bencinski servis',
      brand,
      address: siTidy(address.street),
      town: SI_POSTCODES[postcode] ?? '',
      postcode,
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: siHours(openHours, now),
      tags: /brez\s+osebja/i.test(openHours) ? ['unmanned'] : [],
      prices,
    });
  }
  return fillSiTowns([...byId.values()]);
}

/** The whole country: 25 stations a page, following "next" to the last page (23 pages, about 35 seconds). */
/**
 * A few stations come with no postcode, or one the post office list does not know, and so have no town.
 * They take the town of the nearest station that has one, when it is within 6 km.
 */
export function fillSiTowns(stations: FeedStation[]): FeedStation[] {
  const named = stations.filter((s) => s.town);
  for (const s of stations) {
    if (s.town) continue;
    let best: FeedStation | null = null;
    let bestKm = 6;
    for (const o of named) {
      const x = (o.lng - s.lng) * Math.cos((s.lat * Math.PI) / 180) * 111.32;
      const y = (o.lat - s.lat) * 110.57;
      const km = Math.sqrt(x * x + y * y);
      if (km < bestKm) {
        bestKm = km;
        best = o;
      }
    }
    if (best) s.town = best.town;
  }
  return stations;
}

export async function fetchSi(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1500);
  const rows: unknown[] = [];
  let listed: number | null = null;
  let pages = 0;
  let url: string | null = SI_URL;
  while (url) {
    if (pages >= SI_MAX_PAGES) throw new Error(`more than ${SI_MAX_PAGES} pages`);
    const response = await request(url);
    if (!response.ok) throw new Error(`page ${pages + 1}: HTTP ${response.status}`);
    const body = asRecord(await response.json());
    if (!body || !Array.isArray(body.results)) throw new Error(`page ${pages + 1}: unexpected response shape`);
    rows.push(...(body.results as unknown[]));
    listed = asNumber(body.count) ?? listed;
    pages += 1;
    url = siNextUrl(body.next);
  }
  // The listing says how many stations it holds: far fewer rows means pages went missing on the way.
  if (listed !== null && rows.length < listed * 0.9) throw new Error(`only ${rows.length} rows of ${listed} listed`);
  const stations = buildSiStations(rows, now);
  console.log(`si: ${pages} pages, ${rows.length} rows of ${listed ?? '?'} listed, ${stations.length} stations`);
  return stations;
}
