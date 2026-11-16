/**
 * Croatia: the Ministry of Economy's fuel price portal minGO (https://www.min-go.hr/, the same data
 * as https://mzoe-gor.hr). Fuel retailers must send the Ministry every change of a retail price before
 * it applies, and the Ministry publishes them. One request for https://mzoe-gor.hr/data.gz returns
 * every station, fuel and price (a gzip file of about 330 KB, 2 MB of JSON; the two copies seen were
 * built 20 minutes apart).
 *
 * Terms: the Ministry's open data page (https://mingo.gov.hr/otvoreni-podaci/8611) lists minGO and
 * allows copying, publishing and commercial use as long as the source is named and nothing suggests
 * official status or the Ministry's approval (see LEGAL.md). The page names the portal, not this file:
 * data.gz is the portal's own data file, it has no published description, and the Ministry does not
 * promise that it stays where it is. Company logos are not reused.
 *
 * The file has no dates, so prices are shown as the ones in force ("current"), like Mexico. Lapsed
 * entries stay in the file (prices in kuna from before 2023, and rows nobody has confirmed for a long
 * time), so every run keeps only rows with a believable euro price and a recent row number.
 *
 * Price caps: the Government sets the highest retail price of the basic petrol and diesel each week
 * (for seven days, usually from Tuesday), so most stations show the same price for those. Premium
 * grades and motorway stations are free of the cap.
 */
import { gunzipSync } from 'node:zlib';

