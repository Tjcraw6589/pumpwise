import { type FeedStation, feedForVersion, LATEST_FEED_VERSION, PUBLISHED_FEEDS, type RegionStatus } from '@/lib/feed';
import { REGIONS, spainOffsetMinutes } from '@/lib/regions';

import { buildEsStations, esNumber, parseEsHours, parseEsTime } from '../../scripts/feed/sources/es.ts';
import { buildFrStations, parseFrHours, parseFrTime } from '../../scripts/feed/sources/fr.ts';
import { buildMxStations, mxName, mxPrice } from '../../scripts/feed/sources/mx.ts';
import { buildPtStations, parsePtTime, ptPrice } from '../../scripts/feed/sources/pt.ts';
import { buildQldStations, qldFuelKind } from '../../scripts/feed/sources/qld.ts';
import { firstFileInZip } from '../../scripts/feed/zip.ts';

const NOW = new Date('2026-11-04T04:30:00Z');

/** Latin-1 text as bytes (every character below 256). */
function latin1(text: string): Uint8Array {
  return Uint8Array.from(text, (c) => c.charCodeAt(0));
}

/** A one-file zip like the French government's, stored uncompressed (the reader handles both). */
function makeZip(name: string, content: string): Uint8Array {
  const data = latin1(content);
  const nameBytes = new TextEncoder().encode(name);
  const centralOffset = 30 + nameBytes.length + data.length;
  const out = new Uint8Array(centralOffset + 46 + nameBytes.length + 22);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, nameBytes.length, true);
  out.set(nameBytes, 30);
  out.set(data, 30 + nameBytes.length);
  view.setUint32(centralOffset, 0x02014b50, true);
  view.setUint32(centralOffset + 20, data.length, true);
  view.setUint32(centralOffset + 24, data.length, true);
  view.setUint16(centralOffset + 28, nameBytes.length, true);
  view.setUint32(centralOffset + 42, 0, true);
  out.set(nameBytes, centralOffset + 46);
  const end = centralOffset + 46 + nameBytes.length;
  view.setUint32(end, 0x06054b50, true);
  view.setUint16(end + 8, 1, true);
  view.setUint16(end + 10, 1, true);
  view.setUint32(end + 12, 46 + nameBytes.length, true);
  view.setUint32(end + 16, centralOffset, true);
  return out;
}

