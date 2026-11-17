import { gunzipSync } from 'node:zlib';
const UA = { 'User-Agent': 'Pumpwise audit (pumpwiseapp@gmail.com)', Accept: '*/*' };
const get = async (url, n = 1) => { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(90000) }); if (!r.ok) { if (n < 5) { await new Promise((ok) => setTimeout(ok, 8000)); return get(url, n + 1); } throw new Error(`HTTP ${r.status}`); } return r; };
const BASE = 'https://pumpwiseapp.com/data/v6'; const now = Date.now();
const meta = await (await get(`${BASE}/meta.json?t=${now}`)).json();
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const feed = {};
for (const id of ['qc', 'tw']) {
  const st = await (await get(`${BASE}/regions/${id}.json?t=${now}`)).json(); feed[id] = st;
  const byKind = {}; const pos = new Map(); const towns = {}; let noTown = 0, noName = 0, noAddr = 0, noPost = 0; const brands = {};
  for (const s of st) { for (const [k, p] of Object.entries(s.prices)) (byKind[k] ??= []).push(p.p); const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`; pos.set(key, (pos.get(key) ?? []).concat(s.name)); if (!s.town) noTown++; else towns[s.town] = (towns[s.town] ?? 0) + 1; if (!s.name) noName++; if (!s.address) noAddr++; if (!s.postcode) noPost++; brands[s.brand] = (brands[s.brand] ?? 0) + 1; }
  const dups = [...pos.entries()].filter(([, n]) => n.length > 1);
  console.log(`FEED ${id} stations=${st.length} updated=${meta.regions[id].updatedAt} noTown=${noTown} noName=${noName} noAddr=${noAddr} noPostcode=${noPost} samePos=${dups.length} towns=${Object.keys(towns).length}`);
  console.log('   kinds ' + Object.entries(byKind).map(([k, l]) => `${k}:${l.length}/min${Math.min(...l)}/med${median(l)}/max${Math.max(...l)}/odd${l.filter((p) => p > median(l) * 1.4 || p < median(l) * 0.7).length}`).join(' '));
  console.log('   topTowns ' + Object.entries(towns).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${t}:${n}`).join(', '));
  console.log('   oddTowns ' + Object.keys(towns).filter((t) => /\d|^.{0,2}$|.{31,}/.test(t)).slice(0, 25).join(' | '));
  console.log('   brands ' + Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t, n]) => `${t}:${n}`).join(', '));
  console.log('   dups ' + dups.slice(0, 6).map(([k, n]) => `${k} ${n.join(' / ')}`).join(' ;; '));
  console.log('   sample ' + JSON.stringify(st[Math.floor(st.length / 3)]).slice(0, 500));
}
// Quebec raw
{
  const buf = Buffer.from(await (await get('https://regieessencequebec.ca/stations.geojson.gz')).arrayBuffer());
  const j = JSON.parse(buf[0] === 0x1f ? gunzipSync(buf).toString('utf8') : buf.toString('utf8'));
  const key = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const map = new Map(); for (const s of feed.qc) map.set(key(s.lat, s.lng), (map.get(key(s.lat, s.lng)) ?? []).concat(s));
  const status = {}; const gas = {}; let compared = 0, match = 0, differ = 0, missing = 0, unavailable = 0, shownUnavailable = 0; const miss = []; const diffs = [];
  for (const f of j.features) {
    const p = f.properties; status[p.Status] = (status[p.Status] ?? 0) + 1;
    const [lng, lat] = f.geometry.coordinates; const cands = map.get(key(lat, lng)) ?? [];
    const s = cands.length > 1 ? cands.find((c) => c.postcode === p.PostalCode) ?? cands[0] : cands[0];
    if (!s) { missing++; if (miss.length < 12) miss.push(`${p.Name} | ${p.brand} | ${p.Status} | ${p.Address} | ${lat},${lng} | ${JSON.stringify(p.Prices).slice(0, 160)}`); continue; }
    for (const r of p.Prices ?? []) { gas[r.GasType] = (gas[r.GasType] ?? 0) + 1; const k = { 'Régulier': 'regular', Super: 'premium', Diesel: 'diesel' }[r.GasType]; if (!k) continue; if (!r.IsAvailable) { unavailable++; if (s.prices[k]) shownUnavailable++; continue; } const raw = Number(String(r.Price).replace('¢', '')); if (!s.prices[k]) { if (diffs.length < 8) diffs.push(`NOPRICE ${p.Name} ${k} raw=${r.Price}`); differ++; compared++; continue; } compared++; if (Math.abs(raw - s.prices[k].p) < 0.05) match++; else { differ++; if (diffs.length < 8) diffs.push(`${p.Name} ${k} raw=${r.Price} feed=${s.prices[k].p}`); } }
  }
  console.log('RAW qc ' + JSON.stringify({ generated: j.metadata?.generated_at, rawFeatures: j.features.length, status, gasTypes: gas, feed: feed.qc.length, missing, compared, match, differ, unavailable, shownUnavailable }));
  for (const m of miss) console.log('   QCMISS ' + m);
  for (const d of diffs) console.log('   QCDIFF ' + d);
}
// Taiwan raw
{
  const list = await (await get('https://vipmbr.cpc.com.tw/openData/MainProdListPrice')).json();
  console.log('RAW tw list ' + list.map((r) => `${r['產品名稱']}|${String(r['交貨地點']).trim()}|${r['計價單位']}|${r['參考牌價_金額']}|${r['牌價生效日期']}`).join(' ;; '));
  const xml = await (await get('https://vipmbr.cpc.com.tw/CPCSTN/STNWebService.asmx/getStationInfo_XML')).text();
  const f = (b, n) => (new RegExp(`<${n}>([\\s\\S]*?)</${n}>`).exec(b)?.[1] ?? '').trim();
  const blocks = xml.split('<Table>').slice(1); const kinds = {}; const counties = {}; const map = new Map(feed.tw.map((s) => [s.id, s])); let own = 0, ownOpen = 0, inFeed = 0, fuelMatch = 0, fuelDiff = 0; const miss = []; const diffs = [];
  for (const b of blocks) { const kind = f(b, '類別'); kinds[`${kind}/${f(b, '營業中')}`] = (kinds[`${kind}/${f(b, '營業中')}`] ?? 0) + 1; if (kind !== '自營站') continue; own++; if (f(b, '營業中') !== '1') continue; ownOpen++; counties[f(b, '縣市')] = (counties[f(b, '縣市')] ?? 0) + 1; const s = map.get(`tw-${f(b, '站代號')}`); if (!s) { if (miss.length < 10) miss.push(`${f(b, '站代號')} ${f(b, '站名')} ${f(b, '縣市')} ${f(b, '緯度')},${f(b, '經度')} 92=${f(b, '無鉛92')} 95=${f(b, '無鉛95')} 98=${f(b, '無鉛98')} 柴=${f(b, '超柴')}`); continue; } inFeed++; for (const [col, k] of [['無鉛92', 'regular'], ['無鉛95', 'premium'], ['無鉛98', 'super'], ['超柴', 'diesel']]) { if ((f(b, col) === '1') === !!s.prices[k]) fuelMatch++; else { fuelDiff++; if (diffs.length < 6) diffs.push(`${s.id} ${k} raw=${f(b, col)}`); } } }
  const unknownCounty = Object.keys(counties).filter((c) => !feed.tw.some((s) => s.address.startsWith(c) && s.town));
  console.log('RAW tw ' + JSON.stringify({ rows: blocks.length, kinds, ownStations: own, ownOpen, feed: feed.tw.length, inFeed, fuelMatch, fuelDiff, counties, unknownCounty, feedPrices: Object.fromEntries(['regular', 'premium', 'super', 'diesel'].map((k) => [k, [...new Set(feed.tw.filter((s) => s.prices[k]).map((s) => s.prices[k].p))]])) }));
  for (const m of miss) console.log('   TWMISS ' + m);
  for (const d of diffs) console.log('   TWDIFF ' + d);
}
