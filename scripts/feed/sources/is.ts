/**
 * Iceland: Gasvaktin (https://github.com/gasvaktin/gasvaktin, MIT licence), an open project that reads
 * the six Icelandic fuel companies' own websites every 15 minutes (Atlantsolía, Costco, N1, Olís, ÓB
 * and Orkan) and publishes one file with every station's price of 95 octane petrol and of diesel.
 *
 * This is not government data: Iceland has no official register of pump prices. The prices are the
 * companies' own published ones, so the credit names Gasvaktin and the companies and says so (owner's
 * decision, 16 November 2026: company prices are acceptable where they are the companies' own figures,
 * not drivers' reports). The companies publish no licence for their prices; see LEGAL.md.
 *
 * The file has no price times and no towns. Prices are shown as the ones in force ("current"), and each
 * station takes the name of the nearest town in the short list below, when one is within 30 km.
 * Discount prices (loyalty cards) are left out: Pumpwise shows the price on the sign.
 */
import { asNumber, asRecord, asString, type FeedStation, inRegion, roundCoord } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const IS_URL = 'https://raw.githubusercontent.com/gasvaktin/gasvaktin/master/vaktin/gas.min.json';
/** About 245 stations are listed; far fewer means something went wrong. */
export const IS_MIN_STATIONS = 120;
/** Krónur a litre outside this range is a mistake. */
export const IS_MIN_KR = 150;
export const IS_MAX_KR = 600;

/** Towns stations are filed under on the website: name, latitude, longitude. */
export const IS_TOWNS: readonly (readonly [string, number, number])[] = [
  ['Reykjavík', 64.1466, -21.9426], ['Kópavogur', 64.1101, -21.907], ['Hafnarfjörður', 64.0671, -21.9377], ['Garðabær', 64.0886, -21.923],
  ['Mosfellsbær', 64.1667, -21.699], ['Seltjarnarnes', 64.1535, -21.995], ['Reykjanesbær', 63.9998, -22.5583], ['Grindavík', 63.8424, -22.4338],
  ['Akranes', 64.3218, -22.0749], ['Borgarnes', 64.5383, -21.9206], ['Stykkishólmur', 65.0757, -22.7297], ['Ólafsvík', 64.8943, -23.709],
  ['Búðardalur', 65.109, -21.765], ['Ísafjörður', 66.075, -23.135], ['Patreksfjörður', 65.5963, -23.9943], ['Hólmavík', 65.7063, -21.6659],
  ['Hvammstangi', 65.397, -20.945], ['Blönduós', 65.66, -20.28], ['Sauðárkrókur', 65.7461, -19.6394], ['Siglufjörður', 66.1522, -18.9079],
  ['Dalvík', 65.9702, -18.5286], ['Akureyri', 65.6885, -18.1262], ['Húsavík', 66.0449, -17.3389], ['Reykjahlíð', 65.6423, -16.9116],
  ['Þórshöfn', 66.2, -15.333], ['Vopnafjörður', 65.754, -14.829], ['Egilsstaðir', 65.2669, -14.3948], ['Seyðisfjörður', 65.26, -14.01],
  ['Neskaupstaður', 65.148, -13.684], ['Reyðarfjörður', 65.032, -14.218], ['Djúpivogur', 64.657, -14.285], ['Höfn', 64.2539, -15.2082],
  ['Kirkjubæjarklaustur', 63.7833, -18.05], ['Vík', 63.4186, -19.006], ['Hvolsvöllur', 63.75, -20.224], ['Hella', 63.835, -20.4],
  ['Selfoss', 63.9331, -20.9971], ['Hveragerði', 64.0, -21.186], ['Þorlákshöfn', 63.856, -21.383], ['Vestmannaeyjar', 63.4427, -20.2734],
  ['Laugarvatn', 64.215, -20.73], ['Flúðir', 64.135, -20.32],
];

function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = Math.PI / 180;
  const x = (bLng - aLng) * r * Math.cos(((aLat + bLat) / 2) * r);
  const y = (bLat - aLat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

/** The nearest listed town within 30 km, or '' out in the country. */
export function isTown(lat: number, lng: number): string {
  let best = '';
  let bestKm = 30;
  for (const [name, tLat, tLng] of IS_TOWNS) {
    const d = km(lat, lng, tLat, tLng);
    if (d < bestKm) {
      best = name;
      bestKm = d;
    }
  }
  return best;
}

/** 252.2 krónur as 25220 (hundredths of the currency, as everywhere in the feed), or null when out of range. */
export function isPrice(value: unknown): number | null {
  const kr = asNumber(value);
  if (kr === null || kr < IS_MIN_KR || kr > IS_MAX_KR) return null;
  return Math.round(kr * 1000) / 10;
}

/** Gasvaktin's stations as feed stations. The file has no price times, so each price is stamped with the fetch time. */
export function buildIsStations(items: unknown[], now: Date): FeedStation[] {
  const at = now.toISOString();
  const stations: FeedStation[] = [];
  for (const item of items) {
    const raw = asRecord(item);
    const geo = asRecord(raw?.geo);
    if (!raw || !geo) continue;
    const key = asString(raw.key);
    const lat = asNumber(geo.lat);
    const lng = asNumber(geo.lon ?? geo.lng);
    if (!key || lat === null || lng === null || !inRegion('is', lat, lng)) continue;
    const prices: FeedStation['prices'] = {};
    const petrol = isPrice(raw.bensin95);
    const diesel = isPrice(raw.diesel);
    if (petrol !== null) prices.regular = { p: petrol, at };
    if (diesel !== null) prices.diesel = { p: diesel, at };
    if (Object.keys(prices).length === 0) continue;
    const company = asString(raw.company);
    const where = asString(raw.name);
    stations.push({
      id: `is-${key}`,
      region: 'is',
      name: [company, where].filter(Boolean).join(' '),
      brand: company,
      address: where,
      town: isTown(lat, lng),
      postcode: '',
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags: [],
      prices,
    });
  }
  return stations;
}

/** One small file (about 45 KB) for the whole country. */
export async function fetchIs(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000);
  const response = await request(IS_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = asRecord(await response.json());
  if (!body || !Array.isArray(body.stations)) throw new Error('unexpected response shape');
  const stations = buildIsStations(body.stations, now);
  console.log(`is: ${body.stations.length} rows, ${stations.length} stations`);
  return stations;
}
