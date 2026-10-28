// Writes a made-up feed (see fixture-data.ts) for the web smoke test.
// Usage: node scripts/feed/fixture.ts <output folder>
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { fixtureFeed } from './fixture-data.ts';

const target = resolve(process.argv[2] ?? 'out/fixture-feed');
const feed = fixtureFeed(new Date());

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

writeJson(join(target, 'meta.json'), feed.meta);
for (const tile of feed.tiles) writeJson(join(target, 'tiles', `${tile.tile}.json`), tile);
console.log(`Fixture feed: ${feed.meta.stationCount} stations in ${feed.tiles.length} tiles at ${target}`);
