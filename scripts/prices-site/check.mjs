// Browser check of the price pages built locally (run `npm run prices` first, from a copy of the live feed
// in out/site). Opens the home page, the 404 page and, for every region, its region page, its largest and
// its smallest place, at 360, 390, 768 and 1440 wide in light and dark, and fails when:
// - a page is wider than the screen;
// - on a phone (360 or 390) a link, button or field is smaller than 44 by 44;
// - a text and its background have less than 4.5 to 1 contrast;
// - on a place page at 360 or 390 the first station row is not fully on the first screen;
// - the search finds nothing for midland, 2000, cascais, merida or zapopan;
// - "Near me" (Lisbon, Perth, Madrid, Mexico City) lists no stations or its diesel chip does not filter;
// - after picking a language in the header, a text of another language is left on the page.
// Pages are served from out/site at their real address (https://tjcraw6589.github.io/pumpwise/...), so
// links and scripts behave as on the live site; the feed's tiles for "Near me" come from the live site.
//
// Usage: node scripts/prices-site/check.mjs [site folder, default out/site] [--shots folder] [--prefix name]
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

import { U } from './pages.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : null;
};
const shots = opt('--shots');
const prefix = opt('--prefix') ?? 'after';
const quick = args.includes('--shots-only') ? (args.splice(args.indexOf('--shots-only'), 1), true) : false;
const site = resolve(args[0] ?? 'out/site');
const ORIGIN = 'https://tjcraw6589.github.io';
const BASE = `${ORIGIN}/pumpwise/prices`;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.xml': 'application/xml' };

const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);

async function serve(context) {
  await context.route(`${ORIGIN}/pumpwise/**`, async (route) => {
    const url = new URL(route.request().url());
    const rel = decodeURIComponent(url.pathname.replace(/^\/pumpwise\//, ''));
    if (rel.startsWith('data/')) return route.continue();
    let file = join(site, rel);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return route.fulfill({ status: 404, contentType: TYPES['.html'], body: existsSync(join(site, '404.html')) ? readFileSync(join(site, '404.html')) : 'Not found' });
    return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) });
  });
}

// Which pages to open: from the search index, each region's largest and smallest place. For pictures
// only (--shots-only, also used on the old site), a fixed list.
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const pages = [{ name: 'home', url: `${BASE}/`, kind: 'home' }, { name: '404', url: `${ORIGIN}/pumpwise/prices/no-such-town/`, kind: 'home' }];
if (quick) {
  for (const [name, path] of [['wa-region', 'western-australia/'], ['wa-perth', 'western-australia/perth/'], ['es-region', 'spain/'], ['es-madrid', 'spain/madrid/'], ['mx-region', 'mexico/'], ['mx-zapopan', 'mexico/zapopan/'], ['mx-guadalajara', 'mexico/guadalajara/'], ['pt-lisboa', 'portugal/lisboa/'], ['fr-paris', 'france/paris/']]) pages.push({ name, url: `${BASE}/${path}`, kind: 'place' });
}
const idx = quick ? { r: [] } : JSON.parse(readFileSync(join(site, 'prices', 'places.json'), 'utf8'));
idx.r.forEach(([id, rslug], ri) => {
  const list = idx.p.filter((p) => p[1] === ri).sort((a, b) => b[3] - a[3]);
  pages.push({ name: `${id}-region`, url: `${BASE}/${rslug}/`, kind: 'region' });
  for (const p of [list[0], list[list.length - 1]]) pages.push({ name: `${id}-${p[2] || slug(p[0])}`, url: `${BASE}/${rslug}/${p[2] || slug(p[0])}/`, kind: 'place' });
});

const SIZES = [[360, 740], [390, 844], [768, 1024], [1440, 900]];

