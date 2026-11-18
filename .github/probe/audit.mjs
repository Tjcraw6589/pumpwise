const now = Date.now();
const feed = await (await fetch(`https://pumpwiseapp.com/data/v6/regions/it.json?t=${now}`)).json();
const get = async (f) => (await fetch(`https://cuxmtbyqffxgsdduhoad.supabase.co/functions/v1/it-open-data?f=${f}`, { headers: { 'x-region': 'eu-central-1' } })).text();
const prezzo = await get('prezzo'); const anag = await get('anagrafica');
const map = new Map(feed.map((s) => [s.id.slice(3), s]));
const raw = new Map();
for (const line of prezzo.split(/\r?\n/).slice(2)) { const [id, fuel, price, self] = line.split('|'); if (!id) continue; if (fuel !== 'Benzina' && fuel !== 'Gasolio') continue; const k = fuel === 'Benzina' ? 'regular' : 'diesel'; const e = raw.get(id) ?? {}; const cur = e[k]; const p = Number(price); if (!cur || (self === '1' && !cur.self) || ((self === '1') === cur.self && p < cur.p)) e[k] = { p, self: self === '1' }; raw.set(id, e); }
let compared = 0, match = 0, differ = 0; const diffs = [];
for (const [id, e] of raw) { const s = map.get(id); if (!s) continue; for (const k of ['regular', 'diesel']) { if (!e[k] || !s.prices[k]) continue; compared++; if (Math.abs(e[k].p * 100 - s.prices[k].p) < 0.06) match++; else { differ++; if (diffs.length < 6) diffs.push(`${id} ${k} raw=${e[k].p} feed=${s.prices[k].p}`); } } }
const reg = anag.split(/\r?\n/).slice(2).filter(Boolean); const regIds = new Set(reg.map((l) => l.split('|')[0])); const priced = new Set([...prezzo.split(/\r?\n/).slice(2).map((l) => l.split('|')[0])].filter(Boolean));
const pricedInReg = [...priced].filter((i) => regIds.has(i)); const missing = pricedInReg.filter((i) => !map.has(i));
const lineOf = new Map(reg.map((l) => [l.split('|')[0], l]));
const ages = { h48: 0, d7: 0, older: 0 }; const pos = new Map(); let noTown = 0; const med = {};
for (const s of feed) { const newest = Math.max(...Object.values(s.prices).map((p) => Date.parse(p.at))); const h = (now - newest) / 3600000; if (h <= 48) ages.h48++; else if (h <= 168) ages.d7++; else ages.older++; const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`; pos.set(key, (pos.get(key) ?? 0) + 1); if (!s.town) noTown++; for (const [k, p] of Object.entries(s.prices)) (med[k] ??= []).push(p.p); }
const m = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log('IT ' + JSON.stringify({ file: prezzo.split('\n', 1)[0], register: reg.length, pricedStations: priced.size, feed: feed.length, missingWithPrice: missing.length, compared, match, differ, ages, samePos: [...pos.values()].filter((n) => n > 1).length, noTown, kinds: Object.fromEntries(Object.entries(med).map(([k, l]) => [k, `${l.length}/min${Math.min(...l)}/med${m(l)}/max${Math.max(...l)}`])) }));
for (const d of diffs) console.log('ITDIFF ' + d);
const why = {}; for (const i of missing) { const l = lineOf.get(i).split('|'); const lat = Number(l[l.length - 2]), lng = Number(l[l.length - 1]); const fuels = prezzo.split(/\r?\n/).filter((x) => x.startsWith(i + '|')).map((x) => x.split('|')[1]); const k = !(lat && lng) ? 'no coordinates' : (lat < 35.4 || lat > 47.2 || lng < 6.5 || lng > 18.7) ? 'coordinates outside Italy' : fuels.every((f) => /metano|gnl|gnc/i.test(f)) ? 'natural gas only' : 'other'; why[k] = (why[k] ?? 0) + 1; if (k === 'other' && (why.shown ?? 0) < 5) { why.shown = (why.shown ?? 0) + 1; console.log('ITMISS ' + lineOf.get(i).slice(0, 160) + ' :: ' + fuels.join(',')); } }
console.log('ITWHY ' + JSON.stringify(why));
console.log('ITSAMPLE ' + JSON.stringify(feed[Math.floor(feed.length / 2)]).slice(0, 420));