describe('Spain (Geoportal de Gasolineras)', () => {
  const answer = {
    Fecha: '04/11/2026 5:22:06',
    ResultadoConsulta: 'OK',
    ListaEESSPrecio: [
      {
        'C.P.': '28001',
        'Dirección': 'CALLE DE SERRANO, 61',
        Horario: 'L-D: 24H',
        Latitud: '40,430000',
        Localidad: 'MADRID',
        'Longitud (WGS84)': '-3,686000',
        Municipio: 'Madrid',
        'Precio Gasolina 95 E5': '1,699',
        'Precio Gasolina 98 E5': '',
        'Precio Gasolina 98 E10': '1,859',
        'Precio Gasoleo A': '1,839',
        'Precio Gasoleo B': '1,289',
        'Rótulo': 'REPSOL',
        'Tipo Venta': 'P',
        IDEESS: '1234',
      },
      { IDEESS: '5', Latitud: '38,72', 'Longitud (WGS84)': '-9,14', 'Precio Gasolina 95 E5': '1,70', Fecha: '' }, // Lisbon: outside Spain
      { IDEESS: '6', Latitud: '40,4', 'Longitud (WGS84)': '-3,7', 'Precio Gasolina 95 E5': '' }, // no prices
      { IDEESS: '7', Latitud: '28,12', 'Longitud (WGS84)': '-15,44', 'Precio Gasoleo A': '1,45', 'Rótulo': '', 'Tipo Venta': 'R' },
    ],
  };

  test('reads comma decimals and Madrid time', () => {
    expect(esNumber('39,211417')).toBeCloseTo(39.211417);
    expect(esNumber('')).toBeNull();
    expect(parseEsTime('04/11/2026 5:22:06')).toBe('2026-11-04T04:22:06.000Z'); // winter: UTC+1
    expect(parseEsTime('15/07/2026 12:00:00')).toBe('2026-07-15T10:00:00.000Z'); // summer: UTC+2
    expect(parseEsTime('rubbish')).toBeNull();
  });

  test('reads opening hours, leaving unmentioned days unknown rather than closed', () => {
    expect(parseEsHours('L-D: 24H')).toEqual(Array(7).fill('24h'));
    expect(parseEsHours('L-V: 07:00-22:00; S: 08:00-14:00')).toEqual(['0700-2200', '0700-2200', '0700-2200', '0700-2200', '0700-2200', '0800-1400', 'unknown']);
    expect(parseEsHours('L-S: 07:00-14:00 y 16:00-21:00; D: 24H')?.slice(5)).toEqual(['0700-2100', '24h']);
    expect(parseEsHours('L: 06:00-22:00')).toEqual(['0600-2200', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown']);
    expect(parseEsHours('S-D: 9:00-14:00')?.slice(5)).toEqual(['0900-1400', '0900-1400']);
    expect(parseEsHours('')).toBeNull();
  });

  test('builds stations: euro prices as cents, 98 E10 when there is no 98 E5, agricultural diesel left out', () => {
    const stations = buildEsStations(answer);
    expect(stations.map((s) => s.id)).toEqual(['es-1234', 'es-7']);
    const madrid = stations[0] as FeedStation;
    expect(madrid).toMatchObject({ region: 'es', name: 'Repsol', address: 'Calle de Serrano, 61', town: 'Madrid', postcode: '28001' });
    expect(madrid.prices).toEqual({
      regular: { p: 169.9, at: '2026-11-04T04:22:06.000Z' },
      super: { p: 185.9, at: '2026-11-04T04:22:06.000Z' },
      diesel: { p: 183.9, at: '2026-11-04T04:22:06.000Z' },
    });
    expect(madrid.hours).toEqual(Array(7).fill('24h'));
    const canaries = stations[1] as FeedStation;
    expect(canaries.name).toBe('Gasolinera');
    expect(canaries.tags).toEqual(['members-only']);
  });

  test('the Canary Islands keep their own clock', () => {
    const winter = new Date('2026-11-04T12:00:00Z');
    expect(spainOffsetMinutes(winter, -3.7)).toBe(60);
    expect(spainOffsetMinutes(winter, -15.4)).toBe(0);
    expect(spainOffsetMinutes(new Date('2026-07-01T12:00:00Z'), -3.7)).toBe(120);
    expect(REGIONS.es.utcOffsetMinutes(winter)).toBe(60);
  });
});

describe('France (prix-carburants.gouv.fr)', () => {
  const xml = `<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="58240003" latitude="4675351.71497" longitude="314069.121289" cp="58240" pop="R">
    <adresse>ROUTE NATIONALE 7 - LES BOULAISES</adresse>
    <ville>Chantenay-Saint-Imbert</ville>
    <horaires automate-24-24="1">
      <jour id="1" nom="Lundi" ferme=""/>
    </horaires>
    <services><service>Toilettes publiques</service><service>DAB (Distributeur automatique de billets)</service></services>
    <prix nom="Gazole" id="1" maj="2026-11-04 00:01:00" valeur="2.170"/>
    <prix nom="E10" id="5" maj="2026-11-04 05:20:00" valeur="1.990"/>
    <prix nom="SP98" id="6" maj="2026-11-04 08:00:00" valeur="1.990"/>
    <prix nom="GNV" id="7" maj="2026-11-04 00:01:00" valeur="1.200"/>
  </pdv>
  <pdv id="75015001" latitude="4884000" longitude="229000" cp="75015" pop="A">
    <adresse>Aire de Paris &amp; Co</adresse>
    <ville>PARIS</ville>
    <horaires automate-24-24="">
      <jour id="1" nom="Lundi" ferme=""><horaire ouverture="06.00" fermeture="22.30"/></jour>
      <jour id="7" nom="Dimanche" ferme="1"/>
    </horaires>
    <services/>
    <prix nom="E10" id="5" maj="2026-07-10 09:00:00" valeur="1.859"/>
  </pdv>
  <pdv id="97400001" latitude="-2090000" longitude="5550000" cp="97400" pop="R">
    <adresse>Rue de Paris</adresse><ville>Saint-Denis</ville>
    <prix nom="E10" id="5" maj="2026-11-04 00:01:00" valeur="1.700"/>
  </pdv>
</pdv_liste>`;

  test('reads Paris time, including summer time', () => {
    expect(parseFrTime('2026-11-04 04:59:27')).toBe('2026-11-04T03:59:27.000Z');
    expect(parseFrTime('2026-07-10 09:00:00')).toBe('2026-07-10T07:00:00.000Z');
    expect(parseFrTime('')).toBeNull();
  });

  test('a 24-hour card machine means open round the clock; otherwise each day as listed', () => {
    expect(parseFrHours('<horaires automate-24-24="1"></horaires>')).toEqual(Array(7).fill('24h'));
    const hours = parseFrHours('<horaires automate-24-24=""><jour id="1" ferme=""><horaire ouverture="06.00" fermeture="22.30"/></jour><jour id="7" ferme="1"/></horaires>');
    expect(hours).toEqual(['0600-2230', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'closed']);
    expect(parseFrHours('<horaires automate-24-24=""><jour id="2" ferme=""/></horaires>')).toBeNull();
  });

  test('builds stations from the zipped XML: degrees from hundred-thousandths, prices in cents, future times refused', async () => {
    const { name, data } = await firstFileInZip(makeZip('PrixCarburants_instantane.xml', xml));
    expect(name).toBe('PrixCarburants_instantane.xml');
    const stations = buildFrStations(new TextDecoder('latin1').decode(data), NOW);
    expect(stations.map((s) => s.id)).toEqual(['fr-58240003', 'fr-75015001']); // Réunion is outside mainland France
    const first = stations[0] as FeedStation;
    expect(first.lat).toBeCloseTo(46.75352, 4);
    expect(first.lng).toBeCloseTo(3.14069, 4);
    expect(first.name).toBe('Route Nationale 7 - Les Boulaises');
    expect(first.town).toBe('Chantenay-Saint-Imbert');
    expect(first.prices).toEqual({
      diesel: { p: 217, at: '2026-11-03T23:01:00.000Z' },
      regular: { p: 199, at: '2026-11-04T04:20:00.000Z' },
    }); // SP98 at 08:00 Paris is in the future at 04:30 UTC; GNV is not a fuel Pumpwise lists
    expect(first.tags.sort()).toEqual(['24h-fuel', 'atm', 'toilets']);
    const paris = stations[1] as FeedStation;
    expect(paris.name).toBe('Aire de Paris & Co');
    expect(paris.town).toBe('Paris');
    expect(paris.tags).toEqual(['motorway']);
  });

  test('a fuel the station has run out of is left out, but a shortage that has ended is not', () => {
    const shortage = `<pdv_liste><pdv id="75013023" latitude="4882586" longitude="238433" cp="75013" pop="R">
      <adresse>RUE JEAN-BAPTISTE BERLIER</adresse><ville>Paris</ville>
      <prix nom="Gazole" id="1" maj="2026-11-04 06:00:00" valeur="2.250"/>
      <prix nom="E10" id="5" maj="2026-11-01 08:00:00" valeur="1.989"/>
      <prix nom="SP95" id="2" maj="2026-11-01 08:00:00" valeur="2.049"/>
      <prix nom="SP98" id="6" maj="2026-11-03 09:00:00" valeur="2.099"/>
      <rupture id="5" nom="E10" debut="2026-11-03 16:10:43" fin="" type="temporaire"/>
      <rupture id="2" nom="SP95" debut="2022-10-10 13:36:55" fin="" type="definitive"/>
      <rupture id="6" nom="SP98" debut="2026-10-29 22:10:13" fin="2026-11-02 07:00:00" type="temporaire"/>
    </pdv></pdv_liste>`;
    const [station] = buildFrStations(shortage, new Date('2026-11-04T08:00:00Z'));
    expect(Object.keys(station?.prices ?? {}).sort()).toEqual(['diesel', 'super']);
  });
});

describe('Mexico (CRE)', () => {
  const places = `﻿<?xml version="1.0" encoding="utf-8"?>
<places>
  <place place_id="2039"><name>ESTACION HIPODROMO SA DE CV</name><cre_id>PL/658/EXP/ES/2015</cre_id><location><x>-116.9214</x><y>32.47641</y></location></place>
  <place place_id="2040"><name>GASOLINERA LA PAZ, S.A. DE C.V.</name><location><x>-99.13</x><y>19.43</y></location></place>
  <place place_id="2041"><name>SIN PRECIO SA DE CV</name><location><x>-99.1</x><y>19.4</y></location></place>
  <place place_id="2042"><name>EN TEXAS SA DE CV</name><location><x>-97.0</x><y>35.0</y></location></place>
</places>`;
  const prices = `<?xml version="1.0" encoding="utf-8"?>
<places>
  <place place_id="2039"><gas_price type="regular">22.95</gas_price><gas_price type="premium">27.9</gas_price></place>
  <place place_id="2040"><gas_price type="diesel">27</gas_price><gas_price type="regular">2.5</gas_price></place>
  <place place_id="2042"><gas_price type="regular">23</gas_price></place>
</places>`;

  test('company forms are dropped from names, and pesos become centavos', () => {
    expect(mxName('ESTACION HIPODROMO SA DE CV')).toBe('Estacion Hipodromo');
    expect(mxName('GASOLINERA LA PAZ, S.A. DE C.V.')).toBe('Gasolinera La Paz');
    expect(mxName('SERVICIO TOTAL SAPI DE CV')).toBe('Servicio Total');
    expect(mxPrice('24.59')).toBe(2459);
    expect(mxPrice('27.9')).toBe(2790);
    expect(mxPrice('2.5')).toBeNull();
  });

  test('joins stations and prices; stations without prices or outside Mexico are left out', () => {
    const stations = buildMxStations(places, prices, NOW);
    expect(stations.map((s) => s.id)).toEqual(['mx-2039', 'mx-2040']);
    expect(stations[0]).toMatchObject({ region: 'mx', name: 'Estacion Hipodromo', lat: 32.47641, lng: -116.9214, hours: null });
    // The source has no address: the town and state come from the municipality the station is in.
    expect(stations[0]).toMatchObject({ address: '', town: 'Tijuana', state: 'Baja California', postcode: '' });
    expect(stations[1]).toMatchObject({ town: 'Cuauhtémoc', state: 'Ciudad de México' });
    expect(stations[0]?.prices).toEqual({ regular: { p: 2295, at: NOW.toISOString() }, premium: { p: 2790, at: NOW.toISOString() } });
    expect(stations[1]?.prices).toEqual({ diesel: { p: 2700, at: NOW.toISOString() } });
  });

  test('a station listed twice keeps every fuel, and a fuel at two prices is left out', () => {
    const twice = `<places>
  <place place_id="2040"><gas_price type="premium">28.99</gas_price><gas_price type="diesel">27</gas_price></place>
  <place place_id="2040"><gas_price type="regular">23.99</gas_price><gas_price type="diesel">25.39</gas_price></place>
  <place place_id="2040"><gas_price type="premium">28.99</gas_price></place>
</places>`;
    const [station] = buildMxStations(places, twice, NOW);
    expect(station?.prices).toEqual({ premium: { p: 2899, at: NOW.toISOString() }, regular: { p: 2399, at: NOW.toISOString() } });
  });
});

describe('Queensland (Fuel Prices QLD, off until the token exists)', () => {
  test('maps the API fuel names', () => {
    expect(qldFuelKind('Unleaded')).toBe('regular');
    expect(qldFuelKind('e10')).toBe('e10');
    expect(qldFuelKind('Premium Unleaded 95')).toBe('premium');
    expect(qldFuelKind('Premium Unleaded 98')).toBe('super');
    expect(qldFuelKind('Diesel')).toBe('diesel');
    expect(qldFuelKind('Premium Diesel')).toBe('premium-diesel');
    expect(qldFuelKind('LPG')).toBe('lpg');
    expect(qldFuelKind('OPAL')).toBeNull();
  });

  test('joins sites, brands, fuels and prices; out-of-stock prices are skipped', () => {
    const sites = { S: [{ S: 61401007, A: '123 FAKE ST, BRISBANE', N: 'METRO BRISBANE', B: 5, P: '4000', Lat: -27.47, Lng: 153.02 }] };
    const brands = { Brands: [{ BrandId: 5, Name: 'METRO PETROLEUM' }] };
    const fuels = { Fuels: [{ FuelId: 2, Name: 'Unleaded' }, { FuelId: 3, Name: 'Diesel' }, { FuelId: 4, Name: 'LPG' }] };
    const prices = {
      SitePrices: [
        { SiteId: 61401007, FuelId: 2, Price: 1859, TransactionDateUtc: '2026-11-04T01:15:00' },
        { SiteId: 61401007, FuelId: 3, Price: 9999, TransactionDateUtc: '2026-11-04T01:15:00' },
        { SiteId: 61401007, FuelId: 4, Price: 1099, TransactionDateUtc: '2026-11-05T01:15:00' },
      ],
    };
    const stations = buildQldStations(sites, brands, fuels, prices, NOW);
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ id: 'qld-61401007', region: 'qld', name: 'Metro Brisbane', brand: 'Metro Petroleum', postcode: '4000' });
    expect(stations[0]?.prices).toEqual({ regular: { p: 185.9, at: '2026-11-04T01:15:00.000Z' } });
  });
});

