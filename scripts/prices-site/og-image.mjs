// Draws og.png, the 1200 by 630 picture shown when a price page is shared (Facebook, X, WhatsApp...).
// The same picture serves every page. It is drawn from plain HTML with the system's own fonts by the
// Playwright browser the tests already use, then committed, so nothing outside the repo is needed.
//
// Usage: node scripts/prices-site/og-image.mjs   (writes scripts/prices-site/og.png)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = join(dirname(fileURLToPath(import.meta.url)), 'og.png');
const pin = '<svg viewBox="0 0 32 32" width="132" height="132"><rect width="32" height="32" rx="8" fill="#101820"/><path d="M16 4.5c-5.2 0-9.3 4-9.3 9.1 0 6.7 7.9 13.3 8.4 13.7.5.4 1.3.4 1.8 0 .5-.4 8.4-7 8.4-13.7 0-5.1-4.1-9.1-9.3-9.1z" fill="#FFB000"/><path d="M16 8.4c-.2 0-.4.1-.5.3-1.2 1.6-3.6 5-3.6 6.9a4.1 4.1 0 0 0 8.2 0c0-1.9-2.4-5.3-3.6-6.9-.1-.2-.3-.3-.5-.3z" fill="#101820"/><path d="M14.3 15.3l1.3 1.3 2.2-2.4" fill="none" stroke="#FFB000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;background:#101820;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#F3F0E8;overflow:hidden}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between;border-bottom:14px solid #FFB000}
.brand{display:flex;align-items:center;gap:28px;font-size:72px;font-weight:800;letter-spacing:-1px}
h1{margin:0;font-size:62px;line-height:1.08;font-weight:800;max-width:15ch;letter-spacing:-1px}
p{margin:14px 0 0;font-size:30px;color:#C9D1DB}
.sign{position:absolute;right:72px;top:150px;width:400px;background:#05090D;border:2px solid #24303C;border-top:10px solid #FFB000;border-radius:24px;padding:22px 30px}
.row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:2px solid #1A2430}
.row:last-child{border:0}
.row span{font-size:26px;color:#C9D1DB;font-weight:600}
.row b{font:700 46px/1 "Arial Narrow","Roboto Condensed",sans-serif;color:#3BE38C;letter-spacing:1px}
</style></head><body><div class="wrap">
<div class="brand">${pin}<span>Pumpwise</span></div>
<div><h1>Today's cheapest fuel near you</h1><p>Official prices by town and city, updated through the day</p></div>
</div>
<div class="sign"><div class="row"><span>Official prices</span><b>✓</b></div><div class="row"><span>Nearest station</span><b>✓</b></div><div class="row"><span>Cheapest station</span><b>✓</b></div></div>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('wrote', out);
