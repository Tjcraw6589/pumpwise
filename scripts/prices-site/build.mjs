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

const { files, rootFiles, urls, stats } = buildSite(meta, byRegion);

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
// logo.png (512 px app icon) is the site's logo in its structured data; search engines want at least 112 px.
const logo = resolve(here, 'logo.png');
if (existsSync(logo)) copyFileSync(logo, join(staging, 'logo.png'));
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

// IndexNow (free; used by Bing, Yandex, Seznam and Naver): once a day, tell them every page has new prices,
// so they recrawl without anyone signing up anywhere. The key file is site/54129a3d111a725ab0bf97e07105c9e7.txt. The date of the
// last ping travels with the site itself (indexnow-last.txt), so the 15 minute runs ping only once a day.
// Nothing here can stop the pages from publishing: any problem is only logged.
const INDEXNOW_KEY = '54129a3d111a725ab0bf97e07105c9e7';
const HOST = 'pumpwiseapp.com';
try {
  const today = new Date(meta.generatedAt).toISOString().slice(0, 10);
  // null when the live site could not be asked (then this run skips the ping rather than risk repeating it)
  const last = await fetch(`https://${HOST}/indexnow-last.txt`, { signal: AbortSignal.timeout(10000) })
    .then((r) => (r.ok ? r.text() : r.status === 404 ? '' : null)).catch(() => null);
  if (last === null) {
    console.log('IndexNow: could not read the last ping date; trying again on the next run');
  } else if (last.trim() === today) {
    writeFileSync(join(site, 'indexnow-last.txt'), today);
  } else {
    const list = [`https://${HOST}/`, ...urls];
    let sent = 0;
    for (let i = 0; i < list.length; i += 10000) {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`, urlList: list.slice(i, i + 10000) }),
        signal: AbortSignal.timeout(20000),
      });
      console.log(`IndexNow: ${r.status} for ${list.slice(i, i + 10000).length} pages`);
      if (r.ok) sent += 1;
    }
    writeFileSync(join(site, 'indexnow-last.txt'), sent ? today : last.trim());
  }
} catch (e) {
  console.log(`IndexNow skipped: ${e.message}`);
}

