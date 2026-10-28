import { CITY_PRESETS, type Place } from '@/lib/places';
import { createDefaultSettings, sanitizeSettings, useStore } from '@/store/useStore';

import { resetStores } from '../helpers';

describe('settings', () => {
  beforeEach(() => resetStores({ onboardingComplete: true }));

  test('defaults suit a typical UK petrol car', () => {
    expect(createDefaultSettings()).toMatchObject({ fuel: 'E10', radiusMiles: 5, fillLitres: 40, mpg: 45, sortBy: 'price', locationMode: 'gps' });
  });

  test('odd saved values fall back to defaults', () => {
    const fixed = sanitizeSettings({
      fuel: 'LPG' as never,
      radiusMiles: 7,
      fillLitres: 0,
      mpg: 900,
      sortBy: 'random' as never,
      theme: 'neon' as never,
      directionsApp: 'bing' as never,
      locationMode: 'place',
      place: null,
    });
    expect(fixed).toMatchObject({ fuel: 'E10', radiusMiles: 5, fillLitres: 40, mpg: 45, sortBy: 'price', theme: 'system', directionsApp: 'apple', locationMode: 'gps' });
    expect(sanitizeSettings(undefined)).toEqual(createDefaultSettings());
  });

  test('choosing places keeps five recent ones without repeats', () => {
    const places: Place[] = [...CITY_PRESETS];
    for (const p of places) useStore.getState().choosePlace(p);
    useStore.getState().choosePlace(places[3] as Place);
    const { settings } = useStore.getState();
    expect(settings.locationMode).toBe('place');
    expect(settings.place?.name).toBe(places[3]?.name);
    expect(settings.recentPlaces).toHaveLength(5);
    expect(settings.recentPlaces[0]?.name).toBe(places[3]?.name);
    expect(new Set(settings.recentPlaces.map((p) => p.name)).size).toBe(5);
    useStore.getState().followMyLocation();
    expect(useStore.getState().settings.locationMode).toBe('gps');
  });

  test('reset keeps onboarding done', () => {
    useStore.getState().updateSettings({ fuel: 'B7', radiusMiles: 25 });
    useStore.getState().resetSettings();
    expect(useStore.getState().settings).toMatchObject({ fuel: 'E10', radiusMiles: 5, onboardingComplete: true });
  });
});
