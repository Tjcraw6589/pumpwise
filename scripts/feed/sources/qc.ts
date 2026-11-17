/**
 * Quebec: Régie essence Québec, the Régie de l'énergie's platform. Since 1 April 2026 every station in
 * Quebec must report its price there within five minutes of a change. The platform publishes one
 * GeoJSON file for the whole province.
 *
 * Permission: the Régie answered Pumpwise in writing on 17 November 2026. It does not object to an
 * app reading the platform, with no limit on access, frequency or redistribution, on three
 * conditions: the data is not changed; the source (Régie essence Québec, Régie de l'énergie) is named
 * and visible at all times; and nothing claims or suggests a mandate from the Régie (see LEGAL.md).
 *
 * The file gives no time for each price, so each price is stamped with the time the feed read it.
 */
import { asNumber, asRecord, asString, type FeedStation, type FuelKind, hashId, inRegion, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const QC_URL = 'https://regieessencequebec.ca/stations.geojson.gz';
/** The platform lists about 2,470 stations; far fewer means something went wrong. */
export const QC_MIN_STATIONS = 1500;
/** Cents a litre outside this range is a reporting mistake. */
export const QC_MIN_CENTS = 80;
export const QC_MAX_CENTS = 450;

const QC_FUELS: Record<string, FuelKind> = { régulier: 'regular', regulier: 'regular', ordinaire: 'regular', super: 'premium', diesel: 'diesel' };

/** "174.9¢" as 174.9 (cents a litre, which is hundredths of a dollar, as everywhere in the feed). */
export function qcPrice(value: unknown): number | null {
  const cents = asNumber(asString(value).replace(/[^\d.,]/g, '').replace(',', '.'));
  if (cents === null || cents < QC_MIN_CENTS || cents > QC_MAX_CENTS) return null;
  return Math.round(cents * 10) / 10;
}

/** "165 Jean-Adam , Saint-Sauveur" as the street and the town. */
export function qcAddress(text: string): { street: string; town: string } {
  const parts = text.split(',').map((part) => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (parts.length < 2) return { street: parts[0] ?? '', town: '' };
  return { street: parts.slice(0, -1).join(', '), town: tidyName(parts[parts.length - 1] ?? '', 'fr') };
}

export function buildQcStations(body: unknown, now: Date): FeedStation[] {
  const features = asRecord(body)?.features;
  const at = now.toISOString();
  const stations: FeedStation[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(features) ? features : []) {
    const feature = asRecord(item);
    const props = asRecord(feature?.properties);
    const point = asRecord(feature?.geometry)?.coordinates;
    if (!props || !Array.isArray(point)) continue;
    const lng = asNumber(point[0]);
    const lat = asNumber(point[1]);
    if (lat === null || lng === null || !inRegion('qc', lat, lng)) continue;
    if (!/op[ée]ration/i.test(asString(props.Status))) continue;
    const prices: FeedStation['prices'] = {};
    for (const entry of Array.isArray(props.Prices) ? props.Prices : []) {
      const row = asRecord(entry);
      if (!row || row.IsAvailable === false) continue;
      const kind = QC_FUELS[asString(row.GasType).toLowerCase()];
      const p = qcPrice(row.Price);
      if (kind && p !== null) prices[kind] = { p, at };
    }
    if (Object.keys(prices).length === 0) continue;
    const legal = tidyName(asString(props.Name));
    const banner = asString(props.brand);
    const brand = /^(aucun|ind[ée]pendant|)$/i.test(banner) ? '' : banner;
    const where = qcAddress(asString(props.Address));
    // The file has no station number: the place and the registered name identify a station.
    const id = `qc-${hashId(`${lat.toFixed(5)},${lng.toFixed(5)},${legal}`)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    stations.push({
      id,
      region: 'qc',
      name: brand ? [brand, where.town].filter(Boolean).join(' ') : legal || 'Station',
      brand: brand || legal,
      address: where.street,
      town: where.town,
      postcode: asString(props.PostalCode),
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags: [],
      prices,
    });
  }
  return stations;
}

/** One file of about 2 MB for the whole province. The name says .gz; the server may already have unpacked it. */
export async function fetchQc(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000, 'application/geo+json, application/json');
  const response = await request(QC_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const text = bytes[0] === 0x1f && bytes[1] === 0x8b ? (await import('node:zlib')).gunzipSync(bytes).toString('utf8') : bytes.toString('utf8');
  const body: unknown = JSON.parse(text);
  const stations = buildQcStations(body, now);
  const total = Array.isArray(asRecord(body)?.features) ? (asRecord(body)?.features as unknown[]).length : 0;
  console.log(`qc: ${total} rows, ${stations.length} stations`);
  return stations;
}