describe('published feed versions', () => {
  const station = (id: string, region: FeedStation['region'], lat: number, lng: number): FeedStation => ({
    id,
    region,
    name: id,
    brand: '',
    address: '',
    town: '',
    postcode: '',
    lat,
    lng,
    hours: null,
    tags: [],
    prices: { regular: { p: 170, at: NOW.toISOString() } },
  });
  const stations = [station('wa-1', 'wa', -31.95, 115.86), station('nsw-1', 'nsw', -33.87, 151.21), station('es-1', 'es', 40.42, -3.7), station('mx-1', 'mx', 19.43, -99.13)];
  const live: RegionStatus = { status: 'live', updatedAt: NOW.toISOString(), stationCount: 1, tomorrow: false };
  const regions = { wa: live, nsw: live, es: live, mx: live };

  test('the newest version carries every region; older versions only the regions their apps know', () => {
    expect(PUBLISHED_FEEDS.map((p) => p.version)).toEqual([LATEST_FEED_VERSION, 3, 2]);
    const [v4, v3, v2] = PUBLISHED_FEEDS.map((p) => feedForVersion(stations, regions, NOW, p));
    expect(v4?.meta.v).toBe(4);
    expect(Object.keys(v4?.meta.regions ?? {}).sort()).toEqual(['es', 'mx', 'nsw', 'wa']);
    expect(v4?.meta.stationCount).toBe(4);
    expect(v3?.meta.v).toBe(3);
    expect(Object.keys(v3?.meta.regions ?? {}).sort()).toEqual(['nsw', 'wa']);
    expect(v3?.tiles.flatMap((t) => t.stations).map((s) => s.region).sort()).toEqual(['nsw', 'wa']);
    expect(v2?.meta.v).toBe(2);
    expect(Object.keys(v2?.meta.regions ?? {})).toEqual(['wa']);
    expect(v2?.tiles.every((t) => t.v === 2)).toBe(true);
  });

  test('every region has a definition the app can show', () => {
    for (const id of ['qld', 'es', 'fr', 'mx'] as const) {
      const info = REGIONS[id];
      expect(info.id).toBe(id);
      expect(info.fuels.some((f) => f.kind === 'regular')).toBe(true);
      expect(info.cities.length).toBeGreaterThan(3);
      expect(info.source.credit).toMatch(/^(Prices (from|reported to)|Based on data provided by) /);
    }
    expect(REGIONS.es.priceDecimals).toBe(3);
    expect(REGIONS.fr.priceDecimals).toBe(3);
    expect(REGIONS.mx.priceDecimals).toBe(2);
    expect(REGIONS.mx.priceMode).toBe('current');
    expect(REGIONS.es.priceMode).toBe('current');
    expect(REGIONS.fr.pricesStand).toBe(true);
    expect(REGIONS.qld.pricesStand).toBe(true);
  });
});

