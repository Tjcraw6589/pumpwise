// Generates every image the app and the App Store need from the one vector mark in
// src/lib/mark.ts: the app icon (with iOS dark and tinted variants), splash images and favicon.
// Run: npm run assets
import { Buffer } from 'node:buffer';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { MARK } from '../src/lib/mark.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const INK = '#121B26';
const INK_DEEP = '#070B10';
const AMBER = '#FFB000';
const AMBER_HOT = '#FFC93D';
const LIGHT_BG = '#F4F1EA';
const DARK_BG = '#0A0F15';

/**
 * The mark: pin, drop and chevron.
 *  - pinFill: colour (or gradient url) of the pin
 *  - dropFill: colour of the drop cut into the pin
 *  - chevron: colour of the chevron inside the drop
 *  - scale: shrinks toward the centre
 */
function mark({ pinFill, dropFill, chevron, scale = 1, dy = 0 }) {
  return `<g transform="translate(500 ${500 + dy}) scale(${scale}) translate(-500 -500)">
    <path d="${MARK.pin}" fill="${pinFill}"/>
    <path d="${MARK.drop}" fill="${dropFill}"/>
    <path d="${MARK.chevron}" fill="none" stroke="${chevron}" stroke-width="${MARK.chevronWidth}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function svg(size, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1000 1000">${body}</svg>`;
}

const defs = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#1B2836"/>
    <stop offset="1" stop-color="${INK_DEEP}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.44" r="0.5">
    <stop offset="0" stop-color="${AMBER}" stop-opacity="0.34"/>
    <stop offset="0.55" stop-color="${AMBER}" stop-opacity="0.08"/>
    <stop offset="1" stop-color="${AMBER}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="pin" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${AMBER_HOT}"/>
    <stop offset="1" stop-color="#F29A00"/>
  </linearGradient>
</defs>`;

// A road running toward the horizon under the pin, with lane dashes: subtle depth on the icon.
const road = `<path d="M 380 1000 L 470 640 L 530 640 L 620 1000 Z" fill="#FFFFFF" opacity="0.05"/>
  <path d="M 500 930 L 500 990 M 500 820 L 500 860 M 500 740 L 500 765" stroke="${AMBER}" stroke-width="10" stroke-linecap="round" opacity="0.35"/>`;

async function render(name, size, body) {
  const file = join(out, name);
  await sharp(Buffer.from(svg(size, body))).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(`wrote assets/${name} (${size}x${size})`);
}

// 1. App icon: opaque square; iOS rounds the corners.
await render(
  'icon.png',
  1024,
  `${defs}<rect width="1000" height="1000" fill="url(#bg)"/>${road}<rect width="1000" height="1000" fill="url(#glow)"/>${mark({ pinFill: 'url(#pin)', dropFill: INK, chevron: AMBER, scale: 0.78, dy: -20 })}`,
);

// 2. iOS 18+ dark icon: transparent background, the system draws its own dark backdrop.
await render('icon-dark.png', 1024, `${defs}${mark({ pinFill: 'url(#pin)', dropFill: '#0B1118', chevron: AMBER, scale: 0.78, dy: -20 })}`);

// 3. iOS 18+ tinted icon: greyscale on black; the system applies the tint.
await render(
  'icon-tinted.png',
  1024,
  `<rect width="1000" height="1000" fill="#000000"/>${mark({ pinFill: '#FFFFFF', dropFill: '#000000', chevron: '#FFFFFF', scale: 0.78, dy: -20 })}`,
);

// 4. Splash images: transparent; the splash plugin places them on the background colour.
await render('splash-icon.png', 1024, `${defs}${mark({ pinFill: 'url(#pin)', dropFill: LIGHT_BG, chevron: INK, scale: 0.9 })}`);
await render('splash-icon-dark.png', 1024, `${defs}${mark({ pinFill: 'url(#pin)', dropFill: DARK_BG, chevron: AMBER, scale: 0.9 })}`);

// 5. Favicon for the web preview.
await render(
  'favicon.png',
  64,
  `${defs}<rect width="1000" height="1000" rx="200" fill="url(#bg)"/>${mark({ pinFill: 'url(#pin)', dropFill: INK, chevron: AMBER, scale: 0.95 })}`,
);
