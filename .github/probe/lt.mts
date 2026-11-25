import { readFileSync } from 'node:fs';
import { buildLtDrafts, downloadLtWorkbook, lookUpLt, type LtPlaces, readLtWorkbook, writeLtPlaces } from '../../scripts/feed/sources/lt.ts';
const now = new Date();
const drafts = buildLtDrafts(await readLtWorkbook(await downloadLtWorkbook()), now);
console.log('drafts', drafts.length);
const places: LtPlaces = {};
const done = await lookUpLt(drafts, places, now, 100_000);
console.log('found', done.found, 'missed', done.missed, 'house or station level', Object.values(places).filter((p) => p.r === 30).length, 'road level', Object.values(places).filter((p) => p.r === 26).length, 'village level', Object.values(places).filter((p) => p.r !== undefined && p.r < 26).length);
for (const d of drafts) if (places[d.station.id]?.miss) console.log('MISS', d.station.brand, '|', d.query);
for (const d of drafts) { const p = places[d.station.id]; if (p && p.r !== undefined && p.r < 30) console.log('COARSE', p.r, d.station.brand, '|', d.query, '|', p.lat, p.lng); }
writeLtPlaces('/tmp/lt-places.json', places);
for (const line of readFileSync('/tmp/lt-places.json', 'utf8').split('\n')) console.log('PLACE ' + line);
