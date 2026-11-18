import { buildItStations, itFuelKind, parseItTime, readItPrices } from '../../scripts/feed/sources/it.ts';

const now = new Date('2026-11-18T09:00:00Z');
const PRICES = `Estrazione del 2026-11-17
idImpianto|descCarburante|prezzo|isSelf|dtComu
3464|Benzina|2.319|0|11/11/2026 14:00:12
3464|Benzina|1.969|1|11/11/2026 14:00:14
3464|Gasolio|2.560|0|16/11/2026 20:00:09
3464|Blue Diesel|2.310|1|16/11/2026 20:00:09
3464|Metano|1.844|0|16/11/2026 20:00:08
3464|GPL|0.849|0|16/11/2026 20:00:08
9000|Benzina|19.990|1|16/11/2026 20:00:08
51416|HVOlution|2.199|1|16/11/2026 08:00:00
51416|Blue Super|2.249|1|16/11/2026 08:00:00`;
const REGISTER = `Estrazione del 2026-11-17
idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine
3464|ALFA S.R.L.|Agip Eni|Stradale|19829 AGRIGENTO|SS.189 KM. 64+649  92100|AGRIGENTO|AG|37.333935|13.595533
51416|ROSSI | FIGLI SNC|Pompe Bianche|Autostradale|AREA NORD|A4 KM 12 24050|CALCINATE|BG|45.61128388765408|9.790426392515123
9000|BETA|Esso|Stradale|X|Via Roma 1|MILANO|MI|45.46|9.19
7777|GAMMA|Q8|Stradale|X|Via Roma 1|PARIGI|XX|48.85|2.35`;

describe('Italy (MIMIT open data)', () => {
  it('maps the Ministry’s fuel names', () => {
    expect(itFuelKind('Benzina')).toBe('regular');
    expect(itFuelKind('Gasolio')).toBe('diesel');
    expect(itFuelKind('Blue Diesel')).toBe('premium-diesel');
    expect(itFuelKind('Gasolio artico')).toBe('premium-diesel');
    expect(itFuelKind('HiQ Perform+')).toBe('super');
    expect(itFuelKind('HVOlution')).toBe('hvo');
    expect(itFuelKind('GPL')).toBe('lpg');
    expect(itFuelKind('Metano')).toBeNull();
    expect(itFuelKind('L-GNC')).toBeNull();
  });

  it('reads Italian clock time, winter and summer', () => {
    expect(parseItTime('16/11/2026 20:00:07')).toBe('2026-11-16T19:00:07.000Z');
    expect(parseItTime('16/07/2026 20:00:07')).toBe('2026-07-16T18:00:07.000Z');
    expect(parseItTime('nonsense')).toBeNull();
  });

  it('prefers the self service price and drops impossible prices', () => {
    const prices = readItPrices(PRICES, now);
    expect(prices.get('3464')).toEqual({
      regular: { p: 196.9, at: '2026-11-11T13:00:14.000Z' },
      diesel: { p: 256, at: '2026-11-16T19:00:09.000Z' },
      'premium-diesel': { p: 231, at: '2026-11-16T19:00:09.000Z' },
      lpg: { p: 84.9, at: '2026-11-16T19:00:08.000Z' },
    });
    expect(prices.has('9000')).toBe(false);
  });

  it('joins the register, even when a name contains the separator', () => {
    const stations = buildItStations(REGISTER, readItPrices(PRICES, now));
    expect(stations.map((s) => s.id)).toEqual(['it-3464', 'it-51416']);
    expect(stations[0]).toMatchObject({ region: 'it', brand: 'Agip Eni', name: 'Agip Eni Agrigento', town: 'Agrigento', postcode: '92100', tags: [] });
    expect(stations[1]).toMatchObject({ brand: 'Rossi Figli Snc', town: 'Calcinate', postcode: '24050', tags: ['motorway'] });
    expect(Object.keys(stations[1]?.prices ?? {}).sort()).toEqual(['hvo', 'super']);
  });
});
