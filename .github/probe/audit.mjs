// One-off audit of the live feed against the raw sources. Independent of the feed's own parsers.
import { execSync } from 'node:child_process';
const BASE = 'https://pumpwiseapp.com/data/v6';
const UA = { 'User-Agent': 'Pumpwise audit (pumpwiseapp@gmail.com)', Accept: '*/*' };
const get = async (url, headers = {}, n = 1) => { const r = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(90000) }); if (!r.ok) { if (n < 5) { await new Promise((ok) => setTimeout(ok, 8000)); return get(url, headers, n + 1); } throw new Error(`HTTP ${r.status}`); } return r; };
const now = Date.now();
const meta = await (await get(`${BASE}/meta.json?t=${now}`)).json();
console.log('META', meta.generatedAt, Object.keys(meta.regions).join(','));
const feed = {};
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
for (const id of Object.keys(meta.regions)) {
  const st = await (await get(`${BASE}/regions/${id}.json?t=${now}`)).json();
  feed[id] = st;
  const ages = { h24: 0, d7: 0, d30: 0, older: 0 };
  const byKind = {}; const pos = new Map(); let noTown = 0, noName = 0, noAddr = 0;
  for (const s of st) {
    const newest = Math.max(...Object.values(s.prices).map((p) => Date.parse(p.at)));
    const h = (now - newest) / 3600000;
    if (h <= 24) ages.h24++; else if (h <= 168) ages.d7++; else if (h <= 720) ages.d30++; else ages.older++;
    for (const [k, p] of Object.entries(s.prices)) (byKind[k] ??= []).push(p.p);
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`; pos.set(key, (pos.get(key) ?? 0) + 1);
    if (!s.town) noTown++; if (!s.name) noName++; if (!s.address) noAddr++;
  }
  const dup = [...pos.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
  let out = 0; const kinds = [];
  for (const [k, list] of Object.entries(byKind)) { const m = median(list); const o = list.filter((p) => p > m * 1.5 || p < m * 0.6).length; out += o; kinds.push(`${k}:${list.length}/med${m}/odd${o}`); }
  console.log(`FEED ${id} stations=${st.length} age<=24h=${ages.h24} <=7d=${ages.d7} <=30d=${ages.d30} older=${ages.older} samePos=${dup} noTown=${noTown} noName=${noName} noAddr=${noAddr} oddPrices=${out} first=${st[0]?.id}`);
  console.log(`   ${kinds.join(' ')}`);
  console.log(`   status ${JSON.stringify(meta.regions[id]).slice(0, 300)}`);
}
const byId = (id) => new Map(feed[id].map((s) => [s.id, s]));
const report = (name, r) => console.log(`RAW ${name} ${JSON.stringify(r)}`);
const safe = async (name, fn) => { try { await fn(); } catch (e) { console.log(`RAW ${name} FAILED ${e.message}`); } };

await safe('es', async () => {
  const { stationInRegion: inRegion } = await import('../../src/lib/feed.ts');
  const body = await (await get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/', { Accept: 'application/json' })).json();
  const rows = body.ListaEESSPrecio; const map = byId('es');
  const num = (t) => (t ? Number(String(t).replace(',', '.')) : null);
  const road = ['Precio Gasolina 95 E5', 'Precio Gasolina 95 E10', 'Precio Gasolina 95 E5 Premium', 'Precio Gasolina 98 E5', 'Precio Gasolina 98 E10', 'Precio Gasoleo A', 'Precio Gasoleo Premium', 'Precio Gases licuados del petróleo', 'Precio Gasolina 95 E85'];
  let noRoad = 0, outside = 0, inside = 0, compared = 0, match = 0, differ = 0;
  for (const r of rows) {
    const s = map.get(`es-${r.IDEESS}`);
    if (!s) {
      if (!road.some((f) => r[f])) { noRoad++; continue; }
      const lat = num(r.Latitud), lng = num(r['Longitud (WGS84)']);
      const ok = lat !== null && lng !== null && inRegion('es', lat, lng);
      if (ok) inside++; else outside++;
      console.log(`ESMISS ${ok ? 'INSIDE' : 'OUTSIDE'} ${r.IDEESS} ${r['Rótulo']} | ${r.Municipio} | ${lat},${lng} | venta=${r['Tipo Venta']} | ${road.filter((f) => r[f]).map((f) => f.replace('Precio ', '') + '=' + r[f]).join('; ')}`);
      continue;
    }
    for (const [f, k] of [['Precio Gasoleo A', 'diesel'], ['Precio Gasolina 95 E5', 'regular']]) { const raw = num(r[f]); if (raw === null || !s.prices[k]) continue; compared++; if (Math.abs(raw * 100 - s.prices[k].p) < 0.05) match++; else differ++; }
  }
  report('es', { rawDate: body.Fecha, feedUpdated: meta.regions.es.updatedAt, feedGenerated: meta.generatedAt, rawRows: rows.length, feed: feed.es.length, missingNoRoadFuel: noRoad, missingOutsideBounds: outside, missingInside: inside, compared, match, differ });
});

if (0) await safe('fr', async () => {
  execSync('curl -sL -A "Pumpwise audit" -o /tmp/fr.zip https://donnees.roulez-eco.fr/opendata/instantane && cd /tmp && unzip -o -q fr.zip');
  const file = execSync('ls /tmp/*.xml | head -1').toString().trim();
  const xml = new TextDecoder('latin1').decode(execSync(`cat ${file}`, { maxBuffer: 1e9 }));
  const map = byId('fr'); const pdvs = xml.split('<pdv ').slice(1);
  let withPrice = 0, inFeed = 0, compared = 0, match = 0, differ = 0, recent = 0, recentMissing = 0; const diffs = []; const missing = [];
  for (const p of pdvs) {
    const id = /^id="(\d+)"/.exec(p)?.[1]; const prix = [...p.matchAll(/<prix nom="([^"]+)" id="\d+" maj="([^"]+)" valeur="([^"]+)"/g)];
    if (prix.length) withPrice++;
    const newest = Math.max(0, ...prix.map((m) => Date.parse(m[2].replace(' ', 'T') + '+01:00')));
    const isRecent = now - newest < 30 * 86400000; if (isRecent) recent++;
    const s = map.get(`fr-${id}`);
    if (!s) { if (isRecent) { recentMissing++; if (missing.length < 8) missing.push(`${id} lat=${/latitude="([^"]*)"/.exec(p)?.[1]} lng=${/longitude="([^"]*)"/.exec(p)?.[1]} ${prix.map((m) => m[1] + '=' + m[3]).join(' ')}`); } continue; }
    inFeed++;
    for (const m of prix) { const k = { Gazole: 'diesel', E10: 'regular' }[m[1]]; if (!k || !s.prices[k]) continue; compared++; if (Math.abs(Number(m[3]) * 100 - s.prices[k].p) < 0.05) match++; else { differ++; if (diffs.length < 6) diffs.push(`${id} ${k} raw=${m[3]} maj=${m[2]} feed=${s.prices[k].p} at=${s.prices[k].at}`); } }
  }
  report('fr', { rawStations: pdvs.length, rawWithPrice: withPrice, rawPriceWithin30d: recent, feed: feed.fr.length, rawInFeed: inFeed, recentMissing, compared, match, differ, missing, diffs });
});

await safe('pt', async () => {
  const body = await (await get('https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos?idsTiposComb=&idMarca=&idTipoPosto=&idDistrito=&idsMunicipios=&qtdPorPagina=20000&pagina=1', { Accept: 'application/json' })).json();
  const rows = body.resultado ?? body; const ids = new Set(rows.map((r) => r.Id)); const map = byId('pt');
  let compared = 0, match = 0, differ = 0; const diffs = []; const missing = [];
  for (const r of rows) {
    const s = map.get(`pt-${r.Id}`); if (!s) { if (missing.length < 8 && !missing.some((m) => m.startsWith(`${r.Id} `))) missing.push(`${r.Id} ${r.Nome} ${r.Municipio} ${r.Combustivel} ${r.Preco} ${r.DataAtualizacao} lat=${r.Latitude}`); continue; }
    const k = { 'Gasóleo simples': 'diesel', 'Gasolina simples 95': 'regular' }[r.Combustivel]; if (!k || !s.prices[k]) continue;
    const raw = Number(String(r.Preco).replace(/[^\d,.]/g, '').replace(',', '.')); compared++;
    if (Math.abs(raw * 100 - s.prices[k].p) < 0.05) match++; else { differ++; if (diffs.length < 6) diffs.push(`${r.Id} ${k} raw=${r.Preco} ${r.DataAtualizacao} feed=${s.prices[k].p} at=${s.prices[k].at}`); }
  }
  const gone = new Map(); for (const r of rows) if (!map.has(`pt-${r.Id}`)) { const g = gone.get(r.Id) ?? { n: r.Nome, m: r.Municipio, lat: r.Latitude, lng: r.Longitude, f: [] }; g.f.push(`${r.Combustivel}=${r.Preco}@${r.DataAtualizacao}`); gone.set(r.Id, g); }
  for (const [id, g] of gone) console.log(`PTMISS ${id} ${g.n} | ${g.m} | ${g.lat},${g.lng} | ${g.f.join('; ')}`);
  report('pt', { rawRows: rows.length, rawStations: ids.size, feed: feed.pt.length, missingFromFeed: [...ids].filter((i) => !map.has(`pt-${i}`)).length, compared, match, differ, missing, diffs });
});

if (0) await safe('mx', async () => {
  const places = await (await get('https://publicacionexterna.azurewebsites.net/publicaciones/places')).text();
  const prices = await (await get('https://publicacionexterna.azurewebsites.net/publicaciones/prices')).text();
  const placeIds = new Set([...places.matchAll(/<place place_id="(\d+)"/g)].map((m) => m[1]));
  const priced = new Map(); for (const blk of prices.split('<place ').slice(1)) { const id = /place_id="(\d+)"/.exec(blk)?.[1]; priced.set(id, [...blk.matchAll(/<gas_price type="(\w+)"[^>]*>([\d.]+)</g)].map((m) => [m[1], Number(m[2])])); }
  const map = byId('mx'); let compared = 0, match = 0, differ = 0, pricedInFeed = 0; const diffs = [];
  for (const [id, list] of priced) { const s = map.get(`mx-${id}`); if (!s) continue; pricedInFeed++; for (const [t, v] of list) { const k = { regular: 'regular', premium: 'premium', diesel: 'diesel' }[t]; if (!k || !s.prices[k]) continue; compared++; if (Math.abs(v * 100 - s.prices[k].p) < 0.6) match++; else { differ++; if (diffs.length < 6) diffs.push(`${id} ${k} raw=${v} feed=${s.prices[k].p} first=${s.id}`); } } }
  report('mx', { rawPlaces: placeIds.size, rawPriced: priced.size, pricedWithPlace: [...priced.keys()].filter((i) => placeIds.has(i)).length, feed: feed.mx.length, pricedInFeed, compared, match, differ, diffs, sampleFeedPrices: JSON.stringify(feed.mx[0].prices) });
});

if (0) await safe('dk-ok', async () => {
  const body = await (await get('https://mobility-prices.ok.dk/api/v1/fuel-prices', { Accept: 'application/json' })).json();
  const map = byId('dk'); let compared = 0, match = 0, differ = 0, missing = 0; const diffs = [];
  for (const r of body.items) { const s = map.get(`dk-ok-${r.facility_number ?? r.stationId ?? r.id}`); if (!s) { missing++; continue; } const vals = Object.values(s.prices).map((p) => p.p); for (const p of r.prices ?? []) { if (!/diesel|95/i.test(p.product_name ?? p.productName ?? '')) continue; compared++; if (vals.some((v) => Math.abs(v - Number(p.price) * 100) < 0.05)) match++; else { differ++; if (diffs.length < 6) diffs.push(`${s.id} ${p.product_name ?? p.productName}=${p.price} feed=${JSON.stringify(s.prices)}`); } } }
  report('dk-ok', { rawStations: body.items.length, missingFromFeed: missing, compared, match, differ, diffs, dkBrands: Object.entries(feed.dk.reduce((a, s) => ((a[s.brand] = (a[s.brand] ?? 0) + 1), a), {})) });
});

await safe('uk', async () => {
  const urls = { asda: 'https://storelocator.asda.com/fuel_prices_data.json', sgn: 'https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json', moto: 'https://moto-way.com/fuel-price/fuel_prices.json', tesco: 'https://www.tesco.com/fuel_prices/fuel_prices_data.json', rontec: 'https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json', applegreen: 'https://applegreenstores.com/fuel-prices/data.json', esso: 'https://fuelprices.esso.co.uk/latestdata.json', jet: 'https://jetlocal.co.uk/fuel_prices_data.json', mfg: 'https://fuel.motorfuelgroup.com/fuel_prices_data.json', bp: 'https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json', shell: 'https://www.shell.co.uk/fuel-prices-data.html', morrisons: 'https://www.morrisons.com/fuel-prices/fuel.json', sainsburys: 'https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json', ascona: 'https://fuelprices.asconagroup.co.uk/newfuel.json', karan: 'https://devapi.krlpos.com/integration/live_price/krl' };
  for (const [k, u] of Object.entries(urls)) { try { const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(30000) }); const t = await r.text(); let n = '-', upd = '-'; try { const j = JSON.parse(t); n = j.stations?.length; upd = j.last_updated; } catch {} console.log(`RAW uk ${k} http=${r.status} bytes=${t.length} stations=${n} last_updated=${upd}`); } catch (e) { console.log(`RAW uk ${k} failed ${e.message}`); } }
  console.log('RAW uk feed brands', JSON.stringify(Object.entries(feed.uk.reduce((a, s) => ((a[s.brand] = (a[s.brand] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 15)));
});
