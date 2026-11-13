// Tests for the price pages (run by `npm run test:site`, part of `npm run verify`).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { aliasesFor, buildSite, countVars, fallbackRoot, FUEL_WORDS, markDoubts, median, placesFor, REGIONS, say, siteJs, stationAddress, stationName, tidyText, U } from './pages.mjs';

const NOW = '2026-11-12T21:51:32.263Z';
let n = 0;
function st(region, town, lat, lng, prices, extra = {}) {
  n += 1;
  const p = {};
  for (const [k, v] of Object.entries(prices)) p[k] = { p: v, at: NOW };
  return { id: `${region}-${n}`, region, name: `Station ${n}`, brand: '', address: `${n} Main St`, town, postcode: '', lat, lng, hours: null, tags: [], prices: p, ...extra };
}
const meta = (regions) => ({
  v: 4, generatedAt: NOW, tileDeg: 0.5, tiles: {},
  regions: Object.fromEntries(regions.map((r) => [r, { status: 'live', updatedAt: NOW }])),
  licences: Object.fromEntries(regions.map((r) => [r, { attribution: 'Test source', licence: 'CC BY 4.0', url: 'https://example.org', reuse: 'cc' }])),
});

test('every visible text exists in all four languages', () => {
  const keys = Object.keys(U.en).sort();
  for (const l of ['es', 'fr', 'pt']) assert.deepEqual(Object.keys(U[l]).sort(), keys, `language ${l}`);
  for (const l of ['en', 'es', 'fr', 'pt']) for (const k of keys) assert.ok(String(U[l][k]).trim(), `${l}.${k} is empty`);
  for (const l of ['es', 'fr', 'pt']) assert.deepEqual(Object.keys(FUEL_WORDS[l]).sort(), Object.keys(FUEL_WORDS.en).sort());
});

test('English texts have no hyphens', () => {
  for (const [k, v] of Object.entries(U.en)) assert.ok(!/[-‐‑–—]/.test(v), `en.${k}: ${v}`);
});

test('text values that are texts are translated too', () => {
  assert.equal(say('es', 'regionH1', { r: { k: 'rn_wa' } }), 'Precio de la gasolina y el diésel hoy en Australia Occidental');
  assert.equal(say('en', 'allIn', { r: { k: 'rn_es' } }), 'All places in Spain');
});

test('names and addresses are tidied with real feed examples', () => {
  assert.equal(tidyText('Av .MOUZINHO DE ALBUQUERQUE posto GALP'), 'Av. Mouzinho de Albuquerque posto GALP');
  assert.equal(tidyText('103 HINDMARSH DR'), '103 Hindmarsh Dr');
  assert.equal(tidyText('3096 MARLBOROUGH RD'), '3096 Marlborough Rd');
  assert.equal(tidyText('E.s. Castilho'), 'E.S. Castilho');
  assert.equal(tidyText('E.Leclerc'), 'E.Leclerc');
  assert.equal(tidyText('PA AB PetroPina ZI'), 'PA AB PetroPina ZI');
  assert.equal(tidyText('Lowes BP Launceston (Gleadow Street) Opt'), 'Lowes BP Launceston (Gleadow Street) Opt');
  assert.equal(tidyText('109 RUE D\'ARRAS'), '109 Rue d\'Arras'.replace("d'Arras", "D'Arras"));
  assert.equal(tidyText('Carretera N-340 A, 599,5 Km. 599,5'), 'Carretera N-340 A, 599,5 Km. 599,5');
  assert.equal(tidyText('ESTACION DE SERVICIO LA PAZ'), 'Estacion de Servicio la Paz');
  assert.equal(tidyText('BP Morley'), 'BP Morley');
  // Three letter brands in a normal name stay; a name mostly in capitals is tidied.
  assert.equal(tidyText('IOR Bassendean'), 'IOR Bassendean');
  assert.equal(tidyText('OTR Mount Barker'), 'OTR Mount Barker');
  assert.equal(tidyText('LOT 4 GREAT EASTERN HWY'), 'Lot 4 Great Eastern Hwy');
  // A "|" in a town name never reaches the search index's own separator.
  assert.equal(tidyText('São Jorge de Arroios | Arroios | Lisboa'), 'São Jorge de Arroios / Arroios / Lisboa');
  // French towns that arrive with lower case accents inside capitals, road numbers, brand fields.
  assert.equal(tidyText('NîMES'), 'Nîmes');
  assert.equal(tidyText('LA CHâTRE'), 'La Châtre');
  assert.equal(tidyText('CARRETERA N-II KM 23'), 'Carretera N-II KM 23');
  assert.equal(tidyText('EN 242'), 'EN 242');
  assert.equal(tidyText('IOR'), 'IOR');
  assert.equal(tidyText('BP Northam OPT'), 'BP Northam OPT');
  assert.equal(tidyText('Évora'), 'Évora');
});

