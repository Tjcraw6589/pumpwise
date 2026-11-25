import { buildLtDrafts, downloadLtWorkbook, LT_GEOCODE_URL, readLtWorkbook } from '../../scripts/feed/sources/lt.ts';
const now = new Date();
let t = Date.now();
const book = await downloadLtWorkbook();
console.log('downloaded', book.length, 'bytes in', Date.now() - t, 'ms'); t = Date.now();
const rows = await readLtWorkbook(book);
console.log('rows', rows.length, 'in', Date.now() - t, 'ms', 'rss', Math.round(process.memoryUsage().rss / 1e6), 'MB');
const drafts = buildLtDrafts(rows, now);
console.log('drafts', drafts.length);
const sample = drafts.filter((d, i) => i % 14 === 0 || d.lookups.length !== 2).slice(0, 110);
for (const d of sample) {
  const out: string[] = [];
  for (const a of d.lookups) {
    await new Promise((r) => setTimeout(r, 1100));
    const res = await fetch(`${LT_GEOCODE_URL}?format=jsonv2&limit=1&countrycodes=lt&q=${encodeURIComponent(a.q)}`, { headers: { 'User-Agent': 'Pumpwise-feed/2.0 (+https://pumpwiseapp.com/)' } });
    const body = (await res.json()) as { lat: string; lon: string; place_rank: number; type: string; display_name: string }[];
    const f = body[0];
    out.push(f ? `[${a.q}] r${f.place_rank} ${f.type} ${Number(f.lat).toFixed(4)},${Number(f.lon).toFixed(4)} ${f.display_name.slice(0, 70)}` : `[${a.q}] NONE`);
    if (f && f.place_rank >= a.minRank) break;
  }
  console.log('GEO', d.query, '=>', out.join(' || '));
}
