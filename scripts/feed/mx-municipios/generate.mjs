// One-off generator for scripts/feed/data/mx-municipios.json.gz, the offline lookup that gives each
// Mexican station its municipality and state (the CNE/CRE station list has only a name and a
// position). Run by hand when INEGI publishes a new Marco Geoestadístico; the feed job never runs it.
//
//   node scripts/feed/mx-municipios/generate.mjs                 downloads what it needs (about 47 MB)
//   node scripts/feed/mx-municipios/generate.mjs --from <dir>    uses 00mun.shp, 00mun.dbf and 00ent.dbf in <dir>
//   --tolerance <metres>                                         simplification tolerance (default 100)
//
// Source: INEGI, Marco Geoestadístico 2024 (Marco Geoestadístico Integrado, agosto 2024), layers
// 00mun (áreas geoestadísticas municipales) and 00ent (estatales). Only the municipal layer and the
// state names are read, straight out of INEGI's 3.3 GB download with HTTP range requests.
// Licence: Términos de Libre Uso de la Información del INEGI (https://www.inegi.org.mx/inegi/terminos.html):
// free to copy, adapt and use commercially, naming INEGI as the source and saying what was changed.
// What is changed here: boundaries simplified (Douglas-Peucker on shared arcs, so neighbours keep a
// common border) and rounded to 0.0001 degrees. INEGI notes these geostatistical areas are not an
// official source for Mexico's political-administrative divisions.
import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, inflateRawSync } from 'node:zlib';

const ZIP_URL =
  'https://www.inegi.org.mx/contenidos/productos/prod_serv/contenidos/espanol/bvinegi/productos/geografia/marcogeo/794551132173_s.zip';
const INNER_ZIP = 'mg_2024_integrado.zip';
const WANTED = ['conjunto_de_datos/00mun.shp', 'conjunto_de_datos/00mun.dbf', 'conjunto_de_datos/00ent.dbf'];
export const ATTRIBUTION =
  'Fuente: INEGI, Marco Geoestadístico 2024 (Marco Geoestadístico Integrado, agosto 2024). Límites municipales simplificados y redondeados por Pumpwise.';
/** Coordinates are stored as whole numbers of this many degrees. */
const STEP = 1e-4;

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, '..', 'data', 'mx-municipios.json.gz');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// ---------------------------------------------------------------------------------------------
// Download: the outer zip stores each part uncompressed, so the inner zip and the three files in
// it can be read with range requests instead of fetching 3.3 GB.
// ---------------------------------------------------------------------------------------------

async function range(start, end) {
  const response = await fetch(ZIP_URL, { headers: { Range: `bytes=${start}-${end}` } });
  if (response.status !== 206) throw new Error(`INEGI download: HTTP ${response.status} (expected 206 for a range)`);
  return { buf: Buffer.from(await response.arrayBuffer()), total: Number((response.headers.get('content-range') ?? '').split('/')[1]) };
}

async function zipEntries(base, size) {
  const read = async (s, e) => (await range(base + s, base + e)).buf;
  const tail = await read(Math.max(0, size - 65_557), size - 1);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('zip: no end of central directory');
  let count = tail.readUInt16LE(eocd + 10);
  let cdSize = tail.readUInt32LE(eocd + 12);
  let cdOff = tail.readUInt32LE(eocd + 16);
  if (eocd >= 20 && tail.readUInt32LE(eocd - 20) === 0x07064b50) {
    const at = Number(tail.readBigUInt64LE(eocd - 12));
    const z = await read(at, at + 55);
    count = Number(z.readBigUInt64LE(32));
    cdSize = Number(z.readBigUInt64LE(40));
    cdOff = Number(z.readBigUInt64LE(48));
  }
  const cd = await read(cdOff, cdOff + cdSize - 1);
  const entries = [];
  for (let n = 0, p = 0; n < count; n++) {
    const nameLen = cd.readUInt16LE(p + 28);
    const extraLen = cd.readUInt16LE(p + 30);
    const entry = {
      name: cd.subarray(p + 46, p + 46 + nameLen).toString('latin1'),
      method: cd.readUInt16LE(p + 10),
      csize: cd.readUInt32LE(p + 20),
      off: cd.readUInt32LE(p + 42),
    };
    const extra = cd.subarray(p + 46 + nameLen, p + 46 + nameLen + extraLen);
    for (let e = 0; e < extra.length; e += 4 + extra.readUInt16LE(e + 2)) {
      if (extra.readUInt16LE(e) !== 1) continue;
      let q = e + 4;
      if (cd.readUInt32LE(p + 24) === 0xffffffff) q += 8;
      if (entry.csize === 0xffffffff) { entry.csize = Number(extra.readBigUInt64LE(q)); q += 8; }
      if (entry.off === 0xffffffff) entry.off = Number(extra.readBigUInt64LE(q));
    }
    entries.push(entry);
    p += 46 + nameLen + extraLen + cd.readUInt16LE(p + 32);
  }
  return entries;
}

