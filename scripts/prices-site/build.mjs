// Writes the fuel price pages (see pages.mjs) into the website folder the feed job has just built.
//
// Usage: node scripts/prices-site/build.mjs [site folder, default out/site]
// Reads <site>/data/v<newest>/meta.json and regions/<id>.json, writes <site>/prices/.
// The feed job runs this as a separate step that is allowed to fail: if anything goes wrong here the
// price feed and the rest of the site are published exactly as before, without the price pages.
import { Buffer } from 'node:buffer';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSite } from './pages.mjs';

const site = resolve(process.argv[2] ?? 'out/site');
const dataRoot = join(site, 'data');
const versions = readdirSync(dataRoot)
  .map((name) => Number(/^v(\d+)$/.exec(name)?.[1]))
  .filter((n) => Number.isFinite(n))
  .sort((a, b) => b - a);
const dataDir = versions.map((v) => join(dataRoot, `v${v}`)).find((dir) => existsSync(join(dir, 'regions')));
if (!dataDir) throw new Error(`No data/v*/regions folder under ${site}`);

const meta = JSON.parse(readFileSync(join(dataDir, 'meta.json'), 'utf8'));
const byRegion = {};
for (const id of Object.keys(meta.regions ?? {})) {
  const file = join(dataDir, 'regions', `${id}.json`);
  if (existsSync(file)) byRegion[id] = JSON.parse(readFileSync(file, 'utf8'));
}

const { files, rootFiles, stats } = buildSite(meta, byRegion);

// Written beside the final folder and swapped in at the end, so a failure never leaves half a site.
const target = join(site, 'prices');
const staging = join(site, '.prices-staging');
rmSync(staging, { recursive: true, force: true });
let bytes = 0;
for (const [path, text] of files) {
  const file = join(staging, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  bytes += Buffer.byteLength(text);
}
// The app icon is the favicon of every page; og.png (drawn by og-image.mjs) is the picture shown when a
// page is shared.
const here = dirname(fileURLToPath(import.meta.url));
const icon = resolve(here, '../../assets/favicon.png');
if (existsSync(icon)) copyFileSync(icon, join(staging, 'favicon.png'));
const og = resolve(here, 'og.png');
if (existsSync(og)) copyFileSync(og, join(staging, 'og.png'));
rmSync(target, { recursive: true, force: true });
renameSync(staging, target);
// Pages at the site root: 404.html, which GitHub Pages shows for any address that does not exist, and
// robots.txt.
for (const [path, text] of rootFiles) writeFileSync(join(site, path), text);
console.log(
  `Price pages: ${stats.pages} pages (${stats.places} places in ${stats.regions} regions, ${stats.stations} stations), ` +
    `${(bytes / 1e6).toFixed(1)} MB, ${stats.doubts} prices marked "Check price", ${stats.aliases} towns and postcodes in the search` +
    `${stats.skipped.length ? `; not published by licence: ${stats.skipped.join(', ')}` : ''}`,
);
