// Queensland: the Queensland Government fuel price reporting scheme, through its data-consumer API
// (Fuel Prices QLD, run by Informed Sources). Free, but needs a data-consumer sign-up at
// https://www.fuelpricesqld.com.au, which gives a subscriber token. Off unless the GitHub secret
// QLD_FUEL_API_TOKEN is set.
//
// Field names follow the publicly documented "FPDAPI" used by existing open-source clients; they are
// checked on the first live run (the log line "qld: N stations" and the accuracy check).
import { asNumber, asRecord, asString, cleanPrice, type FeedStation, type FuelKind, inRegion, type Raw, roundCoord, tidyName } from '../../../src/lib/feed.ts';
import { failureDetail } from './nsw.ts';
import { politeRequester } from '../http.ts';

export const QLD_API = 'https://fppdirectapi-prod.fuelpricesqld.com.au';
/** Queensland in the API's own terms: country 21 (Australia), state level 3, region 1. */
const QLD_SCOPE = 'countryId=21&geoRegionLevel=3&geoRegionId=1';
export const QLD_MIN_CENTS = 60;
export const QLD_MAX_CENTS = 500;
/** About 1,700 Queensland stations report; far fewer means something went wrong. */
export const QLD_MIN_STATIONS = 1000;

export function qldToken(): string | null {
  return process.env.QLD_FUEL_API_TOKEN?.trim() || null;
}

/** The API's fuel names to fuel kinds, matched loosely ("Premium Unleaded 95", "e10"). */
export function qldFuelKind(name: string): FuelKind | null {
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (n === 'unleaded' || n === 'unleaded 91' || n === 'ulp') return 'regular';
  if (n === 'e10' || n.startsWith('e10 ')) return 'e10';
  if (n.includes('95')) return 'premium';
  if (n.includes('98')) return 'super';
  if (n === 'premium diesel') return 'premium-diesel';
  if (n === 'diesel') return 'diesel';
  if (n === 'lpg') return 'lpg';
  if (n === 'e85') return 'e85';
  return null;
}

function list(value: unknown, key: string): Raw[] {
  const items = asRecord(value)?.[key];
  return Array.isArray(items) ? (items.map(asRecord).filter(Boolean) as Raw[]) : [];
}

/** Joins the sites, brands, fuel names and prices into feed stations. Anything odd is skipped. */
export function buildQldStations(sites: unknown, brands: unknown, fuels: unknown, prices: unknown, now: Date): FeedStation[] {
  const brandName = new Map(list(brands, 'Brands').map((b) => [asString(b.BrandId), tidyName(asString(b.Name))]));
  const fuelKind = new Map(list(fuels, 'Fuels').map((f) => [asString(f.FuelId), qldFuelKind(asString(f.Name))]));
  const byId = new Map<string, FeedStation>();
  for (const s of list(sites, 'S')) {
    const id = asString(s.S);
    const lat = asNumber(s.Lat);
    const lng = asNumber(s.Lng);
    if (!id || lat === null || lng === null || !inRegion('qld', lat, lng)) continue;
    const brand = brandName.get(asString(s.B)) ?? '';
    byId.set(id, {
      id: `qld-${id}`,
      region: 'qld',
      name: tidyName(asString(s.N)) || brand || 'Service station',
      brand,
      address: tidyName(asString(s.A)),
      town: '',
      postcode: asString(s.P),
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags: [],
      prices: {},
    });
  }
  const latest = now.getTime() + 10 * 60_000;
  for (const p of list(prices, 'SitePrices')) {
    const station = byId.get(asString(p.SiteId));
    const kind = fuelKind.get(asString(p.FuelId));
    if (!station || !kind) continue;
    // Prices come in tenths of a cent (1859 is 185.9c); 9999 marks a fuel that is out of stock.
    const raw = asNumber(p.Price);
    if (raw === null || raw >= 9999) continue;
    const price = cleanPrice(raw > 1000 ? raw / 10 : raw, QLD_MIN_CENTS, QLD_MAX_CENTS);
    const stamp = asString(p.TransactionDateUtc);
    const at = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(stamp) ? stamp : `${stamp}Z`);
    if (price === null || !Number.isFinite(at) || at > latest) continue;
    const iso = new Date(at).toISOString();
    const existing = station.prices[kind];
    if (!existing || existing.at < iso) station.prices[kind] = { p: price, at: iso };
  }
  return [...byId.values()].filter((s) => Object.keys(s.prices).length > 0);
}

/** Four requests: sites, brands, fuel types and prices for all of Queensland. */
export async function fetchQld(token: string, now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1000);
  const headers = { Authorization: `FPDAPI SubscriberToken=${token}`, 'Content-Type': 'application/json' };
  const get = async (path: string): Promise<unknown> => {
    const response = await request(`${QLD_API}${path}`, { headers });
    if (!response.ok) throw new Error(`${path.split('?')[0]}: ${await failureDetail(response, { key: token, secret: '' })}`);
    return response.json();
  };
  const sites = await get(`/Subscriber/GetFullSiteDetails?${QLD_SCOPE}`);
  const brands = await get('/Subscriber/GetCountryBrands?countryId=21');
  const fuels = await get('/Subscriber/GetCountryFuelTypes?countryId=21');
  const prices = await get(`/Price/GetSitesPrices?${QLD_SCOPE}`);
  const stations = buildQldStations(sites, brands, fuels, prices, now);
  console.log(`qld: ${stations.length} stations`);
  return stations;
}