async function dataStart(base, entry) {
  const header = (await range(base + entry.off, base + entry.off + 29)).buf;
  return base + entry.off + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
}

async function download(dir) {
  mkdirSync(dir, { recursive: true });
  const total = (await range(0, 0)).total;
  const inner = (await zipEntries(0, total)).find((e) => e.name === INNER_ZIP);
  if (!inner || inner.method !== 0) throw new Error(`${INNER_ZIP} not found (or compressed) in the INEGI download`);
  const base = await dataStart(0, inner);
  const entries = await zipEntries(base, inner.csize);
  for (const name of WANTED) {
    const entry = entries.find((e) => e.name === name);
    if (!entry) throw new Error(`${name} not found in ${INNER_ZIP}`);
    const start = await dataStart(base, entry);
    const raw = (await range(start, start + entry.csize - 1)).buf;
    const file = join(dir, name.split('/').pop());
    writeFileSync(file, entry.method === 8 ? inflateRawSync(raw) : raw);
    console.log(`downloaded ${file} (${statSync(file).size} bytes)`);
  }
}

// ---------------------------------------------------------------------------------------------
// Reading the shapefile and its attribute tables (the DBFs are Latin-1, per INEGI's .cpg files).
// ---------------------------------------------------------------------------------------------

function readDbf(file) {
  const b = readFileSync(file);
  const count = b.readUInt32LE(4);
  const headerLen = b.readUInt16LE(8);
  const recordLen = b.readUInt16LE(10);
  const fields = [];
  for (let p = 32; b[p] !== 0x0d; p += 32) fields.push({ name: b.subarray(p, p + 11).toString('latin1').replace(/\0.*$/, ''), len: b[p + 16] });
  const rows = [];
  for (let i = 0; i < count; i++) {
    let o = headerLen + i * recordLen + 1;
    const row = {};
    for (const f of fields) {
      row[f.name] = b.subarray(o, o + f.len).toString('latin1').trim();
      o += f.len;
    }
    rows.push(row);
  }
  return rows;
}

/** Each record's rings, in metres (INEGI's Lambert conformal conic), without the closing point. */
function readShp(file) {
  const b = readFileSync(file);
  const records = [];
  for (let p = 100; p + 8 <= b.length; ) {
    const contentLen = b.readUInt32BE(p + 4) * 2;
    const r = p + 8;
    const type = b.readInt32LE(r);
    const rings = [];
    if (type === 5) {
      const numParts = b.readInt32LE(r + 36);
      const numPoints = b.readInt32LE(r + 40);
      const parts = [];
      for (let i = 0; i < numParts; i++) parts.push(b.readInt32LE(r + 44 + 4 * i));
      const pts = r + 44 + 4 * numParts;
      for (let i = 0; i < numParts; i++) {
        const end = i + 1 < numParts ? parts[i + 1] : numPoints;
        const ring = [];
        for (let k = parts[i]; k < end; k++) {
          const x = b.readDoubleLE(pts + 16 * k);
          const y = b.readDoubleLE(pts + 16 * k + 8);
          const last = ring[ring.length - 1];
          if (!last || last[0] !== x || last[1] !== y) ring.push([x, y]);
        }
        if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop();
        if (ring.length >= 3) rings.push(ring);
      }
    }
    records.push(rings);
    p = r + contentLen;
  }
  return records;
}