import { asNumber, asRecord, asString, cleanPrice, type FeedStation, type FuelKind, inRegion, type Raw, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const HR_URL = 'https://mzoe-gor.hr/data.gz';
/** About 860 stations carry a current price; far fewer means something went wrong. */
export const HR_MIN_STATIONS = 600;
/** Euros per litre allowed. Anything higher is a kuna price that was never updated. */
const HR_MIN_EUROS = 0.5;
const HR_MAX_EUROS = 3;
/**
 * Price rows are numbered as they are sent in (about 6 million by late 2026). A row this far behind
 * the newest one in the file is an entry that has lapsed, even when its price looks believable.
 * Between the copies of 22 October and 15 November 2026 the numbers grew by about 16,000 a day, so
 * this is roughly 10 days. The price caps change every week and the chains send every price again at
 * least once a week, so a row older than that is a price from before the last change of the cap
 * (three stations with rows 24 days old were showing the cheapest prices in the country).
 */
export const HR_STALE_ROW_GAP = 160_000;
/** Opening hours shorter than this are a typing slip, not a real day. */
const HR_SHORTEST_DAY_MINUTES = 180;
/** Croatia's span. The file swaps the two fields, so each number is recognised by its range. */
const LAT_RANGE = [42.3, 46.6] as const;
const LNG_RANGE = [13.4, 19.5] as const;

type Family = 'petrol95' | 'petrol100' | 'diesel' | 'lpg';
/**
 * The Ministry's fuel types (vrsta_gorivas) that are road fuels. "With additives" (1, 5, 7) does not
 * mean premium: most brands' basic grade is additivated, so 95 and diesel are split by price instead.
 * Heating oil (10), dyed diesel for farms and boats (11), biodiesel (13) and gas bottles (20 to 22) are left out.
 */
const FUEL_FAMILIES: Record<number, Family> = {
  1: 'petrol95', // Eurosuper 95 with additives
  2: 'petrol95', // Eurosuper 95 without additives
  5: 'petrol100', // Eurosuper 100 with additives
  6: 'petrol100', // Eurosuper 100 without additives
  7: 'diesel', // Eurodizel with additives
  8: 'diesel', // Eurodizel without additives
  9: 'lpg', // UNP (autoplin)
};

const NOT_IN_WORD = '(?![\\p{L}\\d])';
const WORD_START = '(?<![\\p{L}\\d])';
/**
 * Company forms in an operator's name: d.o.o., j.d.o.o., d.d., "obrt za ..." (a sole trader and its line
 * of business) and "vl." (the owner). "Obrt" on its own can be part of the trading name, so it stays.
 */
const COMPANY_FORM = /[\s,]+(?:(?:(?:j\.\s*)?d\.\s*o\.\s*o\.?|j?doo|d\.\s*d\.?)(?=[\s,]|$)|obrt\s+za(?=\s)|vl\.)/iu;
/** The signs drivers know, for operators whose company name differs from it. */
const BRANDS: readonly (readonly [RegExp, string])[] = [
  [new RegExp(`^ina${NOT_IN_WORD}`, 'iu'), 'INA'],
  [/^petrol$/i, 'Petrol'],
  [/^tifon$/i, 'Tifon'],
  [/^lukoil/i, 'Lukoil'],
  [/^adria oil$/i, 'Adria Oil'],
  [/^coral croatia/i, 'Shell'], // Coral Croatia runs the Shell stations
  [/^ktc$/i, 'KTC'],
  [new RegExp(`^ags${NOT_IN_WORD}`, 'iu'), 'AGS'],
  [/^crodux/i, 'Crodux'],
];

function records(value: unknown): Raw[] {
  if (!Array.isArray(value)) return [];
  const list: Raw[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (record) list.push(record);
  }
  return list;
}

/** A shouted word of four letters or more inside mixed case text: "Benzinska pumpa BREBRIĆ", "A3 HIGHWAY". */
const SHOUTED_WORD = new RegExp(`${WORD_START}\\p{Lu}{4,}${NOT_IN_WORD}`, 'gu');
/** A whole word of two to six letters, the length of the short forms and Roman numerals below. */
const SHORT_WORD = new RegExp(`${WORD_START}\\p{L}{2,6}${NOT_IN_WORD}`, 'gu');
/** Short forms that stay in capitals on signs and in addresses (PM is Petrol's "prodajno mjesto", AC a motorway). */
const UPPER_WORDS = new Set(['pm', 'ac', 'ina', 'ktc', 'ags', 'lpg', 'unp', 'zng', 'hv', 'hvo', 'pz']);
/** Roman numerals from II to XXXIX, as in "Ivana Pavla II" and "XIII. brigade". */
const ROMAN = /^(?=..)X{0,3}(?:IX|IV|V?I{0,3})$/i;

/**
 * "BP KLINČA SELA" to "BP Klinča Sela". Text with lower case letters is kept as written apart from
 * its shouted words, unless the only lower case is a company form, "bb" (no house number) or a house
 * number's letter ("OKTAN ŽAŽINE d.o.o."). Croatian letters survive, initials keep their capitals
 * ("B.P. JOZINOVIĆ", "V.NAZORA 10") and the short forms on signs stay in capitals.
 */
export function hrTidy(value: string): string {
  // One name carries the escaping of its quotes as text: T.O. \"PLINARA BADERNA\".
  const text = value
    .replace(/\\+(?=["'])/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ,/g, ',')
    .trim();
  const rest = text.replace(/(?:j\.)?d\.o\.o\.?|d\.d\.|\d+[a-z]\b|\bbb\b/g, '');
  if (/\p{Ll}/u.test(rest)) {
    return tidyName(text.replace(SHOUTED_WORD, (word) => (ROMAN.test(word) ? word : word.charAt(0) + word.slice(1).toLowerCase())));
  }
  return (
    tidyName(text.toUpperCase())
      // tidyName leaves a word with a digit as written: "OSIJEK1", "1.RESNIČKI".
      .replace(/(\p{Lu})(\p{Lu}{2,})/gu, (_run, first: string, others: string) => first + others.toLowerCase())
      // A letter after a full stop or an opening quote starts a name: "V.nazora", "B.p.", "Dr.franje".
      .replace(/([."])(\p{Ll})/gu, (_pair, mark: string, letter: string) => mark + letter.toUpperCase())
      .replace(SHORT_WORD, (word) => (UPPER_WORDS.has(word.toLowerCase()) || ROMAN.test(word) ? word.toUpperCase() : word))
      .replace(new RegExp(`${WORD_START}(J\\.)?D\\.O\\.O\\.?`, 'gu'), (_form, j?: string) => `${j ? 'j.' : ''}d.o.o.`)
      .replace(new RegExp(`${WORD_START}Doo${NOT_IN_WORD}`, 'gu'), 'd.o.o.')
      .replace(new RegExp(`${WORD_START}D\\.D\\.`, 'gu'), 'd.d.')
      .replace(/ B(\.?)B(\.?)$/i, (_bb, dot1: string, dot2: string) => ` b${dot1}b${dot2}`)
  );
}

/**
 * The station's name. A sole trader's full legal name ("AUTO PLIN, obrt za trgovinu, vl. ...", with
 * the owners' names) is cut back to its trading name.
 */
export function hrName(value: string): string {
  return hrTidy(value.replace(/[\s,]+(?:obrt\s+za\s|vl\.).*$/iu, ''));
}

/** "INA – Industrija nafte d.d." to "INA", "Coral Croatia d.o.o." to "Shell", "RIJEKA TRANS D.O.O." to "Rijeka Trans". */
export function hrBrand(operator: string): string {
  const text = operator.replace(/\s+/g, ' ').trim();
  const form = COMPANY_FORM.exec(text);
  const bare = (form ? text.slice(0, form.index) : text).replace(/[\s,]+$/, '');
  for (const [pattern, brand] of BRANDS) if (pattern.test(bare)) return brand;
  // The operator list has a few junk rows ("-").
  if (!/\p{L}/u.test(bare)) return '';
  return hrTidy(bare);
}

/**
 * The file has no postcode field, but some stations type one into the town ("51281 LOPAR") or at the
 * end of the street ("..., 21000 Split"). It is moved out, and the town is left clean.
 */
export function hrPlace(adresa: unknown, mjesto: unknown): { address: string; town: string; postcode: string } {
  let town = asString(mjesto).replace(/\s+/g, ' ');
  let address = asString(adresa).replace(/\s+/g, ' ');
  let postcode = '';
  const inTown = /(?<!\d)\d{5}(?!\d)/.exec(town);
  if (inTown) {
    postcode = inTown[0];
    town = town.replace(inTown[0], ' ');
  }
  const afterStreet = /[\s,]+(\d{5})\s+\p{L}[\p{L} .-]*$/u.exec(address);
  if (afterStreet) {
    postcode ||= afterStreet[1] ?? '';
    address = address.slice(0, afterStreet.index);
  }
  town = town
    .replace(/,\s*(?:Croatia|Hrvatska)\s*$/i, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[\s,]+|[\s,]+$/g, '');
  return { address: hrTidy(address), town: hrTidy(town), postcode };
}

/** "06:00:00" to minutes past midnight ("24:00:00" is 1440), or null. */
function minutes(value: unknown): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(asString(value));
  if (!match) return null;
  const total = Number(match[1]) * 60 + Number(match[2]);
  return Number(match[2]) < 60 && total <= 1440 ? total : null;
}

function clock(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}${String(total % 60).padStart(2, '0')}`;
}

/**
 * Monday to Sunday hours from the station's rows: day type 1 is a workday (Monday to Friday), 2 is
 * Saturday and 3 is Sunday. Type 4 (public holidays) has no place in a weekly list. A day type the
 * station did not fill in stays "unknown" rather than closed. A split day (two rows for one day
 * type) becomes its first opening to its last closing.
 *
 * Two kinds of entry in the November 2026 file are slips, and stay "unknown" too: a day of under three
 * hours (one station is "22:00 to 24:00" all week), and a Saturday or Sunday given as round the clock
 * at a station that shuts at night in the week (two stations).
 */
export function hrHours(value: unknown): string[] | null {
  const spans = new Map<number, { open: number; close: number }>();
  for (const row of records(value)) {
    const type = asNumber(row.vrsta_dana_id);
    const open = minutes(row.pocetak);
    const close = minutes(row.kraj);
    if (type === null || type < 1 || type > 3 || open === null || close === null) continue;
    // Midnight to midnight is all day; any other span that ends before it starts is a mistake.
    const end = open === 0 && close === 0 ? 1440 : close;
    if (end <= open) continue;
    const seen = spans.get(type);
    spans.set(type, seen ? { open: Math.min(seen.open, open), close: Math.max(seen.close, end) } : { open, close: end });
  }
  if (spans.size === 0) return null;
  const day = (type: number): string => {
    const span = spans.get(type);
    if (!span || span.close - span.open < HR_SHORTEST_DAY_MINUTES) return 'unknown';
    if (span.open === 0 && span.close >= 1439) return '24h';
    return `${clock(span.open)}-${span.close >= 1440 ? '2359' : clock(span.close)}`;
  };
  const workday = day(1);
  const weekend = (type: number): string => {
    const hours = day(type);
    return hours === '24h' && workday !== '24h' && workday !== 'unknown' ? 'unknown' : hours;
  };
  const week = [workday, workday, workday, workday, workday, weekend(2), weekend(3)];
  return week.some((hours) => hours !== 'unknown') ? week : null;
}

/** The station's position. "long" holds the latitude in nearly every row, so the ranges decide which is which. */
function position(station: Raw): { lat: number; lng: number } | null {
  const a = asNumber(station.long);
  const b = asNumber(station.lat);
  if (a === null || b === null) return null;
  const isLat = (n: number) => n >= LAT_RANGE[0] && n <= LAT_RANGE[1];
  const isLng = (n: number) => n >= LNG_RANGE[0] && n <= LNG_RANGE[1];
  const found = isLat(a) && isLng(b) ? { lat: a, lng: b } : isLat(b) && isLng(a) ? { lat: b, lng: a } : null;
  return found && inRegion('hr', found.lat, found.lng) ? found : null;
}

/** Turns the Ministry's file into feed stations. Anything odd is skipped, never guessed. */
export function buildHrStations(data: unknown, now: Date): FeedStation[] {
  const root = asRecord(data);
  if (!root) return [];
  const at = now.toISOString();
  const stationRows = records(root.postajas);

  // Each company's own product (gorivos) points at one of the Ministry's fuel types.
  const families = new Map<number, Family>();
  for (const fuel of records(root.gorivos)) {
    const id = asNumber(fuel.id);
    const family = FUEL_FAMILIES[asNumber(fuel.vrsta_goriva_id) ?? -1];
    if (id !== null && family) families.set(id, family);
  }
  const operators = new Map<number, string>();
  for (const operator of records(root.obvezniks)) {
    const id = asNumber(operator.id);
    if (id !== null) operators.set(id, asString(operator.naziv));
  }
  let newestRow = 0;
  for (const station of stationRows) {
    for (const row of records(station.cjenici)) newestRow = Math.max(newestRow, asNumber(row.id) ?? 0);
  }
  const oldestAllowed = newestRow - HR_STALE_ROW_GAP;

  const stations: FeedStation[] = [];
  const used = new Set<number>();
  for (const station of stationRows) {
    const id = asNumber(station.id);
    if (id === null || !Number.isSafeInteger(id) || id <= 0 || used.has(id)) continue;
    const place = position(station);
    if (!place) continue;

    const offers: Record<Family, number[]> = { petrol95: [], petrol100: [], diesel: [], lpg: [] };
    for (const row of records(station.cjenici)) {
      const rowId = asNumber(row.id);
      const family = families.get(asNumber(row.gorivo_id) ?? -1);
      const euros = asNumber(row.cijena);
      if (rowId === null || rowId < oldestAllowed || !family) continue;
      if (euros === null || euros < HR_MIN_EUROS || euros > HR_MAX_EUROS) continue;
      const cents = cleanPrice(euros * 100, HR_MIN_EUROS * 100, HR_MAX_EUROS * 100);
      if (cents !== null) offers[family].push(cents);
    }
    const prices: FeedStation['prices'] = {};
    const put = (kind: FuelKind, p: number) => {
      prices[kind] = { p, at };
    };
    // The cheapest of a family is the basic grade; a dearer one beside it is the brand's premium grade.
    const split = (list: number[], basic: FuelKind, premium: FuelKind | null) => {
      if (list.length === 0) return;
      const low = Math.min(...list);
      const high = Math.max(...list);
      put(basic, low);
      if (premium && high > low) put(premium, high);
    };
    split(offers.petrol95, 'regular', 'premium');
    split(offers.petrol100, 'super', null);
    split(offers.diesel, 'diesel', 'premium-diesel');
    split(offers.lpg, 'lpg', null);
    if (Object.keys(prices).length === 0) continue;

    used.add(id);
    const brand = hrBrand(operators.get(asNumber(station.obveznik_id) ?? -1) ?? '');
    const { address, town, postcode } = hrPlace(station.adresa, station.mjesto);
    stations.push({
      id: `hr-${id}`,
      region: 'hr',
      name: hrName(asString(station.naziv)) || brand || 'Benzinska postaja',
      brand,
      address,
      town,
      postcode,
      lat: roundCoord(place.lat),
      lng: roundCoord(place.lng),
      hours: hrHours(station.radnaVremena),
      tags: [],
      prices,
    });
  }
  return stations;
}

/** The downloaded file as JSON. It is a gzip file; if a server ever sends it already unpacked, it is read as text. */
export function hrJson(body: Uint8Array): unknown {
  const zipped = body.length > 2 && body[0] === 0x1f && body[1] === 0x8b;
  const text = zipped ? gunzipSync(body).toString('utf8') : new TextDecoder().decode(body);
  // Node's unzipped text keeps a byte order mark, which JSON.parse refuses.
  return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
}

/** One request: the whole country (about 330 KB zipped). */
export async function fetchHr(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000, 'application/gzip, application/octet-stream');
  const response = await request(HR_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = asRecord(hrJson(new Uint8Array(await response.arrayBuffer())));
  if (!data || !Array.isArray(data.postajas) || !Array.isArray(data.gorivos)) throw new Error('unexpected response shape');
  const stations = buildHrStations(data, now);
  console.log(`hr: ${data.postajas.length} stations in the file, ${stations.length} with current prices`);
  return stations;
}
