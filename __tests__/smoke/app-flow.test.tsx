import * as Location from 'expo-location';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';

import { mockFeedFetch, notLiveMeta, resetStores } from '../helpers';

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
    at(51.5072, -0.1276);
  });

  test('first run: onboarding, fuel, location, then the cheapest and nearest stations', async () => {
    mockFeedFetch();
    await renderRouter('./src/app', { initialUrl: '/' });

    await screen.findByTestId('onboarding');
    await press('onboarding-next');
    await press('onboarding-fuel-B7');
    expect(useStore.getState().settings.fuel).toBe('B7');
    await press('onboarding-next');
    await press('onboarding-allow');
    expect(mockedLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();

    await screen.findByTestId('nearby-screen');
    await screen.findByTestId('cheapest-card');
    const cheapest = useLive.getState();
    expect(cheapest.feedStatus).toBe('ready');
    expect(cheapest.areaName).toBe('Westminster');
    expect(screen.getByTestId('station-count').props.children.join('')).toMatch(/stations · 5 mi/);
    expect(screen.getByText('Diesel · B7')).toBeTruthy();

    // The cheapest card's station page shows the full price board.
    await press('cheapest-details');
    await screen.findByTestId('station-screen');
    expect(screen.getByTestId('price-board')).toBeTruthy();
    expect(screen.getByTestId('station-freshness')).toBeTruthy();
    await press('header-dismiss');
    await screen.findByTestId('nearby-screen');

    // Sorting and a wider area.
    await press('sort-distance');
    expect(useStore.getState().settings.sortBy).toBe('distance');
    await press('radius-chip');
    await press('radius-sheet-10');
    expect(useStore.getState().settings.radiusMiles).toBe(10);
  });

  test('location refused for good: choose a city instead', async () => {
    mockFeedFetch();
    permission(false, false);
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });

    await screen.findByTestId('state-denied');
    expect(screen.getByTestId('open-settings')).toBeTruthy();
    await press('choose-place');
    await screen.findByTestId('place-screen');
    await press('city-Leeds');
    await screen.findByTestId('cheapest-card');
    expect(useStore.getState().settings).toMatchObject({ locationMode: 'place', place: { name: 'Leeds' } });
    expect(screen.getByTestId('place-chip')).toBeTruthy();
  });

  test('outside the UK: offers a UK city', async () => {
    mockFeedFetch();
    at(40.7128, -74.006);
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('state-outside-uk');
    await press('try-london');
    await screen.findByTestId('cheapest-card');
  });

  test('the feed is not switched on yet', async () => {
    mockFeedFetch({ meta: notLiveMeta() });
    useStore.getState().completeOnboarding();
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('state-not-live');
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

    await act(async () => {
      useStore.getState().updateSettings({ theme: 'dark' });
    });
    await renderRouter('./src/app', { initialUrl: '/settings' });
    await screen.findByTestId('settings-screen');
    await press('settings-fuel-E5');
    await press('settings-mpg-60');
    expect(useStore.getState().settings).toMatchObject({ fuel: 'E5', mpg: 60 });
    await press('settings-privacy');
    await screen.findByTestId('legal-screen');
    await waitFor(() => expect(screen.getByText(/never sent to us or stored by us/)).toBeTruthy());
  });
});