// Inverse Lambert conformal conic (two standard parallels) on GRS 1980, from 00mun.prj:
// central meridian -102, parallels 17.5 and 29.5, origin 12 N, false easting 2,500,000 m.
const A = 6378137;
const F = 1 / 298.257222101;
const E = Math.sqrt(2 * F - F * F);
const rad = Math.PI / 180;
const mOf = (phi) => Math.cos(phi) / Math.sqrt(1 - E * E * Math.sin(phi) ** 2);
const tOf = (phi) => Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * Math.sin(phi)) / (1 + E * Math.sin(phi))) ** (E / 2);
const [P1, P2, P0, L0] = [17.5 * rad, 29.5 * rad, 12 * rad, -102 * rad];
const N = (Math.log(mOf(P1)) - Math.log(mOf(P2))) / (Math.log(tOf(P1)) - Math.log(tOf(P2)));
const FF = mOf(P1) / (N * tOf(P1) ** N);
const RHO0 = A * FF * tOf(P0) ** N;

function toLngLat(x, y) {
  const dx = x - 2_500_000;
  const dy = RHO0 - y;
  const rho = Math.sign(N) * Math.hypot(dx, dy);
  const t = (rho / (A * FF)) ** (1 / N);
  const theta = Math.atan2(dx, dy);
  let phi = Math.PI / 2 - 2 * Math.atan(t);
  for (let i = 0; i < 10; i++) {
    const s = E * Math.sin(phi);
    phi = Math.PI / 2 - 2 * Math.atan(t * ((1 - s) / (1 + s)) ** (E / 2));
  }
  return [(theta / N + L0) / rad, phi / rad];
}

// ---------------------------------------------------------------------------------------------
// Simplification. Neighbouring municipalities share exactly the same vertices along their common
// border, so each ring is cut into arcs at the points where the set of rings using a vertex changes,
// and every arc is simplified the same way from whichever side it is met. Borders stay shared, so
// simplifying leaves no gaps or overlaps between neighbours.
// ---------------------------------------------------------------------------------------------

const keyOf = (p) => `${p[0]},${p[1]}`;
const cmpKey = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);

