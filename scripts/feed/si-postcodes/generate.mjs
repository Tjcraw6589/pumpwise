// One off generator for scripts/feed/sources/si-postcodes.ts, the table that gives each Slovenian
// station a town: goriva.si lists a street and a postcode but no place name. Run by hand when the
// postcodes change; the feed job never runs it.
//
//   node scripts/feed/si-postcodes/generate.mjs                  downloads SI.zip (about 9 KB)
//   node scripts/feed/si-postcodes/generate.mjs --from <file>    uses a saved SI.zip or SI.txt
//
// Source: GeoNames postal code files, https://download.geonames.org/export/zip/SI.zip
// Licence: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/), as the
// readme inside the zip says. Credit: GeoNames (geonames.org), CC BY 4.0.
// The file is tab separated UTF-8: country code, postal code, place name, then administrative names
// and a position that are not used here. Slovenia has one row per postcode and the place name is the
// post office. What is changed here: the notes Pošta Slovenije adds to some names are dropped
// (" - dostava" for delivery, " - poštni predali" for PO boxes, " (sezonska pošta)" for a seasonal
// office), so 1000 and 1001 both read "Ljubljana". Two language names stay as they are
// ("Koper/Capodistria", "Lendava/Lendva").
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const ZIP_URL = 'https://download.geonames.org/export/zip/SI.zip';
const USER_AGENT = 'Pumpwise-feed/2.0 (+https://pumpwiseapp.com/)';
/** Slovenia has about 550 postcodes; far fewer means the file is not what it was. */
const MIN_POSTCODES = 400;

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, '..', 'sources', 'si-postcodes.ts');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Every file in a small zip, by name (central directory, stored or deflated entries). */
function unzip(zip) {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const files = new Map();
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = 0; n < zip.readUInt16LE(eocd + 10); n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('zip central directory not found');
    const method = zip.readUInt16LE(p + 10);
    const size = zip.readUInt32LE(p + 20);
    const nameLength = zip.readUInt16LE(p + 28);
    const local = zip.readUInt32LE(p + 42);
    const name = zip.subarray(p + 46, p + 46 + nameLength).toString('utf8');
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const body = zip.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error(`unsupported zip compression method ${method}`);
    files.set(name, method === 0 ? body : inflateRawSync(body));
    p += 46 + nameLength + zip.readUInt16LE(p + 30) + zip.readUInt16LE(p + 32);
  }
  return files;
}

/** Stops if the readme no longer states the licence and the column order this script relies on. */
function checkReadme(readme) {
  if (!/Creative Commons Attribution 4\.0/i.test(readme)) throw new Error('readme: the CC BY 4.0 licence line is missing; check the licence before using this file');
  const fields = [...readme.matchAll(/^(country code|postal code|place name)\s*:/gm)].map((m) => m[1]);
  if (fields.join(',') !== 'country code,postal code,place name') throw new Error('readme: the first three columns are no longer country code, postal code, place name');
}

/** "Ljubljana - dostava" and "Strunjan/Strugnano (sezonska pošta)" to the plain post office name. */
function postOfficeName(raw) {
  return raw
    .replace(/\s+-\s+(dostava|poštni predali)\s*$/i, '')
    .replace(/\s*\(sezonska pošta\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The table from the text of SI.txt: postcode to post office name, the first row for a postcode winning. */
function readPostcodes(text) {
  const table = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [country, code, place] = line.split('\t');
    if (country !== 'SI') throw new Error(`unexpected country code in: ${line}`);
    if (!/^\d{4}$/.test(code ?? '')) throw new Error(`unexpected postcode in: ${line}`);
    const name = postOfficeName(place ?? '');
    if (!name) throw new Error(`no place name in: ${line}`);
    if (!table.has(code)) table.set(code, name);
  }
  if (table.size < MIN_POSTCODES) throw new Error(`only ${table.size} postcodes; expected at least ${MIN_POSTCODES}`);
  return new Map([...table].sort(([a], [b]) => a.localeCompare(b)));
}

function render(table, date) {
  const quote = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const lines = [...table].map(([code, name]) => `  ${quote(code)}: ${quote(name)},`);
  return `// Slovenia: every postcode and the name of its post office, so a station can show its town
// (goriva.si gives a street and a postcode only). ${table.size} postcodes.
// Made by scripts/feed/si-postcodes/generate.mjs on ${date}; do not edit by hand.
//
// Source: GeoNames postal code files, ${ZIP_URL}
// Licence: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/
// Credit: GeoNames (geonames.org), CC BY 4.0. Changed by Pumpwise: delivery, PO box and seasonal
// office notes dropped from the names.

export const SI_POSTCODES_ATTRIBUTION = 'GeoNames (geonames.org), CC BY 4.0';

export const SI_POSTCODES: Record<string, string> = {
${lines.join('\n')}
};
`;
}

async function main() {
  const from = arg('--from');
  let text;
  if (from && /\.txt$/i.test(from)) {
    text = readFileSync(from, 'utf8');
  } else {
    let zip;
    if (from) {
      zip = readFileSync(from);
    } else {
      const response = await fetch(ZIP_URL, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`GeoNames download: HTTP ${response.status}`);
      zip = Buffer.from(await response.arrayBuffer());
    }
    const files = unzip(zip);
    const readme = files.get('readme.txt');
    const data = files.get('SI.txt');
    if (!readme || !data) throw new Error('SI.zip should hold readme.txt and SI.txt');
    checkReadme(readme.toString('utf8'));
    text = data.toString('utf8');
  }
  const table = readPostcodes(text);
  writeFileSync(outFile, render(table, new Date().toISOString().slice(0, 10)));
  console.log(`si-postcodes: ${table.size} postcodes written to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
