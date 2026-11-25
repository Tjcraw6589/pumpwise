import { readFileSync } from 'node:fs';
import { buildLtDrafts, downloadLtWorkbook, lookUpLt, LT_GEOCODE_URL, type LtPlaces, readLtWorkbook } from '../../scripts/feed/sources/lt.ts';
const now = new Date();
const wanted = new Set(readFileSync(new URL('./misses.txt', import.meta.url), 'utf8').split('\n').filter(Boolean));
const drafts = buildLtDrafts(await readLtWorkbook(await downloadLtWorkbook()), now).filter((d) => wanted.has(d.query));
console.log('drafts', drafts.length);
for (const d of drafts) {
  const places: LtPlaces = {};
  const done = await lookUpLt([d], places, now, 100);
  const p = places[d.station.id];
  console.log('DBG', done.found ? `HIT r${p?.r} ${p?.lat},${p?.lng}` : 'MISS', d.where.brand, '|', d.query, '| road:', d.where.road, '| house:', d.where.house);
  if (done.found) continue;
  for (const q of d.lookups) {
    await new Promise((r) => setTimeout(r, 1100));
    const res = await fetch(`${LT_GEOCODE_URL}?format=jsonv2&limit=3&addressdetails=1&countrycodes=lt&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': 'Pumpwise-feed/2.0 (+https://pumpwiseapp.com/)' } });
    const body = (await res.json()) as { category: string; type: string; name: string; place_rank: number; display_name: string; address: Record<string, string> }[];
    console.log('   Q', q, '=>', body.length ? '' : 'NONE');
    for (const f of body) console.log('      ', `r${f.place_rank} ${f.category}/${f.type} name=${f.name} road=${f.address.road} no=${f.address.house_number} pc=${f.address.postcode} :: ${f.display_name.slice(0, 110)}`);
  }
}
