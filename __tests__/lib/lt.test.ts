import { deflateRawSync } from 'node:zlib';
import {
  buildLtDrafts,
  ltAddress,
  ltDay,
  ltFuelKind,
  ltHeaderOk,
  ltLookupResult,
  ltMunicipality,
  ltNominatives,
  ltOwnStation,
  ltReportedAt,
  ltRoad,
  ltSameRoad,
  ltRows,
  ltSharedStrings,
  ltSheetRows,
  ltShortName,
  type LtRow,
  type LtWhere,
  placeLtDrafts,
  readLtWorkbook,
} from '../../scripts/feed/sources/lt.ts';
import { filesInZip } from '../../scripts/feed/zip.ts';

const now = new Date('2026-11-25T18:00:00Z');
const DAY = 46351; // 25 November 2026

const STRINGS = `<sst><si><t>Įmonė</t></si><si><t>Savivaldybė</t></si><si><t>Adresas</t></si><si><t>Degalų tipas</t></si><si><t>Kaina (EUR/l)</t></si><si><t>Pateikimo data</t></si><si><t>UAB Viada LT</t></si><si><t>Vilniaus m. sav.</t></si><si><r><t>Vilnius, </t></r><r><t>Sodų g. 22, 03211</t></r></si><si><t>95 benzinas</t></si><si><t>neprekiauja</t></si><si><t>R &amp; D</t></si></sst>`;
const SHEET = `<worksheet><sheetData><row r="1"><c r="A1" s="1"/></row><row r="7"><c r="A7" t="s"><v>0</v></c><c r="B7" t="s"><v>1</v></c><c r="C7" t="s"><v>2</v></c><c r="D7" t="s"><v>3</v></c><c r="E7" t="s"><v>4</v></c><c r="F7" t="s"><v>5</v></c></row><row r="8"><c r="A8" t="s"><v>6</v></c><c r="B8" t="s"><v>7</v></c><c r="C8" t="s"><v>8</v></c><c r="D8" t="s"><v>9</v></c><c r="E8" s="16"><v>1.7789999999999999</v></c><c r="F8" s="21"><v>${DAY}</v></c></row><row r="9"><c r="A9" t="s"><v>6</v></c><c r="B9" t="s"><v>7</v></c><c r="C9" t="s"><v>8</v></c><c r="D9" t="s"><v>9</v></c><c r="E9" t="s"><v>10</v></c><c r="F9"><v>${DAY}</v></c></row></sheetData></worksheet>`;

/** A small .zip, deflated, enough to stand in for a workbook. */
function zipOf(files: Record<string, string>): Uint8Array {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text, 'utf8');
    const body = deflateRawSync(raw);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(8, 8);
    head.writeUInt32LE(body.length, 18);
    head.writeUInt32LE(raw.length, 22);
    head.writeUInt16LE(Buffer.byteLength(name), 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(body.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(Buffer.byteLength(name), 28);
    entry.writeUInt32LE(offset, 42);
    local.push(head, Buffer.from(name), body);
    central.push(entry, Buffer.from(name));
    offset += 30 + Buffer.byteLength(name) + body.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...local, directory, end]));
}

const row = (company: string, municipality: string, address: string, fuel: string, price: string, day = DAY): LtRow => ({ company, municipality, address, fuel, price, day });

