// Writes site/index.html, the root page used only when the price step fails (see fallbackRoot in pages.mjs),
// and site/favicon.png beside it. Run after changing the root page's texts or the site's styles:
//   node scripts/prices-site/fallback.mjs
import { copyFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fallbackRoot } from './pages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
writeFileSync(resolve(root, 'site/index.html'), fallbackRoot());
copyFileSync(resolve(root, 'assets/favicon.png'), resolve(root, 'site/favicon.png'));
console.log('Wrote site/index.html and site/favicon.png');
