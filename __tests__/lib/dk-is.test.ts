import { buildDkStations, dkFuelKind, dkPrice, dkTime } from '../../scripts/feed/sources/dk.ts';
import { buildIsStations, isPrice, isTown } from '../../scripts/feed/sources/is.ts';

const NOW = new Date('2026-11-16T20:00:00Z');

describe('Denmark: the fuel companies\' public price APIs', () => {
  it('reads pump names as fuels', () => {
    expect(dkFuelKind('Blyfri 95')).toBe('regular');
    expect(dkFuelKind('Blyfri 95', 'Autobenzin', 95)).toBe('regular');
    expect(dkFuelKind('GoEasy 95 Extra E5')).toBe('premium');
    expect(dkFuelKind('Oktan 100')).toBe('super');
    expect(dkFuelKind('V-Power', 'Autobenzin', 98)).toBe('super');
    expect(dkFuelKind('Svovlfri Diesel')).toBe('diesel');
    expect(dkFuelKind('FuelSave Diesel', 'Autodiesel')).toBe('diesel');
    expect(dkFuelKind('V-Power Diesel', 'Autodiesel')).toBe('premium-diesel');
    expect(dkFuelKind('Neste MY (HVO100)')).toBe('hvo');
    expect(dkFuelKind('AdBlue')).toBeNull();
    expect(dkFuelKind('HPC')).toBeNull();
    expect(dkFuelKind('Blyfri 92')).toBeNull();
  });

  it('writes kroner as hundredths and drops mistakes', () => {
    expect(dkPrice(16.09)).toBe(1609);
    expect(dkPrice('18.39')).toBe(1839);
    expect(dkPrice(1.6)).toBeNull();
    expect(dkPrice(160.9)).toBeNull();
    expect(dkPrice(null)).toBeNull();
  });

  it('reads times as UTC with or without the Z, and refuses the future', () => {
    expect(dkTime('2026-11-16T10:50:00.000', NOW)).toBe('2026-11-16T10:50:00.000Z');
    expect(dkTime('2026-11-16T10:50:00Z', NOW)).toBe('2026-11-16T10:50:00.000Z');
    expect(dkTime('2026-11-17T10:50:00Z', NOW)).toBeNull();
    expect(dkTime('', NOW)).toBeNull();
  });

  it('builds stations from OK\'s layout', () => {
    const items = [
      {
        facility_number: 1034,
        street: 'Bramhalevej',
        house_number: '2',
        postal_code: 6100,
        city: 'Haderslev',
        coordinates: { latitude: 55.295925, longitude: 9.424641 },
        last_updated_time: '2026-11-16T09:00:00Z',
        prices: [
          { product_name: 'Blyfri 95', price: 16.09 },
          { product_name: 'Svovlfri Diesel', price: 18.29 },
          { product_name: 'Oktan 100', price: 18.59 },
          { product_name: 'AdBlue', price: 10.14 },
        ],
      },
      // Flensburg, across the border: not Denmark.
      { facility_number: 9, street: 'x', house_number: '1', postal_code: 1, city: 'Flensburg', coordinates: { latitude: 54.78, longitude: 9.43 }, last_updated_time: '2026-11-16T09:00:00Z', prices: [{ product_name: 'Blyfri 95', price: 16 }] },
      { facility_number: 10, street: 'y', coordinates: { latitude: 55.3, longitude: 9.4 }, last_updated_time: '2026-11-16T09:00:00Z', prices: [{ product_name: 'AdBlue', price: 10 }] },
    ];
    const stations = buildDkStations(items, 'OK', 'ok', NOW);
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({
      id: 'dk-ok-1034',
      region: 'dk',
      name: 'OK Haderslev',
      brand: 'OK',
      address: 'Bramhalevej 2',
      town: 'Haderslev',
      postcode: '6100',
      lat: 55.29593,
      lng: 9.42464,
    });
    expect(stations[0]?.prices).toEqual({
      regular: { p: 1609, at: '2026-11-16T09:00:00.000Z' },
      diesel: { p: 1829, at: '2026-11-16T09:00:00.000Z' },
      super: { p: 1859, at: '2026-11-16T09:00:00.000Z' },
    });
  });

  it('builds stations from Shell\'s layout and keeps the cheaper of two fuels of a kind', () => {
    const items = [
      {
        stationId: 'D820',
        brand: 'Shell',
        owner: 'Shell',
        street: 'ØSTERGADE 1',
        houseNumber: null,
        postalCode: '4171',
        city: 'GLUMSØ',
        coordinates: { latitude: '55.353391', longitude: '11.691900' },
        prices: [
          { fuelType: 'Autodiesel', octane: null, productName: 'V-Power Diesel', price: '19.39', currency: 'DKK', lastUpdated: '2026-11-16T10:50:00.000' },
          { fuelType: 'Autobenzin', octane: '98', productName: 'V-Power', price: '18.69', currency: 'DKK', lastUpdated: '2026-11-16T10:50:00.000' },
          { fuelType: 'Autodiesel', octane: null, productName: 'FuelSave Diesel', price: '18.39', currency: 'DKK', lastUpdated: '2026-11-16T10:50:00.000' },
          { fuelType: 'Autodiesel', octane: null, productName: 'FuelSave Diesel Truck', price: '18.19', currency: 'DKK', lastUpdated: '2026-11-16T10:50:00.000' },
          { fuelType: 'Autobenzin', octane: '95', productName: 'Blyfri 95', price: '16.19', currency: 'DKK', lastUpdated: '2026-11-16T10:50:00.000' },
        ],
      },
    ];
    const [station] = buildDkStations(items, 'Shell', 'shell', NOW);
    expect(station).toMatchObject({ id: 'dk-shell-D820', name: 'Shell Glumsø', address: 'Østergade 1', town: 'Glumsø', postcode: '4171' });
    expect(station?.prices).toEqual({
      'premium-diesel': { p: 1939, at: '2026-11-16T10:50:00.000Z' },
      super: { p: 1869, at: '2026-11-16T10:50:00.000Z' },
      diesel: { p: 1819, at: '2026-11-16T10:50:00.000Z' },
      regular: { p: 1619, at: '2026-11-16T10:50:00.000Z' },
    });
  });
});

