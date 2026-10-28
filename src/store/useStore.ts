import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FuelCode } from '@/lib/feed';
import { FUEL_CODES } from '@/lib/feed';
import type { Place } from '@/lib/places';
import type { SortMode } from '@/lib/ranking';

/** Internal storage key; never shown to users and kept stable so saved settings survive updates. */
export const STORAGE_KEY = 'pumpwise-settings';
export const STORE_VERSION = 1;

export const RADIUS_OPTIONS = [1, 2, 3, 5, 10, 15, 25] as const;
export const FILL_OPTIONS = [10, 20, 30, 40, 50, 60, 70] as const;
export const MPG_OPTIONS = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70] as const;

export type ThemePreference = 'system' | 'light' | 'dark';
export type DirectionsApp = 'apple' | 'google' | 'waze';
/** Where searches are centred: the phone's location, or a place the driver picked. */
export type LocationMode = 'gps' | 'place';

export interface Settings {
  fuel: FuelCode;
  radiusMiles: number;
  /** Litres in a typical fill-up, for "you save £x" and best value. */
  fillLitres: number;
  /** The car's miles per (UK) gallon, for the cost of driving to a station. */
  mpg: number;
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
    fuel: 'E10',
    radiusMiles: 5,
    fillLitres: 40,
    mpg: 45,
    sortBy: 'price',
    theme: 'system',
    directionsApp: 'apple',
    onboardingComplete: false,
    locationMode: 'gps',
    place: null,
    recentPlaces: [],
  };
}

/** Repairs anything odd in saved settings (older versions, hand-edited storage) by falling back to defaults. */
export function sanitizeSettings(saved: Partial<Settings> | undefined): Settings {
  const defaults = createDefaultSettings();
  const s = { ...defaults, ...saved };
  return {
    ...s,
    fuel: FUEL_CODES.includes(s.fuel) ? s.fuel : defaults.fuel,
    radiusMiles: (RADIUS_OPTIONS as readonly number[]).includes(s.radiusMiles) ? s.radiusMiles : defaults.radiusMiles,
    fillLitres: s.fillLitres >= 5 && s.fillLitres <= 150 ? s.fillLitres : defaults.fillLitres,
    mpg: s.mpg >= 10 && s.mpg <= 150 ? s.mpg : defaults.mpg,
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