function douglasPeucker(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [ax, ay] = points[s];
    const [bx, by] = points[e];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    let best = -1;
    let bestDist = tolerance;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = points[i];
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dx * (py - ay) - dy * (px - ax)) / len;
      if (d > bestDist) { bestDist = d; best = i; }
    }
    if (best >= 0) {
      keep[best] = 1;
      stack.push([s, best], [best, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplifies one arc in a fixed direction, so the same arc gives the same points from either side. */
function simplifyArc(arc, tolerance) {
  const first = arc[0];
  const last = arc[arc.length - 1];
  let order = cmpKey(first, last);
  if (order === 0 && arc.length > 2) order = cmpKey(arc[1], arc[arc.length - 2]);
  if (order <= 0) return douglasPeucker(arc, tolerance);
  return douglasPeucker([...arc].reverse(), tolerance).reverse();
}

function simplifyAll(records, tolerance) {
  const users = new Map();
  records.forEach((rings, r) =>
    rings.forEach((ring, k) => {
      for (const p of ring) {
        const key = keyOf(p);
        const list = users.get(key);
        const id = `${r}:${k}`;
        if (!list) users.set(key, [id]);
        else if (!list.includes(id)) list.push(id);
      }
    }),
  );
  const signature = (p) => users.get(keyOf(p)).slice().sort().join('|');
  let shared = 0;
  for (const list of users.values()) if (list.length > 1) shared++;
  console.log(`${users.size} distinct vertices, ${shared} shared by two or more rings`);
  return records.map((rings) =>
    rings.map((ring) => {
      const n = ring.length;
      const sig = ring.map(signature);
      const fixed = [];
      for (let i = 0; i < n; i++) {
        if (sig[i] !== sig[(i + n - 1) % n] || sig[i] !== sig[(i + 1) % n] || sig[i].split('|').length > 2) fixed.push(i);
      }
      if (fixed.length === 0) {
        let lowest = 0;
        for (let i = 1; i < n; i++) if (cmpKey(ring[i], ring[lowest]) < 0) lowest = i;
        fixed.push(lowest);
      }
      const out = [];
      for (let f = 0; f < fixed.length; f++) {
        const start = fixed[f];
        const end = fixed[(f + 1) % fixed.length];
        const arc = [];
        for (let i = start; ; i = (i + 1) % n) {
          arc.push(ring[i]);
          if (arc.length > 1 && i === end) break;
        }
        const simple = simplifyArc(arc, tolerance);
        out.push(...simple.slice(0, -1));
      }
      return out.length >= 3 ? out : ring;
    }),
  );
}

// ---------------------------------------------------------------------------------------------

async function main() {
  const tolerance = Number(arg('--tolerance') ?? 100);
  let dir = arg('--from');
  if (!dir) {
    dir = join(tmpdir(), 'pumpwise-inegi-mg2024');
    if (!WANTED.every((name) => existsSync(join(dir, name.split('/').pop())))) await download(dir);
  }
  const states = new Map(readDbf(join(dir, '00ent.dbf')).map((row) => [row.CVE_ENT, row.NOMGEO]));
  const rows = readDbf(join(dir, '00mun.dbf'));
  const records = readShp(join(dir, '00mun.shp'));
  if (rows.length !== records.length) throw new Error(`00mun: ${rows.length} rows but ${records.length} shapes`);
  const simple = simplifyAll(records, tolerance);

  const stateCodes = [...states.keys()].sort();
  const municipios = [];
  let vertices = 0;
  let before = 0;
  rows.forEach((row, i) => {
    const state = stateCodes.indexOf(row.CVE_ENT);
    if (state < 0) throw new Error(`no state ${row.CVE_ENT} for ${row.CVEGEO}`);
    before += records[i].reduce((sum, ring) => sum + ring.length, 0);
    const rings = [];
    for (const ring of simple[i]) {
      const flat = [];
      let px = 0;
      let py = 0;
      let prevX = NaN;
      let prevY = NaN;
      for (const p of ring) {
        const [lng, lat] = toLngLat(p[0], p[1]);
        const x = Math.round(lng / STEP);
        const y = Math.round(lat / STEP);
        if (x === prevX && y === prevY) continue;
        flat.push(x - px, y - py);
        px = x;
        py = y;
        prevX = x;
        prevY = y;
      }
      if (flat.length >= 6) {
        rings.push(flat);
        vertices += flat.length / 2;
      }
    }
    municipios.push([row.NOMGEO, state, row.CVEGEO, ...rings]);
  });
  municipios.sort((a, b) => a[2].localeCompare(b[2]));

  const data = {
    source: 'INEGI, Marco Geoestadístico 2024 (Marco Geoestadístico Integrado, agosto 2024), capas 00mun y 00ent',
    licence: 'Términos de Libre Uso de la Información del INEGI, https://www.inegi.org.mx/inegi/terminos.html',
    attribution: ATTRIBUTION,
    note: 'Simplified (Douglas-Peucker, shared borders kept) and rounded; not an official source of political-administrative boundaries.',
    tolerance,
    step: STEP,
    format: 'municipios: [name, state index, CVEGEO, ...rings]; each ring is [lng, lat, dlng, dlat, ...] in steps, the first pair absolute and the rest differences',
    states: stateCodes.map((code) => states.get(code)),
    municipios,
  };
  const json = JSON.stringify(data);
  const gz = gzipSync(json, { level: 9 });
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, gz);
  console.log(`${municipios.length} municipalities, ${before} vertices simplified to ${vertices} at ${tolerance} m`);
  console.log(`wrote ${outFile}: ${json.length} bytes of JSON, ${gz.length} gzipped`);
}

await main();
