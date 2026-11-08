/**
 * Portugal: the DGEG's "Preços dos Combustíveis" service, https://precoscombustiveis.dgeg.gov.pt.
 * Station licence holders enter their own prices; the site's terms allow free reuse provided the
 * DGEG is named as the source, each price's last-update time is shown and the data is reproduced
 * faithfully (see LEGAL.md). One request returns every station and fuel (about 14,000 rows, 5 MB).
 */
import { cleanPrice, type FeedStation, type FuelKind, inRegion, isEuropeanSummerTime, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const PT_URL =
  'https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos?idsTiposComb=&idMarca=&idTipoPosto=&idDistrito=&idsMunicipios=&qtdPorPagina=20000&pagina=1';
export const PT_MIN_STATIONS = 2000;
/** Euro prices in cents per litre; outside this range the entry is a typing mistake. */
const PT_MIN_CENTS = 40;
const PT_MAX_CENTS = 400;

/** The DGEG fuel names Pumpwise lists. Agricultural, heating, two-stroke and gas fuels are left out. */
const FUEL_KINDS: Record<string, FuelKind> = {
  'Gasolina simples 95': 'regular',
  'Gasolina especial 95': 'premium',
  'Gasolina 98': 'super',
  'Gasolina especial 98': 'super',
  'Gasóleo simples': 'diesel',
  'Gasóleo especial': 'premium-diesel',
  'GPL Auto': 'lpg',
};

interface PtRow {
  Id?: number;
  Nome?: string;
  TipoPosto?: string;
  Municipio?: string;
  Preco?: string;
  Marca?: string;
  Combustivel?: string;
  DataAtualizacao?: string;
  Distrito?: string;
  Morada?: string;
  Localidade?: string;
  CodPostal?: string;
  Latitude?: number;
  Longitude?: number;
}

/** "1,769 €" or "0,899 €/litro" to cents per litre (176.9), or null when it is not a believable price. */
export function ptPrice(text: string | undefined): number | null {
  const match = /(\d+)[,.](\d{1,3})/.exec(text ?? '');
  if (!match) return null;
  const euros = Number(`${match[1]}.${match[2]}`);
  return cleanPrice(euros * 100, PT_MIN_CENTS, PT_MAX_CENTS);
}

/**
 * Portugal's clocks: mainland and Madeira are on UTC in winter and UTC+1 in summer; the Azores are
 * an hour behind. "2026-11-06 10:30" is the station's local time.
 */
export function ptOffsetMinutes(date: Date, lng?: number): number {
  const azores = typeof lng === 'number' && lng < -20;
  return (isEuropeanSummerTime(date) ? 60 : 0) - (azores ? 60 : 0);
}

/** "2026-11-06 10:30" (local time) to an ISO instant, or null when unreadable or in the future. */
export function parsePtTime(text: string | undefined, now: Date, lng?: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(text ?? '');
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const naive = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
  // The offset depends on the date itself; the guess from the naive time is right except within an hour of a clock change.
  const utc = naive - ptOffsetMinutes(new Date(naive), lng) * 60_000;
  if (!Number.isFinite(utc) || utc > now.getTime() + 10 * 60_000) return null;
  return new Date(utc).toISOString();
}

/** "Urb. Terras Compridas, Lote 8\nEstrada da Várzea" to one tidy line. */
function address(row: PtRow): string {
  const street = (row.Morada ?? '').split(/\r?\n/).map((part) => tidyName(part.trim(), 'pt')).filter(Boolean).join(', ');
  return street;
}

/** Turns the DGEG rows (one per station and fuel) into feed stations. Anything odd is skipped, never guessed. */
export function buildPtStations(rows: PtRow[], now: Date): FeedStation[] {
  const byId = new Map<string, FeedStation>();
  for (const row of rows) {
    const id = row.Id;
    const lat = row.Latitude;
    const lng = row.Longitude;
    if (typeof id !== 'number' || typeof lat !== 'number' || typeof lng !== 'number' || !inRegion('pt', lat, lng)) continue;
    const kind = FUEL_KINDS[row.Combustivel ?? ''];
    if (!kind) continue;
    const price = ptPrice(row.Preco);
    const at = parsePtTime(row.DataAtualizacao, now, lng);
    if (price === null || !at) continue;
    let station = byId.get(`pt-${id}`);
    if (!station) {
      const brand = tidyName(row.Marca ?? '', 'pt');
      const tags: string[] = [];
      if (row.TipoPosto === 'Auto-estrada') tags.push('motorway');
      if (/Hipermercado/i.test(row.TipoPosto ?? '')) tags.push('supermarket');
      station = {
        id: `pt-${id}`,
        region: 'pt',
        name: tidyName(row.Nome ?? '', 'pt') || brand || 'Posto',
        brand,
        address: address(row),
        town: tidyName(row.Localidade || row.Municipio || '', 'pt'),
        postcode: (row.CodPostal ?? '').trim(),
        lat: roundCoord(lat),
        lng: roundCoord(lng),
        hours: null,
        tags,
        prices: {},
      };
      byId.set(station.id, station);
    }
    // Two DGEG names map to "super" (Gasolina 98 and Gasolina especial 98): keep the cheaper, as a driver would.
    const existing = station.prices[kind];
    if (!existing || price < existing.p) station.prices[kind] = { p: price, at };
  }
  return [...byId.values()].filter((s) => Object.keys(s.prices).length > 0);
}

/** One request for the whole country (about 5 MB, up to a minute). */
export async function fetchPt(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000);
  const response = await request(PT_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { status?: boolean; resultado?: PtRow[] };
  if (!body.status || !Array.isArray(body.resultado)) throw new Error('unexpected response shape');
  const stations = buildPtStations(body.resultado, now);
  console.log(`pt: ${body.resultado.length} rows, ${stations.length} stations`);
  return stations;
}
