import * as Location from 'expo-location';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';

import { mockFeedFetch, resetStores, waDownMeta } from '../helpers';

jest.setTimeout(30_000);

const mockedLocation = Location as jest.Mocked<typeof Location>;

/** Presses a testID and lets React flush the resulting state updates and navigation. */
async function press(testID: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

function permission(granted: boolean, canAskAgain = true) {
  const response = { granted, status: granted ? 'granted' : 'denied', canAskAgain, expires: 'never' } as Location.LocationPermissionResponse;
  mockedLocation.getForegroundPermissionsAsync.mockResolvedValue(response);
  mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue(response);
}

function at(latitude: number, longitude: number) {
  const fix = { coords: { latitude, longitude, accuracy: 20 }, timestamp: 0 } as Location.LocationObject;
  mockedLocation.getCurrentPositionAsync.mockResolvedValue(fix);
}

describe('Pumpwise end to end (router)', () => {
  beforeEach(() => {
    resetStores({ onboardingComplete: false });
    permission(true);
    at(-31.9523, 115.8613);
  });

  test("first run in Perth: onboarding, fuel, location, cheapest and nearest, tomorrow's prices", async () => {
    mockFeedFetch();
    await renderRouter('./src/app', { initialUrl: '/' });

    await screen.findByTestId('onboarding');
    await press('onboarding-next');
    await press('onboarding-fuel-diesel');
    expect(useStore.getState().settings.fuel).toBe('diesel');
    await press('onboarding-next');
    await press('onboarding-allow');
    expect(mockedLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();

    await screen.findByTestId('nearby-screen');
    await screen.findByTestId('cheapest-card');
    expect(useLive.getState().feedStatus).toBe('ready');
    expect(useLive.getState().areaName).toBe('Perth');
    expect(screen.getByText('Diesel · DSL')).toBeTruthy();
    expect(screen.getByText('Within 8 km')).toBeTruthy();
    expect(screen.getByTestId('station-count').props.children.join('')).toMatch(/stations · 8 km/);
    // The fixture's tomorrow prices mostly drop 3c.
    expect(screen.getByTestId('trend-notice')).toBeTruthy();
    expect(screen.getAllByTestId('tomorrow-tag').length).toBeGreaterThan(0);
    expect(screen.getByTestId('source-link')).toBeTruthy();

    // The cheapest card's station page shows today's and tomorrow's prices.
    await press('cheapest-details');
    await screen.findByTestId('station-screen');
    expect(screen.getByTestId('price-board')).toBeTruthy();
    expect(screen.getByText('Tomorrow')).toBeTruthy();
    expect(screen.getByTestId('station-source')).toBeTruthy();
    await press('header-dismiss');
    await screen.findByTestId('nearby-screen');

    // Sorting and a wider area.
    await press('sort-distance');
    expect(useStore.getState().settings.sortBy).toBe('distance');
    await press('radius-chip');
    await press('radius-sheet-15');
    expect(useStore.getState().settings.radiusKm).toBe(15);
  });

  test('members-only stations are hidden until the driver says they are a member', async () => {
    mockFeedFetch();
    useStore.getState().completeOnboarding();
    useStore.getState().updateSettings({ radiusKm: 15 });
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('cheapest-card');
    expect(screen.getByTestId('cheapest-name').props.children).not.toBe('Bulk Club Perth Airport');
    await act(async () => {
      useStore.getState().updateSettings({ includeMembersOnly: true });
    });
    await waitFor(() => expect(screen.getByTestId('cheapest-name').props.children).toBe('Bulk Club Perth Airport'));
  });

  test('location refused for good: choose a suburb instead', async () => {
    mockFeedFetch();
    permission(false, false);
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });

    await screen.findByTestId('state-denied');
    expect(screen.getByTestId('open-settings')).toBeTruthy();
    await press('choose-place');
    await screen.findByTestId('place-screen');
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('place-search'), 'Cannington');
    });
    const result = await screen.findByTestId('place-result-Cannington', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.press(result);
    });
    await screen.findByTestId('cheapest-card');
    expect(useStore.getState().settings).toMatchObject({ locationMode: 'place', place: { name: 'Cannington' } });
  });

  test('somewhere not covered yet: offers Perth', async () => {
    mockFeedFetch();
    at(40.7128, -74.006);
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('state-not-covered');
    expect(screen.getByText('Pumpwise covers Western Australia')).toBeTruthy();
    await press('try-city');
    await screen.findByTestId('cheapest-card');
    expect(useStore.getState().settings.place?.name).toBe('Perth');
  });

  test('the region could not be collected', async () => {
    mockFeedFetch({ meta: waDownMeta() });
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('state-region-down');
  });

  test('no connection, then it comes back', async () => {
    mockFeedFetch({ offline: true });
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('state-error');
    mockFeedFetch();
    await press('retry');
    await screen.findByTestId('cheapest-card');
  });

  test('map and settings tabs', async () => {
    mockFeedFetch();
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/map' });
    await screen.findByTestId('map-screen');
    await screen.findByTestId('map-card');
    expect(screen.getByTestId('station-map')).toBeTruthy();

    await renderRouter('./src/app', { initialUrl: '/settings' });
    await screen.findByTestId('settings-screen');
    await screen.findByText('Showing Western Australia fuels and units.');
    await press('settings-fuel-super');
    await press('settings-economy-10');
    await press('settings-radius-25');
    expect(useStore.getState().settings).toMatchObject({ fuel: 'super', economyL100: 10, radiusKm: 25 });
    await act(async () => {
      fireEvent(screen.getByTestId('settings-members'), 'valueChange', true);
    });
    expect(useStore.getState().settings.includeMembersOnly).toBe(true);
    await press('settings-privacy');
    await screen.findByTestId('legal-screen');
  });
});