describe('Lithuania (Lithuanian Energy Agency workbook)', () => {
  it('maps the three fuels and nothing else', () => {
    expect(ltFuelKind('95 benzinas')).toBe('regular');
    expect(ltFuelKind('Dyzelinas')).toBe('diesel');
    expect(ltFuelKind('SND')).toBe('lpg');
    expect(ltFuelKind('Degalų tipas')).toBeNull();
  });

  it('reads Excel day numbers as 10:00 in Vilnius, winter and summer, never in the future', () => {
    expect(ltDay(DAY)).toBe('2026-11-25');
    expect(ltReportedAt(DAY, now)).toBe('2026-11-25T08:00:00.000Z');
    expect(ltReportedAt(46220, now)).toBe('2026-07-17T07:00:00.000Z');
    expect(ltReportedAt(DAY, new Date('2026-11-25T06:30:00Z'))).toBe('2026-11-25T06:30:00.000Z');
  });

  it('reads the text table and the rows of the sheet', () => {
    const strings = ltSharedStrings(STRINGS);
    expect(strings[8]).toBe('Vilnius, Sodų g. 22, 03211');
    expect(strings[11]).toBe('R & D');
    const cells = ltSheetRows(SHEET, strings);
    expect(ltHeaderOk(cells)).toBe(true);
    expect(ltHeaderOk(cells.slice(2))).toBe(false);
    expect(ltRows(cells)).toEqual([
      { company: 'UAB Viada LT', municipality: 'Vilniaus m. sav.', address: 'Vilnius, Sodų g. 22, 03211', fuel: '95 benzinas', price: '1.7789999999999999', day: DAY },
      { company: 'UAB Viada LT', municipality: 'Vilniaus m. sav.', address: 'Vilnius, Sodų g. 22, 03211', fuel: '95 benzinas', price: 'neprekiauja', day: DAY },
    ]);
  });

  it('opens a workbook: the largest sheet and the text table out of the zip', async () => {
    const book = zipOf({ 'xl/workbook.xml': '<workbook/>', 'xl/worksheets/sheet2.xml': '<x/>', 'xl/worksheets/sheet1.xml': SHEET, 'xl/sharedStrings.xml': STRINGS });
    expect([...(await filesInZip(book, (name) => name.endsWith('workbook.xml'))).keys()]).toEqual(['xl/workbook.xml']);
    expect((await readLtWorkbook(book)).map((r) => r.price)).toEqual(['1.7789999999999999', 'neprekiauja']);
    await expect(readLtWorkbook(zipOf({ 'xl/worksheets/sheet1.xml': SHEET.replace('<v>2</v>', '<v>6</v>'), 'xl/sharedStrings.xml': STRINGS }))).rejects.toThrow('columns');
  });

  it('splits addresses however the operator wrote them', () => {
    expect(ltAddress('Vilnius, Subačiaus g. 64, 11342')).toEqual({ town: 'Vilnius', street: 'Subačiaus g. 64', postcode: '11342' });
    expect(ltAddress('Sudmantų k., Vilniaus pl. 6')).toEqual({ town: 'Sudmantų k.', street: 'Vilniaus pl. 6', postcode: '' });
    expect(ltAddress('Kuosiškių k. 4, 83169')).toEqual({ town: 'Kuosiškių k.', street: '', postcode: '83169' });
    expect(ltAddress('Kušliškių k. Suvalkijos g. 15, 69200')).toEqual({ town: 'Kušliškių k.', street: 'Suvalkijos g. 15', postcode: '69200' });
    expect(ltAddress('Alytaus g. 59, Krosnos k., 67443')).toEqual({ town: 'Krosnos k.', street: 'Alytaus g. 59', postcode: '67443' });
    expect(ltAddress('Lazdijų sen., Janaslavo k. 11, 67170')).toEqual({ town: 'Janaslavo k.', street: '', postcode: '67170' });
    expect(ltAddress('Rietavas, Lėgų k. 1, 90305')).toEqual({ town: 'Lėgų k.', street: '', postcode: '90305' });
    expect(ltAddress('Ąžuolų Būdos k.')).toEqual({ town: 'Ąžuolų Būdos k.', street: '', postcode: '' });
  });

  it('tells a road from a village and names the municipality as the map does', () => {
    expect(ltRoad('Vilniaus pl. 6')).toEqual({ road: 'Vilniaus pl.', house: '6' });
    expect(ltRoad('J. Basanavičiaus g. 95 B')).toEqual({ road: 'J. Basanavičiaus g.', house: '95B' });
    expect(ltRoad('Juodasis kl. 32')).toEqual({ road: 'Juodasis kl.', house: '32' });
    expect(ltRoad('A. Skelčio g.')).toEqual({ road: 'A. Skelčio g.', house: '' });
    expect(ltRoad('Vytėnų vs 9')).toEqual({ road: '', house: '' });
    expect(ltRoad('Grigiškės')).toEqual({ road: '', house: '' });
    expect(ltRoad('Beržų g. 24/Drąsiųjų g. 7')).toEqual({ road: 'Beržų g.', house: '24' });
    expect(ltRoad('Vilniaus g. 5/2')).toEqual({ road: 'Vilniaus g.', house: '5/2' });
    expect(ltSameRoad('Basanavičiaus g.', 'J. Basanavičiaus g.')).toBe(true);
    expect(ltSameRoad('L.Taunio g.', 'L. Taunio g.')).toBe(true);
    expect(ltSameRoad('Juodasis kl.', 'Juodasis kelias')).toBe(true);
    expect(ltSameRoad('Vakarinio aplinkkelio', 'Vakarinis aplinkkelis')).toBe(true);
    expect(ltSameRoad('Radviliškio plentas', 'Radviliškio pl.')).toBe(true);
    expect(ltSameRoad('Dariaus ir Girėno', 'Dariaus ir Girėno g.')).toBe(true);
    expect(ltSameRoad('Minkovskių g.', 'H. ir O. Minkovskių g.')).toBe(true);
    expect(ltSameRoad('A. Skelčio g.', 'Antano Skelčio g.')).toBe(true);
    expect(ltSameRoad('Kėdainių g.', 'Šingalių g.')).toBe(false);
    expect(ltSameRoad('Sausio 15-osios g.', 'Kovo 11-osios g.')).toBe(false);
    expect(ltSameRoad('Vilniaus g.', 'Šingaliai')).toBe(false);
    expect(ltMunicipality('Kauno r. sav.')).toBe('Kauno rajono savivaldybė');
    expect(ltMunicipality('Vilniaus m. sav.')).toBe('Vilniaus miesto savivaldybė');
    expect(ltMunicipality('Kazlų Rūdos sav.')).toBe('Kazlų Rūdos savivaldybė');
  });

  it('offers the names a village may have on the map', () => {
    expect(ltNominatives('Sudmantų')).toEqual(['Sudmantų', 'Sudmantai', 'Sudmantos']);
    expect(ltNominatives('Kakliniškių')).toContain('Kakliniškės');
    expect(ltNominatives('Girkalnio')).toContain('Girkalnis');
    expect(ltNominatives('Paširvinčio')).toContain('Paširvintis');
    expect(ltNominatives('Brazavo')).toContain('Brazavas');
    expect(ltNominatives('Ąžuolų Būdos')).toEqual(['Ąžuolų Būdos', 'Ąžuolų Būda']);
    expect(ltNominatives('Vilnius')).toEqual(['Vilnius']);
  });

  it('keeps the operator’s full name and a short one for the title', () => {
    expect(ltShortName('UAB Viada LT')).toBe('Viada');
    expect(ltShortName('UAB Circle K Lietuva')).toBe('Circle K');
    expect(ltShortName('AB Orlen Baltics Retail')).toBe('Orlen');
    expect(ltShortName('UAB Junasa, Degalinė')).toBe('Junasa');
    expect(ltShortName('S.Savicko įmonė')).toBe('S.Savicko įmonė');
  });

  const ROWS = [
    row('UAB Viada LT', 'Vilniaus m. sav.', 'Vilnius, Sodų g. 22, 03211', '95 benzinas', '1.76', DAY - 1),
    row('UAB Viada LT', 'Vilniaus m. sav.', 'Vilnius, Sodų g. 22, 03211', '95 benzinas', '1.7789999999999999'),
    row('UAB Viada LT', 'Vilniaus m. sav.', 'Vilnius, Sodų g. 22, 03211', 'Dyzelinas', '2.219'),
    row('UAB Viada LT', 'Vilniaus m. sav.', 'Vilnius, Sodų g. 22, 03211', 'SND', 'neprekiauja'),
    row('UAB Jozita', 'Pakruojo r. sav.', 'Kuosiškių k. 4, 83169', 'Dyzelinas', '2.04', DAY - 1),
    row('UAB Jozita', 'Pakruojo r. sav.', 'Kuosiškių k. 4, 83169', 'Dyzelinas', 'nepateikė'),
    row('UAB Senoji', 'Kauno m. sav.', 'Kaunas, Jonavos g. 1, 44136', 'Dyzelinas', '2.00', DAY - 30),
    row('UAB Klaida', 'Kauno m. sav.', 'Kaunas, Jonavos g. 2, 44136', 'Dyzelinas', '22.00'),
  ];

  it('takes each station’s newest reported prices and names its operator', () => {
    const drafts = buildLtDrafts(ROWS, now);
    expect(drafts.map((d) => d.station.name)).toEqual(['Viada Vilnius', 'Jozita Kuosiškių']);
    expect(drafts[0]?.station).toMatchObject({ region: 'lt', brand: 'UAB Viada LT', address: 'Sodų g. 22', town: 'Vilnius', postcode: '03211' });
    expect(drafts[0]?.station.prices).toEqual({ regular: { p: 177.9, at: '2026-11-25T08:00:00.000Z' }, diesel: { p: 221.9, at: '2026-11-25T08:00:00.000Z' } });
    expect(drafts[0]?.lookups).toEqual(['Sodų g. 22, 03211', 'Sodų g. 22, Vilnius, Vilniaus miesto savivaldybė']);
    expect(drafts[0]?.where).toEqual({ municipality: 'Vilniaus miesto savivaldybė', place: 'Vilnius', alsoIn: [], road: 'Sodų g.', house: '22', postcode: '03211', brand: 'Viada' });
    // Not reported today: yesterday's price stays, with yesterday's time.
    expect(drafts[1]?.station.prices).toEqual({ diesel: { p: 204, at: '2026-11-24T08:00:00.000Z' } });
    expect(drafts[1]?.station).toMatchObject({ address: 'Kuosiškių k.', town: 'Kuosiškių k.' });
    expect(drafts[1]?.lookups).toEqual(['Kuosiškių, Pakruojo rajono savivaldybė', 'Kuosiškiai, Pakruojo rajono savivaldybė', 'Kuosiškės, Pakruojo rajono savivaldybė']);
  });

  it('gives nothing when the workbook has gone stale', () => {
    expect(buildLtDrafts(ROWS, new Date('2026-12-20T12:00:00Z'))).toEqual([]);
  });

  const where: LtWhere = { municipality: 'Kėdainių rajono savivaldybė', place: 'Šingalių', alsoIn: [], road: 'Kėdainių g.', house: '44', postcode: '58185', brand: 'Emsi' };
  const answer = (over: Record<string, unknown>, address: Record<string, unknown>) => [
    { lat: '55.2496', lon: '23.8519', place_rank: 30, category: 'building', type: 'yes', display_name: '44, Kėdainių g., Šingaliai, Josvainių seniūnija, Kėdainių rajono savivaldybė, Kauno apskritis, Lietuva', ...over, address: { road: 'Kėdainių g.', house_number: '44', postcode: '58185', ...address } },
  ];

  it('believes the map only when it agrees with the address', () => {
    expect(ltLookupResult(answer({}, {}), where)).toEqual({ lat: 55.2496, lng: 23.8519, r: 30 });
    // Another municipality, another road, or the same road in another village with another postcode: refused.
    expect(ltLookupResult(answer({ display_name: 'x, Alytaus miesto savivaldybė, Lietuva' }, {}), where)).toBeNull();
    expect(ltLookupResult(answer({ display_name: '44, Šingalių g., Šingaliai, Kėdainių rajono savivaldybė, Lietuva' }, {}), where)).toBeNull();
    expect(ltLookupResult(answer({ display_name: '44, Kėdainių g., Karčemos, Kėdainių rajono savivaldybė, Lietuva' }, { postcode: '58244' }), where)).toBeNull();
    expect(ltLookupResult(answer({ lat: '48.85', lon: '2.35' }, {}), where)).toBeNull();
    // The operator's own fuel station on the right road counts without a house number; another company's does not.
    expect(ltLookupResult(answer({ category: 'amenity', type: 'fuel', name: 'EMSI' }, { house_number: undefined }), where)?.r).toBe(30);
    expect(ltLookupResult(answer({ category: 'amenity', type: 'fuel', name: 'Viada' }, { house_number: undefined }), where)).toBeNull();
    expect(ltLookupResult(answer({ category: 'amenity', type: 'fuel', name: 'EMSI' }, { house_number: '12' }), where)).toBeNull();
    // A bare road only in the same village, and only as a road.
    expect(ltLookupResult(answer({ category: 'highway', type: 'secondary', place_rank: 26 }, { house_number: undefined }), where)?.r).toBe(26);
    expect(ltLookupResult(answer({ category: 'highway', type: 'secondary', place_rank: 26, display_name: 'Kėdainių g., Kitur, Kėdainių rajono savivaldybė, Lietuva' }, { house_number: undefined }), where)).toBeNull();
    expect(ltLookupResult(answer({ category: 'building' }, { house_number: '12' }), where)).toBeNull();
    // Initials and the word for the road may differ.
    expect(ltLookupResult(answer({ display_name: '44, J. Kėdainių gatvė, Šingaliai, Kėdainių miesto savivaldybė, Lietuva' }, { road: undefined }), where)?.r).toBe(30);
    // The district the address belongs to may be written as a place of its own ("Vilnius, Grigiškės, …").
    const grigiskes: LtWhere = { municipality: 'Vilniaus miesto savivaldybė', place: 'Vilnius', alsoIn: ['Grigiškės'], road: 'Kovo 11-osios g.', house: '75', postcode: '27119', brand: 'Viada' };
    const viada = [{ lat: '54.67', lon: '25.09', category: 'amenity', type: 'fuel', name: 'Viada', display_name: 'Viada, 75, Kovo 11-osios g., Neravai, Grigiškių seniūnija, Grigiškės, Vilniaus miesto savivaldybė, Lietuva', address: { house_number: '75', postcode: '27125' } }];
    expect(ltLookupResult(viada, grigiskes)?.r).toBe(30);
    expect(ltLookupResult(viada, { ...grigiskes, house: '57' })).toBeNull();
  });

  it('places a village address on the village, not on a street of that name', () => {
    const village: LtWhere = { municipality: 'Kauno rajono savivaldybė', place: 'Biruliškių', alsoIn: [], road: '', house: '', postcode: '54469', brand: 'Orlen' };
    const body = (category: string, type: string, rank: number, name: string) => [{ lat: '54.951', lon: '24.029', place_rank: rank, category, type, name, display_name: `${name}, Ramučiai, Biruliškės, Kauno rajono savivaldybė, Lietuva`, address: {} }];
    expect(ltLookupResult(body('highway', 'residential', 26, 'Biruliškių g.'), village)).toBeNull();
    expect(ltLookupResult(body('place', 'village', 19, 'Biruliškės'), village)).toEqual({ lat: 54.951, lng: 24.029, r: 19 });
    expect(ltLookupResult(body('boundary', 'administrative', 16, 'Biruliškės'), village)?.r).toBe(16);
    expect(ltLookupResult(body('boundary', 'administrative', 10, 'Kauno rajono savivaldybė'), village)).toBeNull();
    expect(ltLookupResult(body('man_made', 'bridge', 30, 'Biruliškių tiltas'), village)).toBeNull();
  });

  it('moves a village position onto the operator’s own station when there is exactly one in that village', () => {
    const village: LtWhere = { municipality: 'Raseinių rajono savivaldybė', place: 'Pikelių', alsoIn: [], road: '', house: '', postcode: '60376', brand: 'Circle K' };
    const fuel = (name: string, lat: string, place = 'Pikeliai') => ({ lat, lon: '22.69', type: 'fuel', category: 'amenity', name, display_name: `${name}, A1, ${place}, Raseinių rajono savivaldybė, Lietuva`, address: { road: 'A1' } });
    expect(ltOwnStation([fuel('Bonsa', '55.4692'), fuel('Circle K „Kryžkalnis“', '55.4613'), fuel('Orlen', '55.4645')], village)).toEqual({ lat: 55.4613, lng: 22.69, r: 30 });
    expect(ltOwnStation([fuel('Orlen', '55.4645'), fuel('Orlen', '55.4616')], { ...village, brand: 'Orlen' })).toBeNull();
    expect(ltOwnStation([fuel('Viada', '55.4645')], village)).toBeNull();
    // The same name in the next town is another station.
    expect(ltOwnStation([fuel('Circle K', '55.4645', 'Kryžkalnis')], village)).toBeNull();
    expect(ltOwnStation([{ ...fuel('Circle K plovykla', '55.46'), type: 'car_wash' }], village)).toBeNull();
    // For a street address the station must be on that road with no number of its own, or carry the same number.
    const street: LtWhere = { ...village, road: 'Panevėžio g.', house: '35' };
    expect(ltOwnStation([fuel('Circle K', '55.46')], street)).toBeNull();
    expect(ltOwnStation([{ ...fuel('Circle K', '55.46'), address: { house_number: '35' } }], street)?.r).toBe(30);
    expect(ltOwnStation([{ ...fuel('Circle K', '55.46'), display_name: 'Circle K, Panevėžio g., Pikeliai, Lietuva' }], street)?.r).toBe(30);
    expect(ltOwnStation([{ ...fuel('Circle K', '55.46'), display_name: 'Circle K, 12, Panevėžio g., Pikeliai, Lietuva', address: { house_number: '12' } }], street)).toBeNull();
  });

  it('uses saved positions and asks only for new, moved or long missing addresses', () => {
    const drafts = buildLtDrafts(ROWS, now);
    const [a, b] = drafts.map((d) => d.station.id);
    const placed = placeLtDrafts(drafts, { [a ?? '']: { a: 'Vilnius, Sodų g. 22, 03211', lat: 54.67, lng: 25.28, r: 30 }, [b ?? '']: { a: 'Kuosiškių k. 4, 83169', miss: '2026-11-20' } }, now);
    expect(placed.stations.map((s) => [s.id, s.lat, s.lng])).toEqual([[a, 54.67, 25.28]]);
    expect(placed.todo).toEqual([]);
    expect(placeLtDrafts(drafts, { [a ?? '']: { a: 'an older address', lat: 1, lng: 1 }, [b ?? '']: { a: 'Kuosiškių k. 4, 83169', miss: '2026-09-01' } }, now).todo).toHaveLength(2);
  });
});
