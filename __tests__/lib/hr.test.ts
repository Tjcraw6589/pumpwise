import { gzipSync } from 'node:zlib';

import { type FeedStation } from '@/lib/feed';

import { buildHrStations, HR_STALE_ROW_GAP, hrBrand, hrHours, hrJson, hrName, hrPlace, hrTidy } from '../../scripts/feed/sources/hr.ts';

const NOW = new Date('2026-11-15T23:00:00Z');
const AT = '2026-11-15T23:00:00.000Z';
/** The newest price row in the fixture; rows more than HR_STALE_ROW_GAP behind it have lapsed. */
const NEWEST = 5_951_964;

const day = (id: number, vrsta_dana_id: number, pocetak: string, kraj: string) => ({ id, vrsta_dana_id, pocetak, kraj });
const price = (id: number, gorivo_id: number, cijena: number) => ({ id, gorivo_id, cijena });

/** A cut-down copy of https://mzoe-gor.hr/data.gz with the oddities the live file has. */
const data = {
  gorivos: [
    { id: 12, naziv: 'EUROSUPER 95 CLASS PLUS', obveznik_id: 6, vrsta_goriva_id: 1, oznaka: null },
    { id: 777, naziv: 'EUROSUPER 95 CLASS PLUS PREMIUM', obveznik_id: 6, vrsta_goriva_id: 1, oznaka: null },
    { id: 779, naziv: 'EUROSUPER 100 CLASS PLUS PREMIUM', obveznik_id: 6, vrsta_goriva_id: 5, oznaka: null },
    { id: 15, naziv: 'EURODIZEL CLASS PLUS', obveznik_id: 6, vrsta_goriva_id: 7, oznaka: null },
    { id: 778, naziv: 'EURODIZEL CLASS PLUS PREMIUM', obveznik_id: 6, vrsta_goriva_id: 7, oznaka: null },
    { id: 340, naziv: 'Eurodiesel BS', obveznik_id: 7, vrsta_goriva_id: 8, oznaka: 'B7' },
    { id: 342, naziv: 'Eurosuper BS 95', obveznik_id: 7, vrsta_goriva_id: 2, oznaka: 'E5' },
    { id: 344, naziv: 'AUTOPLIN (UNP)', obveznik_id: 7, vrsta_goriva_id: 9, oznaka: null },
    { id: 600, naziv: 'Shell V-Power EuroSuper 100', obveznik_id: 20, vrsta_goriva_id: 6, oznaka: null },
    { id: 50, naziv: 'LOŽ ULJE', obveznik_id: 6, vrsta_goriva_id: 10, oznaka: null },
    { id: 51, naziv: 'PLAVI DIZEL', obveznik_id: 6, vrsta_goriva_id: 11, oznaka: null },
    { id: 52, naziv: 'PLIN U BOCI 10 KG', obveznik_id: 6, vrsta_goriva_id: 21, oznaka: null },
    { id: 53, naziv: 'BIODIZEL', obveznik_id: 6, vrsta_goriva_id: 13, oznaka: null },
    { id: 99, naziv: 'Testni benzin', obveznik_id: null, vrsta_goriva_id: null, oznaka: null },
  ],
  obvezniks: [
    { id: 6, naziv: 'INA – Industrija nafte d.d.', logo: 'ina.png' },
    { id: 7, naziv: 'LUKOIL Croatia d.o.o.', logo: null },
    { id: 9, naziv: 'Petrol d.o.o.', logo: null },
    { id: 20, naziv: 'Coral Croatia d.o.o.', logo: null },
    { id: 183, naziv: 'RIJEKA TRANS D.O.O. ', logo: null },
    { id: 41, naziv: 'Šola d.o.o.', logo: null },
  ],
  postajas: [
    {
      // The usual shape: "long" holds the latitude and "lat" the longitude.
      id: 1208,
      naziv: 'Zagreb - Slavonska sjever',
      adresa: 'Slavonska avenija 25',
      mjesto: 'Zagreb',
      obveznik_id: 6,
      long: '45.805451',
      lat: '16.084524',
      radnaVremena: [day(1, 1, '06:00:00', '21:00:00'), day(2, 2, '05:00:00', '24:00:00'), day(3, 3, '00:00:00', '24:00:00'), day(4, 4, '08:00:00', '12:00:00')],
      opcije: [],
      cjenici: [
        price(5_902_807, 12, 1.61),
        price(5_902_810, 779, 2.14),
        price(5_902_806, 15, 1.85),
        price(5_902_809, 778, 2.08),
        price(5_902_808, 777, 1.75),
        price(5_902_811, 50, 1.56), // heating oil
        price(5_902_812, 51, 1.38), // dyed diesel for farms and boats
        price(NEWEST, 52, 23.9), // a gas bottle
        price(5_902_813, 53, 1.7), // biodiesel
        price(5_902_814, 99, 1.5), // a product with no fuel type
        price(5_902_815, 4242, 1.5), // a product that is not in the list
      ],
      obavijesti: [],
      url: '1208-ina-industrija-nafte-d-d-zagreb-slavonska-sjever',
    },
    {
      // One of the two stations with the fields the right way round.
      id: 1431,
      naziv: 'BP MOKRICE',
      adresa: 'MOKRICE 180',
      mjesto: 'MOKRICE',
      obveznik_id: 7,
      long: '15.880329',
      lat: '46.004060',
      radnaVremena: [day(5, 1, '06:00:00', '22:00:00'), day(6, 3, '07:00:00', '19:00:00'), day(7, 4, '07:00:00', '19:00:00')],
      cjenici: [price(5_905_623, 340, 1.85), price(5_905_554, 342, 1.61), price(5_905_514, 344, 1.03)],
    },
    {
      // Latitude 47.7 is not in Croatia and nothing says what was meant.
      id: 1439,
      naziv: 'BP ŠIBENIK DUMBOKA',
      adresa: 'DUMBOKA 1',
      mjesto: 'ŠIBENIK',
      obveznik_id: 7,
      long: '47.718510',
      lat: '15.890620',
      radnaVremena: [],
      cjenici: [price(5_905_700, 342, 1.61)],
    },
    {
      // Degrees and minutes as text.
      id: 1033,
      naziv: 'Benzinska postaja Krašić',
      adresa: 'Krašić 1',
      mjesto: 'Krašić',
      obveznik_id: 9,
      long: "45° 39.4112' N",
      lat: "15° 31.2440' E",
      radnaVremena: [],
      cjenici: [price(5_905_701, 12, 1.61)],
    },
    { id: 804, naziv: 'PAN ENERGIJA', adresa: 'X', mjesto: 'Y', obveznik_id: 9, long: '', lat: '', radnaVremena: [], cjenici: [price(5_905_702, 12, 1.61)] },
    { id: 1436, naziv: 'BP Velika Gorica', adresa: 'X', mjesto: 'Y', obveznik_id: 9, long: null, lat: null, radnaVremena: [], cjenici: [price(5_905_703, 12, 1.61)] },
    {
      // A small operator: postcode typed into the town, no hours, and a mix of live and lapsed prices.
      id: 1245,
      naziv: 'PJ-OIL\t\t',
      adresa: 'LOPAR 285/A',
      mjesto: '51281 LOPAR',
      obveznik_id: 183,
      long: '44.834900',
      lat: '14.729700',
      radnaVremena: [],
      cjenici: [
        price(2_953_587, 12, 11.37), // kuna, from before 2023
        price(NEWEST - HR_STALE_ROW_GAP - 1, 12, 1.43), // believable, but the row lapsed long ago
        price(NEWEST - HR_STALE_ROW_GAP, 15, 1.85), // the oldest row still allowed
        price(5_905_800, 340, 1.85), // the same diesel price twice is not a premium grade
        price(5_905_801, 344, 0), // a zero
      ],
    },
    {
      // Only kuna prices left: the whole station goes.
      id: 906,
      naziv: 'Šola',
      adresa: 'Bjelovarska 1',
      mjesto: 'Bjelovar',
      obveznik_id: 41,
      long: '45.9078622',
      lat: '16.86159889999999',
      radnaVremena: [day(8, 1, '07:00:00', '19:00:00')],
      cjenici: [price(3_331_463, 12, 14.6), price(3_331_462, 15, 14.35), price(3_331_461, 344, 7.98)],
    },
    {
      // Shell (run by Coral Croatia): thousandths of a euro, a postcode after the street, open round the clock.
      id: 1178,
      naziv: 'Shell Varaždin',
      adresa: 'Optujska 1, 42000 Varaždin',
      mjesto: 'Varaždin',
      obveznik_id: 20,
      long: '46.3044',
      lat: '16.3378',
      radnaVremena: [day(9, 1, '00:00:00', '23:59:00'), day(10, 2, '00:00:00', '23:59:00'), day(11, 3, '00:00:00', '23:59:00')],
      cjenici: [price(5_950_001, 778, 2.208), price(5_950_002, 600, 2.218), price(5_950_003, 779, 2.25), price(5_950_004, 344, 0.999), price(5_950_005, 779, 3.01)],
    },
    {
      // No name: the brand stands in. A split workday, and no Sunday row.
      id: 1300,
      naziv: '  ',
      adresa: 'NIKOLE TESLE 133A',
      mjesto: 'ĐAKOVO',
      obveznik_id: 9,
      long: '45.3100',
      lat: '18.4100',
      radnaVremena: [day(12, 1, '06:00:00', '10:30:00'), day(13, 1, '17:00:00', '19:00:00'), day(14, 2, '06:00:00', '13:00:00')],
      cjenici: [price(5_950_010, 12, 1.61), price(5_950_011, 342, 1.61), price(5_950_012, 15, 1.85), price(5_950_013, 778, 1.9), price(5_950_014, 340, 2.05)],
    },
    // Vienna: both numbers parse, but neither order puts it in Croatia.
    { id: 2000, naziv: 'Wien', adresa: 'X', mjesto: 'Wien', obveznik_id: 9, long: '48.2082', lat: '16.3738', radnaVremena: [], cjenici: [price(5_950_020, 12, 1.61)] },
    // A map link where the longitude should be, as station 1245 has in the real file.
    { id: 2001, naziv: 'Link', adresa: 'X', mjesto: 'Y', obveznik_id: 9, long: null, lat: 'https://goo.gl/maps/TX3QLUNrgF5JrBUS8', radnaVremena: [], cjenici: [price(5_950_021, 12, 1.61)] },
    // The same station twice: the first one wins.
    { id: 1431, naziv: 'BP MOKRICE DRUGI PUT', adresa: 'X', mjesto: 'Y', obveznik_id: 7, long: '46.004060', lat: '15.880329', radnaVremena: [], cjenici: [price(5_950_022, 342, 1.99)] },
    // Ids that are not a station number.
    { id: -1, naziv: 'Minus', adresa: 'X', mjesto: 'Y', obveznik_id: 9, long: '45.8', lat: '16.0', radnaVremena: [], cjenici: [price(5_950_023, 12, 1.61)] },
    { id: 12.5, naziv: 'Half', adresa: 'X', mjesto: 'Y', obveznik_id: 9, long: '45.8', lat: '16.0', radnaVremena: [], cjenici: [price(5_950_024, 12, 1.61)] },
    { id: null, naziv: 'None', adresa: 'X', mjesto: 'Y', obveznik_id: 9, long: '45.8', lat: '16.0', radnaVremena: [], cjenici: [price(5_950_025, 12, 1.61)] },
    // Rows that are not objects at all.
    null,
    'postaja',
    [],
  ],
};

