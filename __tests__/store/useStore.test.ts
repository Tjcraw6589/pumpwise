import type { Place } from '@/lib/places';
import { REGIONS } from '@/lib/regions';
import { createDefaultSettings, migrateSettings, sanitizeSettings, useStore } from '@/store/useStore';

import { resetStores } from '../helpers';

describe('settings', () => {
  beforeEach(() => resetStores({ onboardingComplete: true }));

  test('defaults suit a typical car', () => {
    expect(createDefaultSettings()).toMatchObject({
      fuel: 'regular',
      radiusKm: 8,
      fillLitres: 40,
      economyL100: 8,
      includeMembersOnly: false,
      sortBy: 'price',
      locationMode: 'gps',
    });
  });

  test('settings saved by the first, UK-only version are converted', () => {
    const migrated = migrateSettings({ fuel: 'B7', radiusMiles: 10, mpg: 45, theme: 'dark', onboardingComplete: true }, 1);
    expect(migrated).toMatchObject({ fuel: 'diesel', theme: 'dark', onboardingComplete: true });
    expect(migrated?.radiusKm).toBeCloseTo(16.09, 1);
    expect(migrated?.economyL100).toBeCloseTo(6.3, 1);
    expect(migrated).not.toHaveProperty('radiusMiles');
    expect(migrateSettings({ fuel: 'diesel' }, 2)).toEqual({ fuel: 'diesel' });
  });

  test('odd saved values fall back to defaults', () => {
    const fixed = sanitizeSettings({
      fuel: 'rocket' as never,
      radiusKm: 900,
      fillLitres: 0,
      economyL100: 99,
      includeMembersOnly: 'yes' as never,
      sortBy: 'random' as never,
      theme: 'neon' as never,
      directionsApp: 'bing' as never,
      locationMode: 'place',
      place: null,
    });
    expect(fixed).toMatchObject({
      fuel: 'regular',
      radiusKm: 8,
      fillLitres: 40,
      economyL100: 8,
      includeMembersOnly: false,
      sortBy: 'price',
      theme: 'system',
      directionsApp: 'apple',
      locationMode: 'gps',
    });
    expect(sanitizeSettings(undefined)).toEqual(createDefaultSettings());
  });

  test('choosing places keeps five recent ones without repeats', () => {
    const places: Place[] = [...REGIONS.wa.cities];
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
    useStore.getState().updateSettings({ fuel: 'diesel', radiusKm: 25 });
    useStore.getState().resetSettings();
    expect(useStore.getState().settings).toMatchObject({ fuel: 'regular', radiusKm: 8, onboardingComplete: true });
  });
});
