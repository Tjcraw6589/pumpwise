/**
 * Taiwan: CPC Corporation (台灣中油), the state oil company. Two open datasets on data.gov.tw, both under
 * the Open Government Data License, version 1.0, which allows free reuse, commercial use included,
 * with the source named: the list of CPC stations with what each sells (dataset 6065) and CPC's
 * list prices for its main products.
 *
 * CPC sets one list price for the stations it runs itself (交貨地點: 中油自營站), usually every Monday. So
 * only CPC's own stations (類別: 自營站) are shown, each with the list price of the fuels it sells.
 * Franchised CPC stations may discount, and other companies (Formosa and others) publish no open
 * data, so they are left out and the site says so.
 */
import { asNumber, asRecord, asString, type FeedStation, type FuelKind, inRegion, roundCoord } from '../../../src/lib/feed.ts';
import { politeRequester } from '../http.ts';

export const TW_STATIONS_URL = 'https://vipmbr.cpc.com.tw/CPCSTN/STNWebService.asmx/getStationInfo_XML';
export const TW_PRICES_URL = 'https://vipmbr.cpc.com.tw/openData/MainProdListPrice';
/** CPC runs several hundred stations itself; far fewer means something went wrong. */
export const TW_MIN_STATIONS = 300;
/** New Taiwan dollars a litre outside this range is a mistake. */
export const TW_MIN_NTD = 15;
export const TW_MAX_NTD = 80;

/** CPC's product names, the station list's column for each, and Pumpwise's fuel. 95 is the usual petrol. */
export const TW_FUELS: { product: string; column: string; kind: FuelKind }[] = [
  { product: '92無鉛汽油', column: '無鉛92', kind: 'regular' },
  { product: '95無鉛汽油', column: '無鉛95', kind: 'premium' },
  { product: '98無鉛汽油', column: '無鉛98', kind: 'super' },
  { product: '超級柴油', column: '超柴', kind: 'diesel' },
];

/** The 22 counties and cities in English, as the town of each station (the site's pages need Latin names). */
export const TW_PLACES: Record<string, string> = {
  基隆市: 'Keelung', 臺北市: 'Taipei', 台北市: 'Taipei', 新北市: 'New Taipei', 桃園市: 'Taoyuan', 新竹市: 'Hsinchu City', 新竹縣: 'Hsinchu County',
  苗栗縣: 'Miaoli', 臺中市: 'Taichung', 台中市: 'Taichung', 彰化縣: 'Changhua', 南投縣: 'Nantou', 雲林縣: 'Yunlin', 嘉義市: 'Chiayi City',
  嘉義縣: 'Chiayi County', 臺南市: 'Tainan', 台南市: 'Tainan', 高雄市: 'Kaohsiung', 屏東縣: 'Pingtung', 宜蘭縣: 'Yilan', 花蓮縣: 'Hualien',
  臺東縣: 'Taitung', 台東縣: 'Taitung', 澎湖縣: 'Penghu', 金門縣: 'Kinmen', 連江縣: 'Lienchiang',
};

/** CPC's list prices by fuel, in hundredths of a dollar (32.7 is 3270). */
export function twListPrices(body: unknown): Partial<Record<FuelKind, number>> {
  const prices: Partial<Record<FuelKind, number>> = {};
  for (const item of Array.isArray(body) ? body : []) {
    const row = asRecord(item);
    if (!row) continue;
    const name = asString(row['產品名稱']).replace(/\s+/g, '');
    const fuel = TW_FUELS.find((f) => f.product === name);
    const ntd = asNumber(row['參考牌價_金額']);
    if (!fuel || ntd === null || ntd < TW_MIN_NTD || ntd > TW_MAX_NTD) continue;
    if (!/自營站/.test(asString(row['交貨地點'])) || !/公升/.test(asString(row['計價單位']))) continue;
    prices[fuel.kind] = Math.round(ntd * 1000) / 10;
  }
  return prices;
}

const field = (block: string, name: string): string => (new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(block)?.[1] ?? '').trim();

/** CPC's own open stations, each with the list price of the fuels it sells. */
export function buildTwStations(xml: string, list: Partial<Record<FuelKind, number>>, now: Date): FeedStation[] {
  const at = now.toISOString();
  const stations: FeedStation[] = [];
  for (const block of xml.split('<Table>').slice(1)) {
    if (field(block, '類別') !== '自營站' || field(block, '營業中') !== '1') continue;
    const id = field(block, '站代號');
    const lat = asNumber(field(block, '緯度'));
    const lng = asNumber(field(block, '經度'));
    if (!id || lat === null || lng === null || !inRegion('tw', lat, lng)) continue;
    const prices: FeedStation['prices'] = {};
    for (const fuel of TW_FUELS) {
      const p = list[fuel.kind];
      if (field(block, fuel.column) === '1' && p !== undefined) prices[fuel.kind] = { p, at };
    }
    if (Object.keys(prices).length === 0) continue;
    const county = field(block, '縣市');
    const tags: string[] = [];
    if (field(block, '國道高速公路') === '1') tags.push('motorway');
    stations.push({
      id: `tw-${id}`,
      region: 'tw',
      name: `CPC ${field(block, '站名')}`,
      brand: 'CPC',
      address: `${county}${field(block, '鄉鎮區')}${field(block, '地址')}`,
      town: TW_PLACES[county] ?? '',
      postcode: '',
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      hours: null,
      tags,
      prices,
    });
  }
  return stations;
}

export async function fetchTw(now: Date): Promise<FeedStation[]> {
  const request = politeRequester(1500, 'application/json, text/xml');
  const priceResponse = await request(TW_PRICES_URL);
  if (!priceResponse.ok) throw new Error(`prices: HTTP ${priceResponse.status}`);
  const list = twListPrices(await priceResponse.json());
  if (list.premium === undefined || list.diesel === undefined) throw new Error('list prices for 95 and diesel not found');
  const stationResponse = await request(TW_STATIONS_URL);
  if (!stationResponse.ok) throw new Error(`stations: HTTP ${stationResponse.status}`);
  const xml = await stationResponse.text();
  const stations = buildTwStations(xml, list, now);
  console.log(`tw: ${xml.split('<Table>').length - 1} rows, ${stations.length} stations, list prices ${JSON.stringify(list)}`);
  return stations;
}
