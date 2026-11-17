import { buildQcStations, qcAddress, qcPrice } from '../../scripts/feed/sources/qc.ts';
import { buildTwStations, twListPrices } from '../../scripts/feed/sources/tw.ts';

const now = new Date('2026-11-17T18:00:00Z');

describe('Quebec (Régie essence Québec)', () => {
  const feature = (over: Record<string, unknown> = {}, at: [number, number] = [-74.149751, 45.891599]) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: at },
    properties: {
      Name: '9446-7404 QUEBEC INC', brand: 'Petro-Canada', Status: 'En opération', Address: '165 Jean-Adam , Saint-Sauveur', PostalCode: 'J0R 1R6', Region: 'Laurentides',
      Prices: [{ GasType: 'Régulier', Price: '162.9¢', IsAvailable: true }, { GasType: 'Super', Price: '188.9¢', IsAvailable: true }, { GasType: 'Diesel', Price: '281.9¢', IsAvailable: false }],
      ...over,
    },
  });

  it('reads prices and addresses', () => {
    expect(qcPrice('174.9¢')).toBe(174.9);
    expect(qcPrice('0.0¢')).toBeNull();
    expect(qcAddress('165 Jean-Adam , Saint-Sauveur')).toEqual({ street: '165 Jean-Adam', town: 'Saint-Sauveur' });
  });

  it('builds stations with unchanged prices, leaving out fuels that are not available', () => {
    const stations = buildQcStations({ features: [feature(), feature({ Status: 'Fermé' }, [-73.5, 45.5]), feature({ brand: 'Aucun', Name: 'Garage Tremblay' }, [-71.2, 46.8]), feature({}, [-79.38, 43.65])] }, now);
    expect(stations).toHaveLength(2);
    expect(stations[0]).toMatchObject({ region: 'qc', name: 'Petro-Canada Saint-Sauveur', brand: 'Petro-Canada', town: 'Saint-Sauveur', postcode: 'J0R 1R6' });
    expect(stations[0]?.prices).toEqual({ regular: { p: 162.9, at: now.toISOString() }, premium: { p: 188.9, at: now.toISOString() } });
    expect(stations[1]?.name).toBe('Garage Tremblay');
  });
});

describe('Taiwan (CPC)', () => {
  const list = [
    { 產品名稱: '98無鉛汽油', 交貨地點: '中油自營站', 計價單位: '元/ 公升', 參考牌價_金額: 34.7 },
    { 產品名稱: '95無鉛汽油', 交貨地點: '中油自營站', 計價單位: '元/ 公升', 參考牌價_金額: 32.7 },
    { 產品名稱: '92無鉛汽油', 交貨地點: '中油自營站', 計價單位: '元/ 公升', 參考牌價_金額: 31.2 },
    { 產品名稱: '超級柴油', 交貨地點: '中油自營站', 計價單位: '元/ 公升', 參考牌價_金額: 30.1 },
    { 產品名稱: '95無鉛汽油', 交貨地點: '其他', 計價單位: '元/ 公秉', 參考牌價_金額: 32000 },
  ];
  const station = (id: string, kind: string, extra = '') =>
    `<Table><站代號>${id}</站代號><類別>${kind}</類別><站名>八堵站</站名><縣市>基隆市</縣市><鄉鎮區>暖暖區</鄉鎮區><地址>八堵路158號</地址><營業中>1</營業中><國道高速公路>0</國道高速公路><無鉛92>1</無鉛92><無鉛95>1</無鉛95><無鉛98>0</無鉛98><超柴>1</超柴><經度>121.728</經度><緯度>25.108</緯度>${extra}</Table>`;

  it('reads the list prices for CPC’s own stations', () => {
    expect(twListPrices(list)).toEqual({ super: 3470, premium: 3270, regular: 3120, diesel: 3010 });
  });

  it('keeps only CPC’s own stations, with the fuels each sells', () => {
    const xml = `<Dataset>${station('D2041', '自營站')}${station('D9999', '加盟站')}${station('D2030', '漁船站')}</Dataset>`;
    const stations = buildTwStations(xml, twListPrices(list), now);
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ id: 'tw-D2041', region: 'tw', brand: 'CPC', town: 'Keelung', address: '基隆市暖暖區八堵路158號' });
    expect(Object.keys(stations[0]?.prices ?? {}).sort()).toEqual(['diesel', 'premium', 'regular']);
    expect(stations[0]?.prices.premium?.p).toBe(3270);
  });
});