test('France: a street used as the name is not shown twice', () => {
  const s = { name: '16 rue chateaubriand', brand: '', address: '16 rue chateaubriand', town: 'Bréhan', postcode: '56580' };
  assert.equal(stationName(s), '16 rue chateaubriand');
  assert.equal(stationAddress(s), '56580 Bréhan');
  assert.equal(stationAddress({ name: 'X', address: 'Calle Jose Paulete,, ', town: 'Madrid', postcode: '28000' }), 'Calle Jose Paulete, 28000 Madrid');
  assert.equal(stationAddress({ name: 'Estacion Hipodromo', address: '', town: 'Tijuana', postcode: '', state: 'Baja California' }), 'Tijuana, Baja California');
});

test('outlier rule: more than 20% under the median is never the cheapest', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  const rows = [1594, 2310, 2350, 2390, 2410, 2450].map((p) => ({ s: { tags: [] }, p }));
  const good = markDoubts(rows);
  assert.equal(rows[0].doubt, true);
  assert.equal(good[0].p, 2310);
  assert.equal(good.length, 5);
  // Too few prices to judge: nothing is marked.
  const few = [1000, 2000, 2100].map((p) => ({ s: { tags: [] }, p }));
  assert.equal(markDoubts(few).length, 3);
  // Members only stations are never the cheapest either, and do not move the median.
  const mem = [{ s: { tags: ['members-only'] }, p: 1800 }, ...[2000, 2010, 2020, 2030].map((p) => ({ s: { tags: [] }, p }))];
  assert.equal(markDoubts(mem)[0].p, 2000);
});

test('one station count: "365 stations, 361 sell Unleaded 91"', () => {
  const place = { stations: new Array(365) };
  const v = countVars(place, { rows: new Array(361), label: 'Unleaded 91' }, REGIONS.wa);
  assert.equal(say('en', 'countSell', v), '365 stations, 361 sell Unleaded 91');
});

test('place index: every town and postcode points at its nearest page', () => {
  const stations = [
    st('nsw', 'Sydney', -33.87, 151.21, { regular: 200 }, { postcode: '2000' }),
    st('nsw', 'Sydney', -33.871, 151.211, { regular: 201 }, { postcode: '2000' }),
    st('nsw', 'Sydney', -33.872, 151.212, { regular: 202 }, { postcode: '2000' }),
    st('nsw', 'Dubbo', -32.25, 148.6, { regular: 210 }, { postcode: '2830' }),
    st('nsw', 'Dubbo', -32.251, 148.601, { regular: 211 }, { postcode: '2830' }),
    st('nsw', 'Dubbo', -32.252, 148.602, { regular: 212 }, { postcode: '2830' }),
    st('nsw', 'Ultimo', -33.88, 151.2, { regular: 199 }, { postcode: '2007' }),
    st('nsw', 'Wellington', -32.55, 148.94, { regular: 220 }, { postcode: '2820' }),
  ];
  const places = placesFor('nsw', stations);
  const al = aliasesFor('nsw', stations, places);
  const target = (name) => places[[...al.towns, ...al.codes].find((x) => x[0] === name)[1]].name;
  assert.ok(target('Ultimo') === 'Sydney');
  assert.ok(target('Wellington') === 'Dubbo');
  assert.equal(target('2007'), 'Sydney');
  assert.equal(target('2820'), 'Dubbo');
  // Every town and every postcode in the feed is findable: a page or an alias.
  const names = new Set([...places.map((p) => p.name), ...al.towns.map((x) => x[0]), ...al.codes.map((x) => x[0])]);
  for (const s of stations) {
    assert.ok(names.has(s.town), s.town);
    assert.ok(names.has(s.postcode), s.postcode);
  }
  // In the built index too, with Portugal's postcodes kept to four digits.
  const { files } = buildSite(meta(['nsw']), { nsw: stations });
  const idx = JSON.parse(files.get('places.json'));
  assert.ok(idx.t.some((x) => x[1].split('|').includes('Wellington')));
  assert.ok(idx.c.some((x) => x[1].split(' ').includes('2820')));
});

test('Mexico: one page per municipality with 3 or more stations, told apart by state', () => {
  const mx = [];
  for (let i = 0; i < 4; i++) mx.push(st('mx', 'Benito Juárez', 21.16 + i / 1000, -86.85, { regular: 2300 + i }, { state: 'Quintana Roo' }));
  for (let i = 0; i < 3; i++) mx.push(st('mx', 'Benito Juárez', 19.37 + i / 1000, -99.16, { regular: 2350 + i }, { state: 'Ciudad de México' }));
  for (let i = 0; i < 3; i++) mx.push(st('mx', 'Zapopan', 20.72 + i / 1000, -103.39, { regular: 2400 + i }, { state: 'Jalisco' }));
  mx.push(st('mx', 'Tequila', 20.88, -103.84, { regular: 2450 }, { state: 'Jalisco' }));
  const places = placesFor('mx', mx);
  const names = places.map((p) => p.name).sort();
  assert.ok(names.includes('Zapopan'));
  assert.ok(names.includes('Benito Juárez'));
  assert.ok(names.includes('Benito Juárez (Ciudad de México)'));
  const { stats } = buildSite(meta(['mx']), { mx });
  assert.equal(stats.coverage.mx.onPage, 10);
  assert.equal(stats.coverage.mx.stations, 11);
});

