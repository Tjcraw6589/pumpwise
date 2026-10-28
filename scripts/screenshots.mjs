// Screenshots of every main screen from the exported web build, in light and dark mode.
// Requires `npm run export:web:test` first (dist/ with the made-up feed in dist/test-feed).
// Usage: node scripts/screenshots.mjs [review|store]
//   review: 390x844 at 2x into out/screens/ for checking the design
//   store:  App Store sizes into store/screenshots/<device>/ (light mode only)
// The web build renders the same React Native code as the iPhone app. The map tab on the web is a
// schematic preview, so store screenshots of the map should come from the real app.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4176;
const BASE = `http://127.0.0.1:${PORT}`;
const mode = process.argv[2] === 'store' ? 'store' : 'review';

const DEVICES =
  mode === 'store'
    ? [
        { name: 'iphone-6.9', width: 440, height: 956, scale: 3 },
        { name: 'iphone-6.5', width: 428, height: 926, scale: 3 },
      ]
    : [{ name: 'review', width: 390, height: 844, scale: 2 }];
const THEMES = mode === 'store' ? ['light'] : ['light', 'dark'];
const STORE_SKIP = new Set(['03-location', '05-list', '07-map', '10-about', '11-not-covered']);

function settings(theme, extra = {}) {
  return JSON.stringify({
    state: {
      settings: {
        fuel: 'regular',
        radiusKm: 8,
        fillLitres: 40,
        economyL100: 8,
        includeMembersOnly: false,
        sortBy: 'price',
        theme,
        directionsApp: 'apple',
        onboardingComplete: true,
        locationMode: 'gps',
        place: null,
        recentPlaces: [],
        ...extra,
      },
    },
    version: 2,
  });
}

const server = spawn(process.execPath, [join(root, 'scripts', 'serve-dist.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((resolve) => setTimeout(resolve, 800));

const browser = await chromium.launch();
try {
  for (const device of DEVICES) {
    for (const theme of THEMES) {
      const outDir = mode === 'store' ? join(root, 'store', 'screenshots', device.name) : join(root, 'out', 'screens', theme);
      mkdirSync(outDir, { recursive: true });
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
        isMobile: true,
        hasTouch: true,
        colorScheme: theme,
        geolocation: { latitude: -31.9523, longitude: 115.8613 },
        permissions: ['geolocation'],
      });
      const page = await context.newPage();
      const shot = async (name) => {
        // Store sets leave out the web-only map preview and the states nobody needs to see in a listing.
        if (mode === 'store' && STORE_SKIP.has(name)) return;
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(outDir, `${name}.png`) });
        console.log(`${device.name} ${theme} ${name}`);
      };

      // Onboarding (fresh install).
      await page.goto(BASE);
      await page.getByTestId('onboarding').waitFor();
      await shot('01-welcome');
      await page.getByTestId('onboarding-next').click();
      await shot('02-fuel');
      await page.getByTestId('onboarding-next').click();
      await shot('03-location');

      // Main screens with settings in place.
      await page.evaluate((value) => localStorage.setItem('pumpwise-settings', value), settings(theme));
      await page.goto(BASE);
      await page.getByTestId('nearby-screen').getByTestId('cheapest-card').waitFor();
      await shot('04-nearby');
      await page.getByTestId('nearby-screen').getByTestId('sort').scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 420);
      await shot('05-list');
      await page.getByTestId('nearby-screen').getByTestId('cheapest-details').click();
      await page.getByTestId('price-board').waitFor();
      await shot('06-station');
      await page.getByTestId('header-dismiss').click();
      await page.getByRole('tab', { name: 'Map' }).click();
      await page.getByTestId('map-card').waitFor();
      await shot('07-map');
      await page.getByRole('tab', { name: 'Settings' }).click();
      await shot('08-settings');
      await page.getByTestId('settings-place').click();
      await page.getByTestId('place-screen').waitFor();
      await shot('09-place');
      await page.goto(`${BASE}/about`);
      await page.getByTestId('about-screen').waitFor();
      await shot('10-about');

      // States: somewhere not covered yet.
      await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
      await page.goto(BASE);
      await page.getByTestId('state-not-covered').waitFor();
      await shot('11-not-covered');
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