/** In the page: everything the layout rules check, returned as a list of problems. */
function audit(phone) {
  const out = [];
  const W = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > W + 1) out.push(`page is ${document.documentElement.scrollWidth} wide on a ${W} screen`);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && el.closest('[hidden]') == null && !el.closest('details:not([open]) > :not(summary)');
  };
  const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`;
  if (phone) {
    for (const el of document.querySelectorAll('a[href], button, summary, select, input')) {
      if (!visible(el) || el.classList.contains('skip')) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 43.5 || r.width < 43.5) out.push(`small tap area ${Math.round(r.width)}x${Math.round(r.height)} ${name(el)}`);
    }
  }
  const rgb = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return null;
    const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
  };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  const lum = (c) => {
    const f = (x) => {
      const s = x / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') || !visible(el)) continue;
    const own = [...el.childNodes].some((nd) => nd.nodeType === 3 && nd.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el);
    const fg = rgb(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    const a = lum(over(fg, bg));
    const b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) {
      const key = `${name(el)} ${ratio.toFixed(2)}`;
      if (!seen.has(key)) out.push(`contrast ${ratio.toFixed(2)} ${name(el)}`);
      seen.add(key);
    }
  }
  return out;
}

const browser = await chromium.launch();
const started = Date.now();
for (const scheme of ['light', 'dark']) {
  for (const [w, h] of SIZES) {
    if (quick && !(w === 390 || w === 1440)) continue;
    const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, locale: 'en-AU', reducedMotion: 'reduce' });
    await serve(context);
    const page = await context.newPage();
    for (const p of pages) {
      const where = `${p.name} ${w} ${scheme}`;
      await page.goto(p.url, { waitUntil: 'networkidle' });
      if (!quick) {
        for (const problem of await page.evaluate(audit, w <= 390)) fail(where, problem);
        if (p.kind === 'place' && w <= 390) {
          const r = await page.evaluate(() => {
            const el = document.querySelector('.lists .st');
            const b = el.getBoundingClientRect();
            return { bottom: b.bottom, h: innerHeight };
          });
          if (r.bottom > r.h) fail(where, `first station row ends at ${Math.round(r.bottom)}, below the ${r.h} screen`);
        }
      }
      if (shots && (w === 390 || w === 1440)) {
        mkdirSync(shots, { recursive: true });
        await page.screenshot({ path: join(shots, `${prefix}-${p.name}-${w}-${scheme}.png`), fullPage: w === 390 ? false : false });
      }
    }
    await context.close();
  }
}

if (!quick) {
  // Search: each word must lead somewhere.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-AU' });
  await serve(context);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  for (const q of ['midland', '2000', 'cascais', 'merida', 'zapopan', 'tlaquepaque', '3230-292', '28013', 'perth', 'madrid']) {
    await page.fill('#q', q);
    try {
      await page.waitForSelector('.hits a', { timeout: 5000 });
      const first = await page.locator('.hits a').first().innerText();
      console.log(`search "${q}": ${first.replace(/\s+/g, ' ')}`);
    } catch {
      fail('search', `nothing found for "${q}"`);
    }
  }
  // The header search button on a place page opens a search panel there.
  await page.goto(`${BASE}/western-australia/perth/`, { waitUntil: 'networkidle' });
  await page.click('a.findlink');
  if (!(await page.locator('#q').isVisible())) fail('search', 'header button did not open the search panel on a place page');
  await context.close();

  // Near me in four places: stations are listed and the diesel chip filters them.
  for (const [where, lat, lng] of [['Lisbon', 38.7223, -9.1393], ['Perth', -31.9523, 115.8613], ['Madrid', 40.4168, -3.7038], ['Mexico City', 19.4326, -99.1332]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: lat, longitude: lng }, permissions: ['geolocation'], locale: 'en-AU' });
    await serve(ctx);
    const pg = await ctx.newPage();
    await pg.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await pg.click('.nearbtn');
    try {
      await pg.waitForSelector('.nearres:not([hidden]) .list li', { timeout: 20000 });
      const before = await pg.locator('.nearres .list li').count();
      const diesel = pg.locator('.nearfuels [data-k2="diesel"]');
      if (!(await diesel.count())) {
        fail(`near ${where}`, 'no diesel chip');
      } else {
        await diesel.click();
        const unit = await pg.locator('.nearfuel').innerText();
        const pressed = await diesel.getAttribute('aria-pressed');
        const after = await pg.locator('.nearres .list li').count();
        const linked = await pg.locator('.nearres .list a.who').count();
        console.log(`near ${where}: ${before} stations, diesel chip shows ${after} (${unit}), ${linked} link to a place page`);
        if (pressed !== 'true' || !/diesel|gasóleo|gazole|diésel/i.test(unit) || !after) fail(`near ${where}`, 'diesel chip did not filter the list');
      }
      await pg.click('.seg [data-sort="p"]');
      const prices = await pg.locator('.nearres .list .pp').allInnerTexts();
      const nums = prices.map((t) => Number(t.replace(/[^0-9,.]/g, '').replace(',', '.')));
      if (nums.some((v, i) => i && v < nums[i - 1])) fail(`near ${where}`, `"Cheapest" sort is not in price order: ${prices.join(' ')}`);
    } catch (e) {
      fail(`near ${where}`, `no stations listed (${e.message.split('\n')[0]})`);
    }
    await ctx.close();
  }

  // Languages: after picking each language, no text of another language is left.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-AU' });
  await serve(ctx);
  const pg = await ctx.newPage();
  for (const url of [`${BASE}/spain/madrid/`, `${BASE}/western-australia/perth/`, `${BASE}/mexico/`, `${BASE}/`]) {
    await pg.goto(url, { waitUntil: 'networkidle' });
    for (const l of ['en', 'es', 'fr', 'pt']) {
      await pg.selectOption('select.lang', l);
      const text = await pg.evaluate(() => {
        const c = document.body.cloneNode(true);
        c.querySelectorAll('.credit, script, .who strong, .who .addr, .hits, .chips, .rows, .rank .nm, h1, [hidden]').forEach((x) => x.remove());
        return c.innerText;
      });
      for (const o of ['en', 'es', 'fr', 'pt']) {
        if (o === l) continue;
        for (const [k, v] of Object.entries(U[o])) {
          const fixed = String(v).split('{')[0].trim();
          if (fixed.length < 9 || fixed === String(U[l][k]).split('{')[0].trim()) continue;
          if (Object.values(U[l]).some((x) => String(x).includes(fixed))) continue;
          if (text.includes(fixed)) fail(`language ${l} ${url}`, `${o} text left: "${fixed}"`);
        }
      }
    }
  }
  await ctx.close();
}

await browser.close();
console.log(`Checked ${pages.length} pages at ${SIZES.length} sizes in light and dark in ${Math.round((Date.now() - started) / 1000)} s.`);
if (failures.length) {
  const counts = new Map();
  for (const f of failures) {
    const k = f.replace(/^\S+ \d+ (light|dark): /, '').replace(/\d+x\d+|\d+\.\d+/g, '#');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  console.log(`${failures.length} problems:`);
  for (const [k, c] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60)) console.log(`  ${c}x ${k}`);
  console.log('first examples:');
  for (const f of failures.slice(0, 25)) console.log(`  ${f}`);
  process.exit(1);
}
console.log('No problems found.');
