import { mxMunicipio } from '../../scripts/feed/sources/mx-municipios.ts';

describe('Mexico municipalities (offline INEGI boundaries)', () => {
  test.each([
    ['central Zapopan', 20.72, -103.39, 'Zapopan', 'Jalisco'],
    ['the Zócalo', 19.4326, -99.1332, 'Cuauhtémoc', 'Ciudad de México'],
    ['Cancún', 21.1619, -86.8515, 'Benito Juárez', 'Quintana Roo'],
    ['Tlaquepaque', 20.64, -103.31, 'San Pedro Tlaquepaque', 'Jalisco'],
    ['Mérida', 20.9674, -89.5926, 'Mérida', 'Yucatán'],
    ['Tijuana', 32.47641, -116.9214, 'Tijuana', 'Baja California'],
  ])('%s', (_place, lat, lng, municipio, estado) => {
    expect(mxMunicipio(lat, lng)).toEqual({ municipio, estado });
  });

  test('far out at sea, or outside Mexico, there is none', () => {
    expect(mxMunicipio(18.0, -110.0)).toBeNull(); // the Pacific
    expect(mxMunicipio(23.5, -91.0)).toBeNull(); // the Gulf of Mexico
    expect(mxMunicipio(35.0, -97.0)).toBeNull(); // Oklahoma
    expect(mxMunicipio(Number.NaN, -99)).toBeNull();
  });

  test('just off the coast, the nearest municipality within 3 km', () => {
    // The shore off Veracruz port is near -96.13 at this latitude: 2 km out counts, 8 km out does not.
    expect(mxMunicipio(19.2, -96.11)).toEqual({ municipio: 'Veracruz', estado: 'Veracruz de Ignacio de la Llave' });
    expect(mxMunicipio(19.2, -96.05)).toBeNull();
  });
});
