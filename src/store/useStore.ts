import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FUEL_KINDS, type FuelKind } from '@/lib/feed';
import type { Place } from '@/lib/places';
import type { SortMode } from '@/lib/ranking';
import { KM_PER_MILE } from '@/lib/units';

/** Internal storage key; never shown to users and kept stable so saved settings survive updates. */
export const STORAGE_KEY = 'pumpwise-settings';
export const STORE_VERSION = 2;

export const FILL_OPTIONS = [10, 20, 30, 40, 50, 60, 70] as const;

export type ThemePreference = 'system' | 'light' | 'dark';
export type DirectionsApp = 'apple' | 'google' | 'waze';
/** Where searches are centred: the phone's location, or a place the driver picked. */
export type LocationMode = 'gps' | 'place';

/** Distances and fuel economy are stored in km and L/100km and shown in each region's units. */
export interface Settings {
  fuel: FuelKind;
  radiusKm: number;
  /** Litres in a typical fill-up, for "you save $x" and best value. */
  fillLitres: number;
  /** The car's fuel use, for the cost of driving to a station. */
  economyL100: number;
  /** Show members-only stations (like Costco) and let them be the cheapest. */
  includeMembersOnly: boolean;
  sortBy: SortMode;
  theme: ThemePreference;
  directionsApp: DirectionsApp;
  onboardingComplete: boolean;
  locationMode: LocationMode;
  place: Place | null;
  recentPlaces: Place[];
}

export function createDefaultSettings(): Settings {
  return {
    fuel: 'regular',
    radiusKm: 8,
    fillLitres: 40,
    economyL100: 8,
    includeMembersOnly: false,
    sortBy: 'price',
    theme: 'system',
    directionsApp: 'apple',
    onboardingComplete: false,
    locationMode: 'gps',
    place: null,
    recentPlaces: [],
  };
}

const V1_FUELS: Record<string, FuelKind> = { E10: 'regular', E5: 'premium', B7: 'diesel', SDV: 'premium-diesel', B10: 'b10', HVO: 'hvo' };

/** Version 1 (UK only) stored miles, mpg and UK pump codes. */
export function migrateSettings(saved: Record<string, unknown> | undefined, fromVersion: number): Partial<Settings> | undefined {
  if (!saved || fromVersion >= 2) return saved as Partial<Settings> | undefined;
  const { radiusMiles, mpg, fuel, ...rest } = saved;
  return {
    ...(rest as Partial<Settings>),
    fuel: V1_FUELS[String(fuel)] ?? 'regular',
    ...(typeof radiusMiles === 'number' ? { radiusKm: radiusMiles * KM_PER_MILE } : {}),
    ...(typeof mpg === 'number' && mpg > 0 ? { economyL100: Math.round((282.481 / mpg) * 10) / 10 } : {}),
  };
}

/** Repairs anything odd in saved settings by falling back to defaults. */
export function sanitizeSettings(saved: Partial<Settings> | undefined): Settings {
  const defaults = createDefaultSettings();
  const s = { ...defaults, ...saved };
  return {
    ...s,
    fuel: FUEL_KINDS.includes(s.fuel) ? s.fuel : defaults.fuel,
    radiusKm: s.radiusKm >= 0.5 && s.radiusKm <= 100 ? s.radiusKm : defaults.radiusKm,
    fillLitres: s.fillLitres >= 5 && s.fillLitres <= 150 ? s.fillLitres : defaults.fillLitres,
    economyL100: s.economyL100 >= 2 && s.economyL100 <= 40 ? s.economyL100 : defaults.economyL100,
    includeMembersOnly: s.includeMembersOnly === true,
    sortBy: ['price', 'distance', 'value'].includes(s.sortBy) ? s.sortBy : defaults.sortBy,
    theme: ['system', 'light', 'dark'].includes(s.theme) ? s.theme : defaults.theme,
    directionsApp: ['apple', 'google', 'waze'].includes(s.directionsApp) ? s.directionsApp : defaults.directionsApp,
    locationMode: s.locationMode === 'place' && s.place ? 'place' : 'gps',
    recentPlaces: Array.isArray(s.recentPlaces) ? s.recentPlaces.slice(0, 5) : [],
  };
}

interface StoreState {
  hydrated: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Search around a chosen place instead of the phone's location. */
  choosePlace: (place: Place) => void;
  followMyLocation: () => void;
  completeOnboarding: () => void;
  resetSettings: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      hydrated: false,
      settings: createDefaultSettings(),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      choosePlace: (place) =>
        set((state) => ({
          settings: {
            ...state.settings,
            locationMode: 'place',
            place,
            recentPlaces: [place, ...state.settings.recentPlaces.filter((p) => p.name !== place.name)].slice(0, 5),
          },
        })),
      followMyLocation: () => set((state) => ({ settings: { ...state.settings, locationMode: 'gps' } })),
      completeOnboarding: () => set((state) => ({ settings: { ...state.settings, onboardingComplete: true } })),
      resetSettings: () => set({ settings: { ...createDefaultSettings(), onboardingComplete: true } }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }),
      migrate: (persisted, version) => {
        const saved = (persisted as { settings?: Record<string, unknown> } | undefined)?.settings;
        return { settings: migrateSettings(saved, version) } as unknown as StoreState;
      },
      merge: (persisted, current) => ({
        ...current,
        settings: sanitizeSettings((persisted as { settings?: Partial<Settings> } | undefined)?.settings),
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);