describe('Iceland: Gasvaktin', () => {
  it('writes krónur as hundredths and drops mistakes', () => {
    expect(isPrice(252.2)).toBe(25220);
    expect(isPrice(25.2)).toBeNull();
    expect(isPrice(null)).toBeNull();
  });

  it('files a station under the nearest town within 30 km', () => {
    expect(isTown(65.69913, -18.135231)).toBe('Akureyri');
    expect(isTown(64.14, -21.93)).toBe('Reykjavík');
    expect(isTown(64.8, -18.0)).toBe('');
  });

  it('builds stations and leaves out discounts and stations without a price', () => {
    const items = [
      { bensin95: 252.2, bensin95_discount: 240.1, company: 'Atlantsolía', diesel: 314.2, diesel_discount: null, geo: { lat: 65.69913, lon: -18.135231 }, key: 'ao_000', name: 'Baldursnes Akureyri' },
      { bensin95: null, bensin95_discount: null, company: 'N1', diesel: null, diesel_discount: null, geo: { lat: 64.1, lon: -21.9 }, key: 'n1_001', name: 'Nowhere' },
      { bensin95: 250, company: 'N1', diesel: 310, geo: { lat: 55.6, lon: 12.5 }, key: 'n1_002', name: 'Copenhagen by mistake' },
    ];
    const stations = buildIsStations(items, NOW);
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ id: 'is-ao_000', region: 'is', name: 'Atlantsolía Baldursnes Akureyri', brand: 'Atlantsolía', town: 'Akureyri' });
    expect(stations[0]?.prices).toEqual({ regular: { p: 25220, at: NOW.toISOString() }, diesel: { p: 31420, at: NOW.toISOString() } });
  });
});