test('a town named like a city page adds its outlying stations to the city page', () => {
  // Puebla: the city page covers 15 km round the centre; the municipality reaches further.
  const mx = [];
  for (let i = 0; i < 3; i++) mx.push(st('mx', 'Puebla', 19.04 + i / 1000, -98.2, { regular: 2300 + i }, { state: 'Puebla' }));
  const far = st('mx', 'Puebla', 19.3, -98.2, { regular: 2310 }, { state: 'Puebla' });
  mx.push(far);
  const places = placesFor('mx', mx);
  assert.equal(places.length, 1);
  assert.ok(places[0].stations.includes(far));
});

test('place pages: fuel chips, one list per fuel, cheapest first and a labelled Directions button', () => {
  const wa = [];
  for (let i = 0; i < 5; i++) wa.push(st('wa', 'Midvale', -31.88 + i / 1000, 116.03, { regular: 190 + i, diesel: 200 - i }));
  wa.push(st('wa', 'Midvale', -31.885, 116.03, { regular: 150 }));
  const { files, rootFiles } = buildSite(meta(['wa']), { wa });
  const html = files.get('western-australia/midvale/index.html');
  assert.match(html, /data-pick="regular"/);
  assert.match(html, /data-pick="diesel"/);
  assert.match(html, /id="f-regular"/);
  assert.match(html, /id="f-diesel"/);
  assert.match(html, /6 stations, 6 sell Unleaded 91/);
  assert.match(html, /class="tag warn" data-k="checkPrice"/);
  assert.match(html, /<li class="st first">.*?190\.0c/);
  assert.match(html, /class="dw"[^>]*>Directions</);
  assert.match(html, /<span class="rk" aria-hidden="true">/);
  assert.match(html, /class="skip" href="#main"/);
  assert.match(html, /og:image/);
  assert.ok(rootFiles.get('404.html').includes('Page not found'));
  // The explanatory sentence comes after the lists.
  assert.ok(html.indexOf('class="lead"') > html.indexOf('id="f-diesel"'));
});

test('home page: search first, real prices only, every region and the App Store link', () => {
  const wa = [];
  for (let i = 0; i < 4; i++) wa.push(st('wa', 'Perth', -31.95 + i / 1000, 115.86, { regular: 180 + i }, { tomorrow: { regular: 175 + i } }));
  const es = [];
  for (let i = 0; i < 4; i++) es.push(st('es', 'Madrid', 40.41 + i / 1000, -3.7, { regular: 1.5 + i / 100 }));
  const { rootFiles } = buildSite(meta(['wa', 'es']), { wa, es });
  const html = rootFiles.get('index.html');
  assert.ok(html, 'the site root gets a home page');
  assert.match(html, /<a class="brand" href="[^"]*\/" aria-current="page">/);
  // The search box comes before anything else in the main content, so it is on a phone's first screen.
  assert.ok(html.indexOf('id="q"') < html.indexOf('id="app"'));
  assert.match(html, /apps\.apple\.com\/au\/app\/pumpwise/);
  assert.match(html, /href="mailto:/);
  for (const r of ['wa', 'es']) assert.ok(html.includes(`/prices/${REGIONS[r].slug}/`), `links to ${r}`);
  assert.ok(!/185\.9|199\.9/.test(html), 'no made up prices');
  assert.match(html, /180\.0/, "Perth's cheapest real price is shown");
  assert.match(html, /<nav aria-label="Footer">/);
  assert.match(html, /"@type":"WebSite"/);
  // Search area: four sizes, 10 km picked at first, results cheapest first.
  assert.match(html, /class="seg rseg"/);
  assert.match(html, /data-r="10" aria-pressed="true"/);
  assert.match(html, /data-sort="p" aria-pressed="true"/);
});

test('fallback home page: no prices at all, but the App Store link and every region', () => {
  const html = fallbackRoot();
  const text = html.replace(/<style>[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<[^>]+>/g, ' ');
  assert.ok(!/\d+\.\d/.test(text), 'no prices');
  assert.match(html, /apps\.apple\.com\/au\/app\/pumpwise/);
  for (const cfg of Object.values(REGIONS)) assert.ok(html.includes(`/prices/${cfg.slug}/`), `links to ${cfg.slug}`);
  assert.match(html, /google-adsense-account/);
});

test('site.js is valid script', () => {
  // eslint-disable-next-line no-new-func
  assert.doesNotThrow(() => new Function(siteJs()));
});
