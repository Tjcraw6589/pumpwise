import { type FeedStation } from '@/lib/feed';

import { SI_POSTCODES } from '../../scripts/feed/sources/si-postcodes.ts';
import { buildSiStations, fillSiTowns, SI_URL, siBrand, siHours, siNextUrl, siPrice, siTidy } from '../../scripts/feed/sources/si.ts';

const NOW = new Date('2026-11-15T09:30:00Z');
const AT = '2026-11-15T09:30:00.000Z';

/** Every price key goriva.si sends, in the order it sends them, all empty unless given. */
function prices(given: Record<string, number | null>): Record<string, number | null> {
  return { '95': null, dizel: null, '98': null, '100': null, 'dizel-premium': null, 'avtoplin-lpg': null, KOEL: null, hvo: null, cng: null, lng: null, ...given };
}

describe('Slovenia (goriva.si)', () => {
  const rows = [
    {
      pk: 2048,
      franchise: 1,
      name: 'PETROL LJUBLJANA - TIVOLSKA',
      address: 'TIVOLSKA CESTA 43',
      lat: 46.0580724,
      lng: 14.50344546,
      prices: prices({ '95': 1.506, '100': 1.84, dizel: 1.848, 'dizel-premium': 2.295, 'avtoplin-lpg': 1.153, KOEL: 1.471, hvo: 1.999, cng: 1.6, lng: 1.7 }),
      distance: null,
      direction: '',
      open_hours: '00:00-23:59\n',
      zip_code: '1000',
    },
    {
      // Both 98 and 100 listed: 100 is the one shown.
      pk: 2268,
      franchise: 9,
      name: 'BS Pesniška vrata',
      address: 'Pesnica pri Mariboru 32e',
      lat: 46.601243,
      lng: 15.674333,
      prices: prices({ '95': 1.506, '98': 1.876, '100': 1.899, dizel: 1.848 }),
      open_hours: 'Ponedeljek, Torek, Sreda, Četrtek, Petek\n06:00-22:00\n\nSobota\n07:00-21:00\n\nNedelja, Praznik\n07:00-21:00\n',
      zip_code: '2211',
    },
    {
      // Only 98: it stands in for super.
      pk: 3001,
      franchise: 19,
      name: 'Tankomat Sežana',
      address: 'Cesta na Lenivec 32',
      lat: 45.7087287902832,
      lng: 13.8604755401611,
      prices: prices({ '98': 1.88, dizel: 1.848 }),
      open_hours: '24 ur - črpalka brez osebja',
      zip_code: '6210',
    },
    {
      // Shell's 0.001 stands for "no price": dropped, the diesel kept.
      pk: 2258,
      franchise: 5,
      name: 'SHELL KOPER',
      address: 'SERMIN 7C',
      lat: 45.552486,
      lng: 13.762092,
      prices: prices({ '95': 0.001, dizel: 1.848 }),
      open_hours: 'neprenehoma 24/7',
      zip_code: '6000',
    },
    {
      // Nothing but a placeholder and heating oil: no station.
      pk: 2259,
      franchise: 5,
      name: 'SHELL AJDOVŠČINA',
      address: 'MIRCE 20',
      lat: 45.883317,
      lng: 13.891954,
      prices: prices({ '95': 0.001, KOEL: 1.471 }),
      open_hours: '',
      zip_code: '5270',
    },
    {
      // On the Croatian border, east of the boxes the app uses to tell the two countries apart: still kept.
      pk: 2313,
      franchise: 14,
      name: 'West Oil BS Zavrč',
      address: 'Zavrč 8c',
      lat: 46.3896077,
      lng: 16.05135585,
      prices: prices({ '95': 1.473, dizel: 1.463, KOEL: 1.099 }),
      direction: 'PTUJ',
      open_hours: '06:00-22:00\n',
      zip_code: '2283',
    },
    { pk: 4002, franchise: 1, name: 'PETROL NIČ', address: 'X', lat: 0, lng: 0, prices: prices({ '95': 1.5 }), open_hours: '', zip_code: '1000' }, // no position
    { pk: 4003, franchise: 1, name: 'PETROL DUNAJ', address: 'X', lat: 48.2, lng: 16.37, prices: prices({ '95': 1.5 }), open_hours: '', zip_code: '1000' }, // Vienna
    { pk: 4004, franchise: 1, name: 'PETROL BENETKE', address: 'X', lat: 45.44, lng: 12.33, prices: prices({ '95': 1.5 }), open_hours: '', zip_code: '1000' }, // Venice
    { pk: 4005, franchise: 1, name: 'PETROL BREZ', address: 'X', lat: null, lng: 14.5, prices: prices({ '95': 1.5 }), open_hours: '', zip_code: '1000' },
    {
      // A company Pumpwise has no sign name for, a postcode with no post office and free text hours.
      pk: 2333,
      franchise: 21,
      name: '',
      address: 'CESTA IX. KORPUSA 67',
      lat: 46.25,
      lng: 15.3,
      prices: prices({ 'avtoplin-lpg': 1.133 }),
      open_hours: 'PON. - PET. 8.00 -18.00\r\nSOB. 8.00 -1600\r\nNEDELJE IN PRAZNIKI - ZAPRTO',
      zip_code: '9999',
    },
    { pk: 2334, franchise: 77, name: 'BS MOL PAY&GO TRŽIČ', address: 'Cesta Ste Marie aux mines 7', lat: 46.358642, lng: 14.298618, prices: prices({ dizel: 3.2, '95': 1.486 }), open_hours: null, zip_code: null },
    {
      // Every M – ENERGIJA station carries the Maxen sign.
      pk: 2246,
      franchise: 3,
      name: 'BS MAXEN LJUBLJANA-BTC',
      address: 'Argentinska ulica bš',
      lat: 46.0665824,
      lng: 14.5488544,
      prices: prices({ '95': 1.506, dizel: 1.848 }),
      open_hours: '24/7',
      zip_code: '1000',
    },
    {
      // The postcode and the place written into the street, and no postcode of its own.
      pk: 2342,
      franchise: 5,
      name: 'SHELL SENOŽETI',
      address: 'Senožeti 93, 1262 Senožeti',
      lat: 46.088862059954124,
      lng: 14.716871893530739,
      prices: prices({ '95': 1.506, '100': 1.849, dizel: 1.848, 'dizel-premium': 2.289 }),
      open_hours: 'Mon-Sat: 6-22h, Sun: 8-20h',
      zip_code: '',
    },
    { pk: 2048, franchise: 1, name: 'A SECOND COPY', address: 'X', lat: 46.05, lng: 14.5, prices: prices({ '95': 1.9 }), open_hours: '', zip_code: '1000' }, // the same station on a later page
    null,
    'rubbish',
  ];

  const stations = buildSiStations(rows, NOW);
  const byId = (id: string): FeedStation => stations.find((s) => s.id === id) as FeedStation;

  test('keeps stations with a believable price and a position in Slovenia', () => {
    expect(stations.map((s) => s.id)).toEqual(['si-2048', 'si-2268', 'si-3001', 'si-2258', 'si-2313', 'si-2333', 'si-2334', 'si-2246', 'si-2342']);
    expect(stations.every((s) => s.region === 'si')).toBe(true);
    expect(byId('si-2313')).toMatchObject({ name: 'West Oil BS Zavrč', brand: 'West oil', town: 'Zavrč', lat: 46.38961, lng: 16.05136 });
    expect(byId('si-2313').prices).toEqual({ regular: { p: 147.3, at: AT }, diesel: { p: 146.3, at: AT } });
  });

  test('maps prices by key, in cents, stamped with the fetch time', () => {
    expect(byId('si-2048').prices).toEqual({
      regular: { p: 150.6, at: AT },
      super: { p: 184, at: AT },
      diesel: { p: 184.8, at: AT },
      'premium-diesel': { p: 229.5, at: AT },
      lpg: { p: 115.3, at: AT },
      hvo: { p: 199.9, at: AT },
    });
    // The key "lng" inside prices is liquefied gas, not the longitude.
    expect(byId('si-2048')).toMatchObject({ lat: 46.05807, lng: 14.50345 });
  });

  test('super is 100 octane, or 98 where there is no 100', () => {
    expect(byId('si-2268').prices.super).toEqual({ p: 189.9, at: AT });
    expect(byId('si-3001').prices).toEqual({ super: { p: 188, at: AT }, diesel: { p: 184.8, at: AT } });
  });

  test('drops the 0.001 placeholder and prices out of range', () => {
    expect(byId('si-2258').prices).toEqual({ diesel: { p: 184.8, at: AT } });
    expect(byId('si-2334').prices).toEqual({ regular: { p: 148.6, at: AT } });
    expect(stations.find((s) => s.id === 'si-2259')).toBeUndefined();
    expect(siPrice(0.001)).toBeNull();
    expect(siPrice(0.005)).toBeNull();
    expect(siPrice(0.49)).toBeNull();
    expect(siPrice(3.01)).toBeNull();
    expect(siPrice(null)).toBeNull();
    expect(siPrice(0.5)).toBe(50);
    expect(siPrice(3)).toBe(300);
    expect(siPrice('1.506')).toBe(150.6);
  });

  test('tidies names and addresses, keeping Slovenian letters', () => {
    expect(byId('si-2048')).toMatchObject({ name: 'Petrol Ljubljana - Tivolska', address: 'Tivolska cesta 43' });
    expect(byId('si-2268')).toMatchObject({ name: 'BS Pesniška vrata', address: 'Pesnica pri Mariboru 32e' });
    expect(byId('si-2258')).toMatchObject({ name: 'Shell Koper', address: 'Sermin 7C' });
    expect(byId('si-2334').name).toBe('BS MOL Pay&Go Tržič');
    expect(byId('si-2333')).toMatchObject({ name: 'Mini Marketing', address: 'Cesta IX. Korpusa 67' });
    expect(siTidy('PETROL ŠEMPETER PRI GORICI - PADLIH BORCEV')).toBe('Petrol Šempeter pri Gorici - Padlih Borcev');
    expect(siTidy('PETROL MARIBOR - NA POLJANAH')).toBe('Petrol Maribor - Na Poljanah');
    expect(siTidy('NA POLJANAH 10')).toBe('Na Poljanah 10');
    expect(siTidy('PETROL MOST NA SOČI')).toBe('Petrol Most na Soči');
    expect(siTidy('ČUFARJEVA  CESTA 10 ')).toBe('Čufarjeva cesta 10');
    expect(siTidy('C.SVOBODE 35')).toBe('C.Svobode 35');
    expect(siTidy('zwittrova ulica B.H.')).toBe('Zwittrova ulica B.H.');
    // Long words left in capitals inside mixed text are tidied; short ones are mostly initials and stay.
    expect(siTidy('SHELL MURSKA SOBOTA Lendavska')).toBe('Shell Murska Sobota Lendavska');
    expect(siTidy('DISCONT OiL - BS Maribor')).toBe('Discont OiL - BS Maribor');
    expect(siTidy('West Oil BS Zavrč')).toBe('West Oil BS Zavrč');
    expect(siTidy('BS MAXEN LJUBLJANA-BTC')).toBe('BS Maxen Ljubljana-BTC');
    expect(siTidy('CESTA II. GRUPE ODREDOV 48')).toBe('Cesta II. Grupe Odredov 48');
    expect(siTidy('')).toBe('');
  });

  test('maps the franchise number to a brand', () => {
    expect(byId('si-2048').brand).toBe('Petrol');
    expect(byId('si-2258').brand).toBe('Shell');
    expect(byId('si-2334').brand).toBe('');
    expect([1, 2, 4, 5, 12].map(siBrand)).toEqual(['Petrol', 'MOL', 'MOL', 'Shell', 'INA']);
    expect(siBrand(3)).toBe('Maxen');
    expect(byId('si-2246')).toMatchObject({ name: 'BS Maxen Ljubljana-BTC', brand: 'Maxen' });
    expect(siBrand(15)).toBe('Discont Oil');
    expect(siBrand(6)).toBe('Eko-Nafta');
    expect(siBrand(10)).toBe('Butan plin');
    expect(siBrand(19)).toBe('Logo Bencinski Servisi');
    expect(siBrand(21)).toBe('Mini Marketing');
    expect(siBrand(27)).toBe('Avtotransport Kovačič');
    expect(siBrand(30)).toBe('Kaolje');
    expect(siBrand(8)).toBe('');
    expect(siBrand(null)).toBe('');
  });

  test('gives the town from the postcode', () => {
    expect(byId('si-2048')).toMatchObject({ postcode: '1000', town: 'Ljubljana' });
    expect(byId('si-2268')).toMatchObject({ postcode: '2211', town: 'Pesnica pri Mariboru' });
    expect(byId('si-3001')).toMatchObject({ postcode: '6210', town: 'Sežana' });
    expect(byId('si-2258')).toMatchObject({ postcode: '6000', town: 'Koper/Capodistria' });
    expect(byId('si-2333')).toMatchObject({ postcode: '9999', town: '' });
    expect(byId('si-2334')).toMatchObject({ postcode: '', town: '' });
    // No postcode of its own: the one written into the street is used, and taken out of the street.
    expect(byId('si-2342')).toMatchObject({ address: 'Senožeti 93', postcode: '1262', town: 'Dol pri Ljubljani' });
    const row = (address: string, zip: string) => ({ pk: 1, franchise: 5, name: 'X', address, lat: 46.05, lng: 14.5, prices: prices({ dizel: 1.848 }), open_hours: '', zip_code: zip });
    expect(buildSiStations([row('Mirnopeška 4, 8000 Novo Mesto', '8000')], NOW)[0]).toMatchObject({ address: 'Mirnopeška 4', postcode: '8000', town: 'Novo mesto' });
    // Not a postcode the table knows, or not at the end: the street is left alone.
    expect(buildSiStations([row('Cesta 5, 9999 Nikjer', '')], NOW)[0]).toMatchObject({ address: 'Cesta 5, 9999 Nikjer', postcode: '', town: '' });
    expect(buildSiStations([row('3211 Arclin – Škofja Vas, Arclin 101', '3211')], NOW)[0]).toMatchObject({ address: '3211 Arclin – Škofja Vas, Arclin 101', postcode: '3211', town: 'Škofja vas' });
  });

  test('the postcode table covers the country with tidy names', () => {
    expect(Object.keys(SI_POSTCODES).length).toBeGreaterThan(450);
    expect(Object.keys(SI_POSTCODES).every((code) => /^\d{4}$/.test(code))).toBe(true);
    expect(Object.values(SI_POSTCODES).every((name) => name.trim() === name && name.length > 1 && !/dostava|predali|\(/.test(name))).toBe(true);
    expect(SI_POSTCODES['2000']).toBe('Maribor');
    expect(SI_POSTCODES['5290']).toBe('Šempeter pri Gorici');
    expect(SI_POSTCODES['4290']).toBe('Tržič');
    expect(SI_POSTCODES['8340']).toBe('Črnomelj');
  });

  test('reads hours that are plainly open all day, every day', () => {
    const allDay = Array(7).fill('24h');
    expect(byId('si-2048').hours).toEqual(allDay);
    expect(byId('si-3001').hours).toEqual(allDay);
    expect(byId('si-2258').hours).toEqual(allDay);
    expect(byId('si-2246').hours).toEqual(allDay);
    expect(siHours('0-24')).toEqual(allDay);
    expect(siHours('24 ur')).toEqual(allDay);
    expect(siHours('00:00 - 24:00')).toEqual(allDay);
    expect(siHours('10-24')).toBeNull();
    expect(siHours('24 ure na dan')).toBeNull();
  });

  test("reads the portal's own layout of days and times", () => {
    expect(byId('si-2268').hours).toEqual(['0600-2200', '0600-2200', '0600-2200', '0600-2200', '0600-2200', '0700-2100', '0700-2100']);
    // One line of times with no days: the same hours every day.
    expect(byId('si-2313').hours).toEqual(Array(7).fill('0600-2200'));
    expect(siHours('09:00-12:30, 13:00-17:00\n')).toEqual(Array(7).fill('0900-1700'));
    // A day the text leaves out stays unknown, and a split day runs from its first opening to its last closing.
    expect(siHours('Ponedeljek, Torek, Sreda, Četrtek, Petek\n07:00-20:00\n\nSobota\n07:00-10:30, 11:00-13:00\n')).toEqual(['0700-2000', '0700-2000', '0700-2000', '0700-2000', '0700-2000', '0700-1300', 'unknown']);
    expect(siHours('Ponedeljek, Torek\n00:00-23:59\n')).toEqual(['24h', '24h', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown']);
    // Shifts that meet at midnight are one whole day, and 00:00-00:00 is midnight to midnight.
    expect(siHours('Ponedeljek, Torek, Sreda, Četrtek, Petek\n00:00-06:00, 06:00-21:00, 21:00-00:00\n\nSobota\n06:00-00:00\n\nNedelja, Praznik\n00:00-00:00\n')).toEqual(['24h', '24h', '24h', '24h', '24h', '0600-2359', '24h']);
    // "In force since" lines are passed over once the date has come.
    const since = '01.09.2025 – \nPonedeljek, Torek, Sreda, Četrtek, Petek, Sobota\n05:00-22:00\n\n01.09.2025 – \nNedelja, Praznik\n05:00-15:00\n';
    expect(siHours(since, NOW)).toEqual(['0500-2200', '0500-2200', '0500-2200', '0500-2200', '0500-2200', '0500-2200', '0500-1500']);
    expect(siHours(since, new Date('2025-08-01T00:00:00Z'))).toBeNull();
    // Holiday hours alone say nothing about the week.
    expect(siHours('Praznik\n08:00-12:00\n\nSobota\n07:00-13:00\n')).toEqual(['unknown', 'unknown', 'unknown', 'unknown', 'unknown', '0700-1300', 'unknown']);
    expect(siHours('Praznik\n08:00-12:00\n\nPraznik\n13:00-15:00\n')).toBeNull();
  });

  test('gives no hours rather than guess at text typed in another way', () => {
    expect(byId('si-2333').hours).toBeNull();
    expect(byId('si-2334').hours).toBeNull();
    expect(byId('si-2342').hours).toBeNull();
    expect(siHours('')).toBeNull();
    expect(siHours('Pon - Pet.:  6-22\r\nSob: 7-21 \r\nNed.: 8-20')).toBeNull();
    expect(siHours('Ponedeljek - Sobota 6:00 - 22:00\r\n\r\nNedelja 8:00 - 20:00')).toBeNull();
    expect(siHours('Odpiralni čas:\r\nPonedeljek - petek: 07:00 - 20:00\r\nSobota: 07:00 - 19:00')).toBeNull();
    expect(siHours('VSAK DAN 5,30 do 22,30')).toBeNull();
    // Two sets of hours for one day (summer and winter), months in place of days, times that run backwards.
    expect(siHours('Sobota\n07:00-13:00\n\nSobota\n08:00-12:00\n')).toBeNull();
    expect(siHours('Januar / Februar / Marec\n07:00-19:00\n\nApril / Maj\n07:00-20:00\n')).toBeNull();
    expect(siHours('Ponedeljek\n22:00-06:00\n')).toBeNull();
    expect(siHours('Ponedeljek\n25:00-26:00\n')).toBeNull();
    expect(siHours('Ponedeljek, Torek\n')).toBeNull();
    expect(siHours('Ponedeljek\n06:00-22:00\nSobota\n')).toBeNull();
    expect(siHours('01.06.2027 – 31.08.2027\nPonedeljek\n06:00-22:00\n')).toBeNull();
  });

  test('tags stations with no staff', () => {
    expect(byId('si-3001').tags).toEqual(['unmanned']);
    expect(byId('si-2048').tags).toEqual([]);
    expect(byId('si-2258').tags).toEqual([]);
  });

  test('follows only https pages on goriva.si', () => {
    expect(SI_URL).toBe('https://goriva.si/api/v1/search/?format=json');
    expect(siNextUrl('https://goriva.si/api/v1/search/?format=json&page=2')).toBe('https://goriva.si/api/v1/search/?format=json&page=2');
    expect(siNextUrl(null)).toBeNull();
    expect(() => siNextUrl('http://goriva.si/api/v1/search/?format=json&page=2')).toThrow('unexpected next page');
    expect(() => siNextUrl('https://goriva.si.example.com/api/v1/search/?page=2')).toThrow('unexpected next page');
    expect(() => siNextUrl('/api/v1/search/?page=2')).toThrow('unexpected next page');
    expect(() => siNextUrl(2)).toThrow('unexpected next page');
  });
});

test('a station with no usable postcode takes the town of the nearest station that has one', () => {
  const base = { region: 'si' as const, name: 'X', brand: '', address: '', postcode: '', hours: null, tags: [], prices: {} };
  const stations = [
    { ...base, id: 'si-1', town: 'Kamnik', lat: 46.2259, lng: 14.6121 },
    { ...base, id: 'si-2', town: '', lat: 46.23, lng: 14.61 }, // 500 m away
    { ...base, id: 'si-3', town: '', lat: 45.55, lng: 13.73 }, // Koper, far from any named station
  ];
  const out = fillSiTowns(stations);
  expect(out[1]?.town).toBe('Kamnik');
  expect(out[2]?.town).toBe('');
});
