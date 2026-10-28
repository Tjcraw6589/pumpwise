import { expect, type Page, test } from '@playwright/test';

/**
 * End-to-end smoke test against the exported web build (the same JavaScript that ships in the
 * iPhone app, rendered by React Native Web), using a made-up price feed served from dist/test-feed.
 * Build it first with `npm run export:web:test`.
 */

const WESTMINSTER = { latitude: 51.5072, longitude: -0.1276 };

async function mockPlaceSearch(page: Page) {
  await page.route('https://api.postcodes.io/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/postcodes/')) {
      await route.fulfill({ json: { status: 200, result: { postcode: 'LS1 4AP', latitude: 53.7981, longitude: -1.5472, admin_district: 'Leeds' } } });
    } else {
      await route.fulfill({ json: { status: 200, result: [] } });
    }
  });
}

test.describe('Pumpwise smoke', () => {
  test.use({ geolocation: WESTMINSTER, permissions: ['geolocation'] });

  test('first run through every screen', async ({ page }) => {
    await mockPlaceSearch(page);
    await page.goto('/');

    // Onboarding: what it does, which fuel, location.
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await expect(page.getByText('Cheap fuel,')).toBeVisible();
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-fuel-E10').click();
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByText('Find stations around you')).toBeVisible();
    await page.getByTestId('onboarding-allow').click();

    // Nearby: the cheapest within 5 miles and the list.
    await expect(page.getByTestId('nearby-screen')).toBeVisible();
    await expect(page.getByTestId('cheapest-card')).toBeVisible();
    await expect(page.getByText('Cheapest within 5 mi')).toBeVisible();
    await expect(page.getByTestId('station-count')).toContainText('stations · 5 mi');
    await expect(page.getByText(/Reported .* ago/).first()).toBeVisible();
    await expect(page.getByTestId('report-link')).toBeVisible();

    // Station page with every fuel.
    const name = await page.getByTestId('cheapest-name').innerText();
    await page.getByTestId('cheapest-details').click();
    await expect(page.getByTestId('station-screen')).toBeVisible();
    await expect(page.getByTestId('station-name')).toHaveText(name);
    await expect(page.getByTestId('price-board')).toContainText('Unleaded');
    await expect(page.getByTestId('station-report')).toBeVisible();
    await page.getByTestId('header-dismiss').click();

    // Switch fuel from the chip.
    await page.getByTestId('nearby-screen').getByTestId('fuel-chip').click();
    await page.getByTestId('fuel-sheet-B7').click();
    await expect(page.getByTestId('nearby-screen').getByTestId('fuel-chip')).toContainText('Diesel');
    await expect(page.getByTestId('cheapest-card')).toBeVisible();

    // Map tab: pins and the card for the cheapest.
    await page.getByRole('tab', { name: 'Map' }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await expect(page.getByTestId('map-card')).toBeVisible();
    const pins = page.locator('[data-testid^="map-pin-"]');
    expect(await pins.count()).toBeGreaterThan(3);
    await pins.nth(2).click();
    await expect(page.getByTestId('map-card')).toContainText('Selected station');

    // Settings: dark mode, then search around a postcode.
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByTestId('theme-dark').click();
    await expect(page.getByTestId('settings-screen')).toHaveCSS('background-color', 'rgb(10, 15, 21)');
    await page.getByTestId('theme-light').click();
    await expect(page.getByTestId('settings-screen')).toHaveCSS('background-color', 'rgb(244, 241, 234)');
    await page.getByTestId('settings-place').click();
    await expect(page.getByTestId('place-screen')).toBeVisible();
    await page.getByTestId('place-search').fill('LS1 4AP');
    await page.getByTestId('place-result-LS1 4AP').click();

    await page.getByRole('tab', { name: 'Nearby' }).click();
    const nearby = page.getByTestId('nearby-screen');
    await expect(nearby.getByTestId('place-chip')).toContainText('LS1 4AP');
    await expect(nearby.getByTestId('cheapest-card')).toBeVisible();

    // Settings survive a reload; onboarding is not shown again.
    await page.reload();
    await expect(page.getByTestId('onboarding')).toHaveCount(0);
    await expect(nearby.getByTestId('fuel-chip')).toContainText('Diesel');
    await expect(nearby.getByTestId('place-chip')).toContainText('LS1 4AP');
  });

  test('legal pages open from settings', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByTestId('settings-privacy').click();
    await expect(page.getByTestId('legal-screen')).toBeVisible();
    await expect(page.getByText('no adverts, no analytics and no tracking', { exact: false })).toBeVisible();
    await page.getByTestId('header-dismiss').click();
    await page.getByTestId('settings-about').click();
    await expect(page.getByTestId('about-screen')).toBeVisible();
    await expect(page.getByTestId('about-feed')).toContainText('54 forecourts');
  });
});

test.describe('without location', () => {
  test.use({ permissions: [] });

  test('location blocked: pick a city instead', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    // The browser denies location, so the app offers a place instead.
    const allow = page.getByTestId('allow-location');
    const denied = page.getByTestId('state-denied');
    await expect(allow.or(denied)).toBeVisible();
    await page.getByTestId('choose-place').click();
    await page.getByTestId('city-London').click();
    await expect(page.getByTestId('cheapest-card')).toBeVisible();
  });
});