describe('Portugal (DGEG Preços dos Combustíveis)', () => {
  const NOW = new Date('2026-11-08T21:00:00Z');
  const rows = [
    { Id: 87129, Nome: 'INTERMARCHÉ VIALONGA', TipoPosto: 'Área comercial (Hipermercados)', Municipio: 'Vila Franca de Xira', Preco: '0,899 €', Marca: 'INTERMARCHÉ', Combustivel: 'GPL Auto', DataAtualizacao: '2026-11-03 10:35', Distrito: 'Lisboa', Morada: 'Urb. Terras Compridas, Lote 8\nESTRADA DA VÁRZEA', Localidade: 'Vialonga', CodPostal: '2625-716', Latitude: 38.86376, Longitude: -9.09955 },
    { Id: 87129, Nome: 'INTERMARCHÉ VIALONGA', TipoPosto: 'Área comercial (Hipermercados)', Municipio: 'Vila Franca de Xira', Preco: '1,949 €', Marca: 'INTERMARCHÉ', Combustivel: 'Gasolina simples 95', DataAtualizacao: '2026-11-03 10:35', Distrito: 'Lisboa', Morada: 'Urb. Terras Compridas, Lote 8', Localidade: 'Vialonga', CodPostal: '2625-716', Latitude: 38.86376, Longitude: -9.09955 },
    { Id: 87129, Nome: 'INTERMARCHÉ VIALONGA', TipoPosto: 'Área comercial (Hipermercados)', Municipio: 'Vila Franca de Xira', Preco: '2,119 €', Marca: 'INTERMARCHÉ', Combustivel: 'Gasolina 98', DataAtualizacao: '2026-11-03 10:35', Distrito: 'Lisboa', Morada: 'Urb. Terras Compridas, Lote 8', Localidade: 'Vialonga', CodPostal: '2625-716', Latitude: 38.86376, Longitude: -9.09955 },
    { Id: 87129, Nome: 'INTERMARCHÉ VIALONGA', TipoPosto: 'Área comercial (Hipermercados)', Municipio: 'Vila Franca de Xira', Preco: '2,099 €', Marca: 'INTERMARCHÉ', Combustivel: 'Gasolina especial 98', DataAtualizacao: '2026-11-03 10:35', Distrito: 'Lisboa', Morada: 'Urb. Terras Compridas, Lote 8', Localidade: 'Vialonga', CodPostal: '2625-716', Latitude: 38.86376, Longitude: -9.09955 },
    { Id: 87129, Nome: 'INTERMARCHÉ VIALONGA', TipoPosto: 'Área comercial (Hipermercados)', Municipio: 'Vila Franca de Xira', Preco: '1,399 €', Marca: 'INTERMARCHÉ', Combustivel: 'Gasóleo colorido', DataAtualizacao: '2026-11-03 10:35', Distrito: 'Lisboa', Morada: 'Urb. Terras Compridas, Lote 8', Localidade: 'Vialonga', CodPostal: '2625-716', Latitude: 38.86376, Longitude: -9.09955 },
    { Id: 500, Nome: 'POSTO DA AUTO-ESTRADA', TipoPosto: 'Auto-estrada', Municipio: 'Ponta Delgada', Preco: '1,759 €', Marca: 'GALP', Combustivel: 'Gasóleo simples', DataAtualizacao: '2026-11-08 19:30', Distrito: 'Açores', Morada: 'EN1', Localidade: 'Ponta Delgada', CodPostal: '9500-000', Latitude: 37.74, Longitude: -25.67 },
    { Id: 501, Nome: 'TYPO', TipoPosto: 'Outro', Municipio: 'Faro', Preco: '17,590 €', Marca: 'BP', Combustivel: 'Gasóleo simples', DataAtualizacao: '2026-11-08 09:00', Distrito: 'Faro', Morada: 'Rua A', Localidade: 'Faro', CodPostal: '8000-000', Latitude: 37.02, Longitude: -7.93 },
    { Id: 502, Nome: 'SPAIN', TipoPosto: 'Outro', Municipio: 'Madrid', Preco: '1,500 €', Marca: 'REPSOL', Combustivel: 'Gasóleo simples', DataAtualizacao: '2026-11-08 09:00', Distrito: 'Madrid', Morada: 'Calle', Localidade: 'Madrid', CodPostal: '28001', Latitude: 40.42, Longitude: -3.7 },
  ];

  test('euro prices to cents and Lisbon or Azores time to UTC', () => {
    expect(ptPrice('1,769 €')).toBe(176.9);
    expect(ptPrice('0,899 €/litro')).toBe(89.9);
    expect(ptPrice('17,590 €')).toBeNull();
    expect(parsePtTime('2026-11-06 10:30', NOW)).toBe('2026-11-06T10:30:00.000Z'); // winter: Lisbon is on UTC
    expect(parsePtTime('2026-07-06 10:30', NOW)).toBe('2026-07-06T09:30:00.000Z'); // summer: UTC+1
    expect(parsePtTime('2026-11-08 19:30', NOW, -25.67)).toBe('2026-11-08T20:30:00.000Z'); // the Azores, an hour behind
    expect(parsePtTime('2026-11-09 10:00', NOW)).toBeNull(); // the future
  });

  test('groups rows into stations, keeps the cheaper of two 98s, drops farm diesel, typos and stations outside Portugal', () => {
    const stations = buildPtStations(rows, NOW);
    expect(stations.map((s) => s.id)).toEqual(['pt-87129', 'pt-500']);
    const first = stations[0] as FeedStation;
    expect(first.name).toBe('Intermarché Vialonga');
    expect(first.address).toBe('Urb. Terras Compridas, Lote 8, Estrada da Várzea');
    expect(first.tags).toEqual(['supermarket']);
    expect(first.prices).toEqual({
      lpg: { p: 89.9, at: '2026-11-03T10:35:00.000Z' },
      regular: { p: 194.9, at: '2026-11-03T10:35:00.000Z' },
      super: { p: 209.9, at: '2026-11-03T10:35:00.000Z' },
    });
    expect(stations[1]?.tags).toEqual(['motorway']);
    expect(stations[1]?.prices.diesel?.at).toBe('2026-11-08T20:30:00.000Z');
  });
});
