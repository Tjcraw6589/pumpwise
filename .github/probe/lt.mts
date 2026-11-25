import { buildLtDrafts, downloadLtWorkbook, LT_GEOCODE_URL, ltLookupResult, ltShortName, readLtWorkbook } from '../../scripts/feed/sources/lt.ts';
const now = new Date();
const rows = await readLtWorkbook(await downloadLtWorkbook());
const drafts = buildLtDrafts(rows, now);
console.log('drafts', drafts.length);
const ask = async (params: string) => {
  await new Promise((r) => setTimeout(r, 1100));
  const res = await fetch(`${LT_GEOCODE_URL}?format=jsonv2&countrycodes=lt&${params}`, { headers: { 'User-Agent': 'Pumpwise-feed/2.0 (+https://pumpwiseapp.com/)' } });
  return (await res.json()) as { lat: string; lon: string; place_rank: number; category: string; type: string; name: string; display_name: string }[];
};
const sample = drafts.filter((d, i) => i % 20 === 0 || !d.where.road).slice(0, 95);
let n = 0;
for (const d of sample) {
  const out: string[] = [];
  let at: { lat: number; lng: number; r: number } | null = null;
  for (const q of d.lookups) {
    const body = await ask(`limit=5&addressdetails=1&q=${encodeURIComponent(q)}`);
    at = ltLookupResult(body, d.where);
    const f = body[0];
    out.push(`[${q}] ${at ? `OK r${at.r} ${at.lat},${at.lng}` : 'no'} first=${f ? `r${f.place_rank} ${f.category}/${f.type} ${f.display_name.slice(0, 60)}` : 'NONE'}`);
    if (at) break;
  }
  if (at && at.r < 30 && n < 30) {
    n += 1;
    const box = `${at.lng - 0.05},${at.lat + 0.03},${at.lng + 0.05},${at.lat - 0.03}`;
    for (const q of ['degalinė', '[fuel]']) {
      const near = await ask(`limit=10&bounded=1&viewbox=${box}&q=${encodeURIComponent(q)}`);
      out.push(`NEAR ${q}: ${near.map((x) => `${x.type}:${x.name}@${Number(x.lat).toFixed(4)},${Number(x.lon).toFixed(4)}`).join('; ') || 'none'}`);
    }
  }
  console.log('GEO', at ? 'HIT' : 'MISS', ltShortName(d.station.brand), '|', d.query, '=>', out.join(' || '));
}