describe('Croatia (minGO, Ministry of Economy)', () => {
  const stations = buildHrStations(data, NOW);
  const byId = (id: string) => stations.find((s) => s.id === id) as FeedStation;

  test('keeps stations with a position and a current price, whichever way round the coordinates are', () => {
    expect(stations.map((s) => s.id)).toEqual(['hr-1208', 'hr-1431', 'hr-1245', 'hr-1178', 'hr-1300']);
    expect(byId('hr-1208')).toMatchObject({ region: 'hr', lat: 45.80545, lng: 16.08452 }); // swapped in the file
    expect(byId('hr-1431')).toMatchObject({ lat: 46.00406, lng: 15.88033 }); // the right way round in the file
    expect(buildHrStations(null, NOW)).toEqual([]);
    expect(buildHrStations({ postajas: 'no' }, NOW)).toEqual([]);
  });

  test('every station has a unique id, a place in Croatia and prices in euro cents with a valid time', () => {
    expect(new Set(stations.map((s) => s.id)).size).toBe(stations.length);
    expect(byId('hr-1431').name).toBe('BP Mokrice'); // not the second row with the same id
    for (const station of stations) {
      expect(station.id).toMatch(/^hr-\d+$/);
      expect(station.lat).toBeGreaterThan(42.3);
      expect(station.lat).toBeLessThan(46.6);
      expect(station.lng).toBeGreaterThan(13.4);
      expect(station.lng).toBeLessThan(19.5);
      const prices = Object.values(station.prices);
      expect(prices.length).toBeGreaterThan(0);
      for (const { p, at } of prices) {
        expect(p).toBeGreaterThanOrEqual(50);
        expect(p).toBeLessThanOrEqual(300);
        expect(new Date(at).toISOString()).toBe(at);
      }
    }
  });

  test('never throws on missing or mistyped fields', () => {
    const junk: unknown[] = [undefined, null, '', 'x', 0, -1, 1.5, NaN, true, [], {}, [null], '1,61', '25:61:00'];
    const station = data.postajas[0] as Record<string, unknown>;
    for (const value of junk) {
      expect(() => buildHrStations(value, NOW)).not.toThrow();
      for (const key of ['postajas', 'gorivos', 'obvezniks']) expect(() => buildHrStations({ ...data, [key]: value }, NOW)).not.toThrow();
      for (const key of Object.keys(station)) expect(() => buildHrStations({ ...data, postajas: [{ ...station, [key]: value }] }, NOW)).not.toThrow();
      const rows = { cjenici: [value, { id: value, gorivo_id: value, cijena: value }], radnaVremena: [value, { vrsta_dana_id: value, pocetak: value, kraj: value }] };
      expect(() => buildHrStations({ ...data, postajas: [{ ...station, ...rows }] }, NOW)).not.toThrow();
      expect(() => hrPlace(value, value)).not.toThrow();
      expect(() => hrHours(value)).not.toThrow();
    }
    // Numbers sent as text are still read.
    const asText = JSON.parse(JSON.stringify(data), (_key, value: unknown) => (typeof value === 'number' ? String(value) : value)) as unknown;
    expect(buildHrStations(asText, NOW)).toEqual(stations);
    // No fuel list: nothing can be priced, so nothing is kept.
    expect(buildHrStations({ ...data, gorivos: [] }, NOW)).toEqual([]);
  });

  test('splits 95 and diesel into basic and premium by price, and leaves out fuels that are not for cars', () => {
    expect(byId('hr-1208').prices).toEqual({
      regular: { p: 161, at: AT },
      premium: { p: 175, at: AT },
      super: { p: 214, at: AT },
      diesel: { p: 185, at: AT },
      'premium-diesel': { p: 208, at: AT },
    });
    // One 95, one diesel and LPG: no premium grades.
    expect(byId('hr-1431').prices).toEqual({ regular: { p: 161, at: AT }, diesel: { p: 185, at: AT }, lpg: { p: 103, at: AT } });
    // Two 95s at the same price are one grade; of three diesels the cheapest and the dearest are kept.
    expect(byId('hr-1300').prices).toEqual({ regular: { p: 161, at: AT }, diesel: { p: 185, at: AT }, 'premium-diesel': { p: 205, at: AT } });
    // Thousandths round to a tenth of a cent; the cheaper of two 100s is "super"; 3.01 is out of range.
    expect(byId('hr-1178').prices).toEqual({ diesel: { p: 220.8, at: AT }, super: { p: 221.8, at: AT }, lpg: { p: 99.9, at: AT } });
  });

  test('drops kuna prices, lapsed rows and zeros, row by row', () => {
    // 11.37 (kuna), 1.43 (one row past the limit) and 0 go; the diesel row exactly on the limit stays.
    expect(byId('hr-1245').prices).toEqual({ diesel: { p: 185, at: AT } });
    expect(stations.some((s) => s.id === 'hr-906')).toBe(false);
  });

  test('tidies names and towns, moves postcodes out and maps operators to brands', () => {
    expect(byId('hr-1208')).toMatchObject({ name: 'Zagreb - Slavonska sjever', brand: 'INA', address: 'Slavonska avenija 25', town: 'Zagreb', postcode: '', tags: [] });
    expect(byId('hr-1431')).toMatchObject({ name: 'BP Mokrice', brand: 'Lukoil', address: 'Mokrice 180', town: 'Mokrice' });
    expect(byId('hr-1245')).toMatchObject({ name: 'Pj-Oil', brand: 'Rijeka Trans', address: 'Lopar 285/A', town: 'Lopar', postcode: '51281' });
    expect(byId('hr-1178')).toMatchObject({ name: 'Shell Varaždin', brand: 'Shell', address: 'Optujska 1', town: 'Varaždin', postcode: '42000' });
    expect(byId('hr-1300')).toMatchObject({ name: 'Petrol', brand: 'Petrol', address: 'Nikole Tesle 133A', town: 'Đakovo' });
  });

  test('maps day types to Monday to Sunday hours', () => {
    // Saturday ends at 24:00. Sunday is "00:00 to 24:00" at a station that shuts at night in the week: not believed.
    expect(byId('hr-1208').hours).toEqual(['0600-2100', '0600-2100', '0600-2100', '0600-2100', '0600-2100', '0500-2359', 'unknown']);
    expect(byId('hr-1431').hours).toEqual(['0600-2200', '0600-2200', '0600-2200', '0600-2200', '0600-2200', 'unknown', '0700-1900']);
    expect(byId('hr-1245').hours).toBeNull();
    expect(byId('hr-1178').hours).toEqual(Array(7).fill('24h')); // 00:00 to 23:59
    expect(byId('hr-1300').hours).toEqual(['0600-1900', '0600-1900', '0600-1900', '0600-1900', '0600-1900', '0600-1300', 'unknown']);
    expect(hrHours([day(1, 4, '08:00:00', '12:00:00')])).toBeNull(); // only a holiday row
    expect(hrHours([day(1, 1, 'rubbish', '12:00:00'), day(2, 2, '20:00:00', '06:00:00')])).toBeNull();
    expect(hrHours(undefined)).toBeNull();
  });

  test('hours: round the clock, and the slips that stay unknown', () => {
    const allDay = [day(1, 1, '00:00:00', '24:00:00'), day(2, 2, '00:00:00', '24:00:00'), day(3, 3, '00:00:00', '00:00:00')];
    expect(hrHours(allDay)).toEqual(Array(7).fill('24h'));
    // Only the workday row: a round the clock motorway station that left the weekend out.
    expect(hrHours([day(1, 1, '00:00:00', '24:00:00')])).toEqual(['24h', '24h', '24h', '24h', '24h', 'unknown', 'unknown']);
    // The same day type twice with the same hours (five stations in the real file).
    expect(hrHours([day(1, 1, '06:00:00', '22:00:00'), day(2, 1, '06:00:00', '22:00:00'), day(3, 2, '07:00', '20:00')])).toEqual([
      '0600-2200',
      '0600-2200',
      '0600-2200',
      '0600-2200',
      '0600-2200',
      '0700-2000',
      'unknown',
    ]);
    // "22:00 to 24:00" every day (station 1314 in the real file) says nothing useful.
    expect(hrHours([day(1, 1, '22:00:00', '24:00:00'), day(2, 2, '22:00:00', '24:00:00'), day(3, 3, '22:00:00', '24:00:00')])).toBeNull();
    // A short Sunday is unknown, a three hour one is kept.
    expect(hrHours([day(1, 1, '06:00:00', '22:00:00'), day(2, 2, '08:00:00', '11:00:00'), day(3, 3, '08:00:00', '10:00:00')])).toEqual([
      '0600-2200',
      '0600-2200',
      '0600-2200',
      '0600-2200',
      '0600-2200',
      '0800-1100',
      'unknown',
    ]);
    // Times that cannot be: 25 o'clock, 61 minutes, after 24:00.
    expect(hrHours([day(1, 1, '25:00:00', '26:00:00'), day(2, 2, '06:61:00', '22:00:00'), day(3, 3, '06:00:00', '24:30:00')])).toBeNull();
  });

  test('brands: the big chains by their sign, the rest without the company form', () => {
    expect(hrBrand('INA – Industrija nafte d.d.')).toBe('INA');
    expect(hrBrand('Petrol d.o.o.')).toBe('Petrol');
    expect(hrBrand('Tifon d.o.o.')).toBe('Tifon');
    expect(hrBrand('LUKOIL Croatia d.o.o.')).toBe('Lukoil');
    expect(hrBrand('Adria Oil d.o.o.')).toBe('Adria Oil');
    expect(hrBrand('Coral Croatia d.o.o.')).toBe('Shell');
    expect(hrBrand('KTC d.d.')).toBe('KTC');
    expect(hrBrand('AGS Hrvatska d.o.o.')).toBe('AGS');
    expect(hrBrand('CRODUX DERIVATI DVA d.o.o.')).toBe('Crodux');
    // Other companies with "petrol" in the name are not the Petrol chain.
    expect(hrBrand('KOŠUĆA PETROL D.O.O.')).toBe('Košuća Petrol');
    expect(hrBrand('Žminj petrol d.o.o.')).toBe('Žminj petrol');
    expect(hrBrand('Reka promet d. o. o. ')).toBe('Reka promet');
    expect(hrBrand('ISTRAGAS jdoo')).toBe('Istragas');
    expect(hrBrand('Vugip d.o.o')).toBe('Vugip');
    expect(hrBrand('Kavazović grupa  d.o.o., Adria Petrol')).toBe('Kavazović grupa');
    expect(hrBrand('AUTO PLIN,obrt za trgovinu,vl.Ana Anić i Ivo Ivić')).toBe('Auto Plin');
    expect(hrBrand('Lovrić obrt za prijevoz tereta cestom, vl. Ivan Lovrić')).toBe('Lovrić');
    expect(hrBrand('Auto-Ivec')).toBe('Auto-Ivec');
    expect(hrBrand('-')).toBe('');
    expect(hrBrand('')).toBe('');
  });

  test('place names keep Croatian letters and lose stray postcodes', () => {
    expect(hrPlace('SAVSKA UL 164', 'OPRISAVCI 35213')).toEqual({ address: 'Savska Ul 164', town: 'Oprisavci', postcode: '35213' });
    expect(hrPlace('Trajektno pristanište 12 ', '21460 Stari Grad,  Otok Hvar')).toEqual({ address: 'Trajektno pristanište 12', town: 'Stari Grad, Otok Hvar', postcode: '21460' });
    expect(hrPlace('SELNIK, VARAŽDINSKA 30   42230 LUDBREG', 'SELNIK')).toEqual({ address: 'Selnik, Varaždinska 30', town: 'Selnik', postcode: '42230' });
    expect(hrPlace('Ulica kralja Tomislava 144', 'Nova Kapela, Croatia')).toEqual({ address: 'Ulica kralja Tomislava 144', town: 'Nova Kapela', postcode: '' });
    expect(hrPlace(null, 'Lesišćina/Lupoglav\t\t\t')).toEqual({ address: '', town: 'Lesišćina/Lupoglav', postcode: '' });
    expect(hrPlace('Zagorska ulica 47', null)).toEqual({ address: 'Zagorska ulica 47', town: '', postcode: '' });
    expect(hrPlace('KRIŽANJE MAZIJA bb', 'ČAČINCI')).toEqual({ address: 'Križanje Mazija bb', town: 'Čačinci', postcode: '' });
    expect(hrTidy('PM ĐAKOVO, NIKOLE TESLE')).toBe('PM Đakovo, Nikole Tesle');
    expect(hrTidy('CESTA PAPE IVANA PAVLA II. 343')).toBe('Cesta Pape Ivana Pavla II. 343');
    expect(hrTidy('OKTAN ŽAŽINE d.o.o.')).toBe('Oktan Žažine d.o.o.');
    expect(hrTidy('ŠIMUN OIL D.O.O.')).toBe('Šimun Oil d.o.o.');
    expect(hrName('AUTO PLIN, obrt za trgovinu,vl.Ana Anić i Ivo Ivić, IZDVOJENI POGON')).toBe('Auto Plin');
  });

  test('text: initials, quotes, Roman numerals and shouted words', () => {
    // Initials and short forms with full stops keep their capitals.
    expect(hrTidy('B.P. JOZINOVIĆ IVANKOVO')).toBe('B.P. Jozinović Ivankovo');
    expect(hrTidy('V.NAZORA 10')).toBe('V.Nazora 10');
    expect(hrTidy('DR.FRANJE TUĐMANA 6')).toBe('Dr.Franje Tuđmana 6');
    expect(hrTidy('CESTA DR.F. TUĐMANA 197')).toBe('Cesta Dr.F. Tuđmana 197');
    expect(hrBrand('G.S.PLIN D.O.O.')).toBe('G.S.Plin');
    expect(hrTidy('N.B.NENA d.o.o.')).toBe('N.B.Nena d.o.o.');
    expect(hrTidy('ISTRAGAS J.D.O.O.')).toBe('Istragas j.d.o.o.');
    expect(hrTidy('KTC D.D.')).toBe('KTC d.d.');
    // "bb" and "b.b." (no house number) stay small.
    expect(hrTidy('SOBRA B.B.')).toBe('Sobra b.b.');
    expect(hrTidy('ŠIŠLJAVIĆ BB')).toBe('Šišljavić bb');
    // One real name carries backslashes before its quotes.
    expect(hrName('T.O. \\"PLINARA BADERNA\\"')).toBe('T.O. "Plinara Baderna"');
    // Words with a digit, which the shared helper leaves as written.
    expect(hrTidy('BP OSIJEK1')).toBe('BP Osijek1');
    expect(hrTidy('1.RESNIČKI GAJ 18')).toBe('1.Resnički Gaj 18');
    expect(hrTidy('PM ZAGREB, SAMOBORSKA 145A')).toBe('PM Zagreb, Samoborska 145A');
    expect(hrTidy('ULICA 113. ŠIBENSKE BRIGADE HV-A 20')).toBe('Ulica 113. Šibenske Brigade HV-A 20');
    // Roman numerals.
    expect(hrTidy('PETRČANE ULICA XXX 1D')).toBe('Petrčane Ulica XXX 1D');
    expect(hrTidy('ULICA XIII. DIVIZIJE 4')).toBe('Ulica XIII. Divizije 4');
    expect(hrTidy('Obala kralja Petra Krešimira IV 36a')).toBe('Obala kralja Petra Krešimira IV 36a');
    expect(hrTidy('Ulica XVIII. brigade 2')).toBe('Ulica XVIII. brigade 2');
    // Mixed case is kept, apart from shouted words of four letters or more.
    expect(hrTidy('Poslovna jedinica B. P. AUTO KOREN')).toBe('Poslovna jedinica B. P. Auto Koren');
    expect(hrTidy('Benzinska pumpa BREBRIĆ d.o.o.')).toBe('Benzinska pumpa Brebrić d.o.o.');
    expect(hrTidy('Radnička 19B - A3 - HIGHWAY ')).toBe('Radnička 19B - A3 - Highway');
    expect(hrTidy('ZADAR I-Zapad')).toBe('Zadar I-Zapad');
    expect(hrTidy('Labin UNP')).toBe('Labin UNP');
    expect(hrTidy('65. Bataljuna ZNG 7')).toBe('65. Bataljuna ZNG 7');
    expect(hrTidy('PM POREČ , OBILAZNICA ZAPAD')).toBe('PM Poreč, Obilaznica Zapad');
    // "Obrt" (a sole trader) is cut only with its line of business; in a trading name it stays.
    expect(hrBrand('Exclusive obrt za trgovinu i usluge')).toBe('Exclusive');
    expect(hrBrand('Trgovački obrt Marić, vl. Ivan Marić')).toBe('Trgovački obrt Marić');
    expect(hrName('Trgovački obrt Marić')).toBe('Trgovački obrt Marić');
    expect(hrName('')).toBe('');
  });

  test('reads the download as a gzip file, or as plain JSON if it arrives unpacked', () => {
    const json = JSON.stringify({ postajas: [], mjesto: 'Đakovo' });
    expect(hrJson(new Uint8Array(gzipSync(json)))).toEqual({ postajas: [], mjesto: 'Đakovo' });
    expect(hrJson(new TextEncoder().encode(json))).toEqual({ postajas: [], mjesto: 'Đakovo' });
    expect(() => hrJson(new TextEncoder().encode('<html>'))).toThrow();
  });
});
