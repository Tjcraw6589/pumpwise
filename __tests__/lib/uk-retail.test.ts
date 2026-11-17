import { buildUkRetailStations, ukRetailPlace, ukRetailPrice, ukRetailTime } from '../../scripts/feed/sources/uk-retail.ts';

const NOW = new Date('2026-11-17T12:00:00Z');

describe('United Kingdom: the retailers\' own price files', () => {
  it('reads the file time as UK clock time, summer and winter, and refuses the future', () => {
    expect(ukRetailTime('17/11/2026 11:00:00', NOW)).toBe('2026-11-17T11:00:00.000Z');
    expect(ukRetailTime('01/07/2026 11:00:00', NOW)).toBe('2026-07-01T10:00:00.000Z');
    expect(ukRetailTime('18/11/2026 11:00:00', NOW)).toBeNull();
    expect(ukRetailTime('2026-11-17', NOW)).toBeNull();
  });

  it('keeps pence as they are and drops impossible prices', () => {
    expect(ukRetailPrice(159.7)).toBe(159.7);
    expect(ukRetailPrice('161.9')).toBe(161.9);
    expect(ukRetailPrice(1.6)).toBeNull();
    expect(ukRetailPrice(1599)).toBeNull();
  });

  it('splits an address into street and town, leaving the postcode out', () => {
    expect(ukRetailPlace('Abbey Park - North London Road, Coventry', 'CV3 4AR')).toEqual({ street: 'Abbey Park - North London Road', town: 'Coventry' });
    expect(ukRetailPlace('Main Road, Lydney, GL15 6BE', 'GL15 6BE')).toEqual({ street: 'Main Road', town: 'Lydney' });
    expect(ukRetailPlace('Westside Road', 'GX11 1AA')).toEqual({ street: 'Westside Road', town: '' });
  });

  const file = (updated: string) => ({
    last_updated: updated,
    stations: [
      { site_id: 'gcqfn1wd5k4j', brand: 'Asda', address: 'Abbey Park - North London Road, Coventry', postcode: 'CV3 4AR', location: { latitude: 52.3914, longitude: -1.4868 }, prices: { E10: 159.7, B7: 189.7, SDV: 206.9, E5: 176.9 } },
      // Gibraltar, in one retailer's file: not the United Kingdom.
      { site_id: 'eykjw5bzy2zk', brand: 'Morrisons', address: 'Westside Road', postcode: 'GX11 1AA', location: { longitude: '-5.360020161', latitude: '36.14498138' }, prices: { E10: 122.0 } },
      { site_id: 'noprices', brand: 'Asda', address: 'High Street, Leeds', postcode: 'LS1 1AA', location: { latitude: 53.8, longitude: -1.55 }, prices: { E10: 0 } },
    ],
  });

  it('builds stations with the file\'s time on every price', () => {
    const stations = buildUkRetailStations(file('17/11/2026 11:00:00'), 'asda', 'Asda', NOW);
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({ id: 'uk-asda-gcqfn1wd5k4j', region: 'uk', name: 'Asda Coventry', brand: 'Asda', address: 'Abbey Park - North London Road', town: 'Coventry', postcode: 'CV3 4AR' });
    const at = '2026-11-17T11:00:00.000Z';
    expect(stations[0]?.prices).toEqual({ regular: { p: 159.7, at }, diesel: { p: 189.7, at }, 'premium-diesel': { p: 206.9, at }, premium: { p: 176.9, at } });
  });

  it('leaves out a file the retailer has stopped updating', () => {
    expect(buildUkRetailStations(file('29/04/2026 11:18:22'), 'tesco', 'Tesco', NOW)).toEqual([]);
    expect(buildUkRetailStations(file('15/11/2026 11:59:00'), 'moto', 'Moto', NOW)).toEqual([]);
    expect(buildUkRetailStations({ stations: [] }, 'x', 'X', NOW)).toEqual([]);
  });
});
