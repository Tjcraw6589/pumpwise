import { expect, test } from '@playwright/test';

/**
 * End-to-end smoke test against the exported web build (the same JavaScript that ships in the
 * iPhone app, rendered by React Native Web), using a made-up price feed served from dist/test-feed.
 * Build it first with `npm run export:web:test`.
 */

const PERTH = { latitude: -31.9523, longitude: 115.8613 };

test.describe('Pumpwise smoke', () => {
  test.use({ geolocation: PERTH, permissions: ['geolocation'] });

  test('first run through every screen', async ({ page }) => {
    await page.goto('/');

    // Onboarding: what it does, which fuel, location.
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await expect(page.getByText('Cheap fuel,')).toBeVisible();
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-fuel-regular').click();
    await page.getByTestId('onboarding-next').click();
    await expect(page.getByText('Find stations around you')).toBeVisible();
    await page.getByTestId('onboarding-allow').click();

    // Nearby: the cheapest within 8 km, tomorrow's prices and the list.
    const nearby = page.getByTestId('nearby-screen');
    await expect(nearby).toBeVisible();
    await expect(nearby.getByTestId('cheapest-card')).toBeVisible();
    await expect(nearby.getByText('Cheapest within 8 km')).toBeVisible();
    await expect(nearby.getByTestId('fuel-chip')).toContainText('Unleaded 91');
    await expect(nearby.getByTestId('station-count')).toContainText('stations · 8 km');
    await expect(nearby.getByTestId('trend-notice')).toContainText('Tomorrow');
    await expect(nearby.getByTestId('tomorrow-tag').first()).toBeVisible();
    await expect(nearby.getByText("Today's price").first()).toBeVisible();
    await expect(nearby.getByTestId('source-link')).toContainText('fuelwatch.wa.gov.au');

    // Station page with today's and tomorrow's prices.
    const name = await nearby.getByTestId('cheapest-name').innerText();
    await nearby.getByTestId('cheapest-details').click();
    await expect(page.getByTestId('station-screen')).toBeVisible();
    await expect(page.getByTestId('station-name')).toHaveText(name);
    await expect(page.getByTestId('price-board')).toContainText('Unleaded 91');
    await expect(page.getByTestId('price-board')).toContainText('Tomorrow');
    await expect(page.getByTestId('station-source')).toBeVisible();
    await page.getByTestId('header-dismiss').click();

    // Switch fuel from the chip.
    await nearby.getByTestId('fuel-chip').click();
    await page.getByTestId('fuel-sheet-diesel').click();
    await expect(nearby.getByTestId('fuel-chip')).toContainText('Diesel');
    await expect(nearby.getByTestId('cheapest-card')).toBeVisible();

    // Map tab: pins and the card for the cheapest.
    await page.getByRole('tab', { name: 'Map' }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await expect(page.getByTestId('map-card')).toBeVisible();
    const pins = page.locator('[data-testid^="map-pin-"]');
    expect(await pins.count()).toBeGreaterThan(3);
    // Pins can overlap; the last one drawn is on top, so it can always be tapped.
    const target = pins.last();
    const label = ((await target.getAttribute('aria-label')) ?? '').replace(/ pin$/, '');
    await target.click();
    await expect(page.getByTestId('map-card-name')).toHaveText(label);

    // Settings: WA units, dark mode, then search around Fremantle.
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(page.getByText('Showing Western Australia fuels and units.')).toBeVisible();
    await page.getByTestId('settings-economy-10').click();
    await page.getByTestId('theme-dark').click();
    await expect(page.getByTestId('settings-screen')).toHaveCSS('background-color', 'rgb(10, 15, 21)');
    await page.getByTestId('theme-light').click();
    await expect(page.getByTestId('settings-screen')).toHaveCSS('background-color', 'rgb(244, 241, 234)');
    await page.getByTestId('settings-place').click();
    await expect(page.getByTestId('place-screen')).toBeVisible();
    await page.getByTestId('city-Fremantle').click();

    await page.getByRole('tab', { name: 'Nearby' }).click();
    await expect(nearby.getByTestId('place-chip')).toContainText('Fremantle');
    await expect(nearby.getByTestId('cheapest-card')).toBeVisible();

    // Settings survive a fresh start; onboarding is not shown again. (Let the tab switch finish first.)
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await expect(page.getByTestId('onboarding')).toHaveCount(0);
    await expect(nearby.getByTestId('fuel-chip')).toContainText('Diesel');
    await expect(nearby.getByTestId('place-chip')).toContainText('Fremantle');
  });

  test('legal and about pages open from settings', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByTestId('settings-privacy').click();
    await expect(page.getByTestId('legal-screen')).toBeVisible();
    await expect(page.getByText('no adverts, no analytics and no tracking', { exact: false })).toBeVisible();
    await page.getByTestId('header-dismiss').click();
    await page.getByTestId('settings-about').click();
    await expect(page.getByTestId('about-screen')).toBeVisible();
    await expect(page.getByTestId('about-feed')).toContainText('100 stations');
    await expect(page.getByTestId('about-source-wa')).toContainText('fuelwatch.wa.gov.au');
  });
});

test.describe('elsewhere', () => {
  test.use({ geolocation: { latitude: 40.7128, longitude: -74.006 }, permissions: ['geolocation'] });

  test('outside the covered regions: look around Perth', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    // The browser already allows location here, so the app goes straight to the search.
    await expect(page.getByTestId('nearby-screen').getByTestId('state-not-covered')).toBeVisible();
    await expect(page.getByText('Pumpwise covers Western Australia')).toBeVisible();
    await page.getByTestId('nearby-screen').getByTestId('try-city').click();
    await expect(page.getByTestId('nearby-screen').getByTestId('cheapest-card')).toBeVisible();
  });
});

test.describe('without location', () => {
  test.use({ permissions: [] });

  test('location blocked: pick a city instead', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-skip').click();
    const nearby = page.getByTestId('nearby-screen');
    await expect(nearby.getByTestId('allow-location').or(nearby.getByTestId('state-denied'))).toBeVisible();
    await nearby.getByTestId('choose-place').click();
    await page.getByTestId('city-Perth').click();
    await expect(nearby.getByTestId('cheapest-card')).toBeVisible();
  });
});
