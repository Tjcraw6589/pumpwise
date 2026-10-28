import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { regionAt } from '@/lib/feed';
import { distanceKm, type LatLng } from '@/lib/geo';
import { needsReload } from '@/lib/nearby';
import { FeedError, loadArea } from '@/services/feedClient';
import { areaNameFor, checkPermission, currentPosition, watchPosition } from '@/services/location';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';

/** The point searches are centred on: the chosen place, or the phone's position. */
export function useSearchCenter(): LatLng | null {
  const mode = useStore((s) => s.settings.locationMode);
  const place = useStore((s) => s.settings.place);
  const position = useLive((s) => s.position);
  if (mode === 'place' && place) return place;
  return position;
}

/**
 * Keeps location and prices up to date while the app is open: follows the phone as it moves,
 * re-downloads prices when the driver has moved a few kilometres or every five minutes, and
 * checks again whenever the app comes back to the foreground. Mounted once, under the tabs.
 */
export function useLiveController(): void {
  const mode = useStore((s) => s.settings.locationMode);
  const radiusKm = useStore((s) => s.settings.radiusKm);
  const permission = useLive((s) => s.permission);
  const refreshToken = useLive((s) => s.refreshToken);
  const center = useSearchCenter();
  const loading = useRef(false);
  const centerRef = useRef(center);
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  // Permission: on start and every time the app returns to the foreground (it may have changed in Settings).
  useEffect(() => {
    const refreshPermission = () => {
      void checkPermission().then(({ state, canAskAgain }) => useLive.getState().set({ permission: state, canAskAgain }));
    };
    refreshPermission();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') refreshPermission();
    });
    return () => subscription.remove();
  }, []);

  // Follow the phone while location is the search centre.
  useEffect(() => {
    if (mode !== 'gps' || permission !== 'granted') return;
    let cancelled = false;
    let stop: (() => void) | null = null;
    const live = useLive.getState();
    live.set({ locating: true, locationError: null });
    currentPosition()
      .then((p) => {
        if (!cancelled) useLive.getState().set({ position: { ...p, at: Date.now() }, locating: false, locationError: null });
      })
      .catch(() => {
        if (!cancelled) useLive.getState().set({ locating: false, locationError: 'unavailable' });
      });
    watchPosition((p) => useLive.getState().set({ position: { ...p, at: Date.now() }, locationError: null }))
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else stop = unsubscribe;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [mode, permission]);

  // Area name for the header, looked up again only after a real move.
  const namedFor = useRef<LatLng | null>(null);
  const place = useStore((s) => s.settings.place);
  useEffect(() => {
    if (!center) return;
    if (mode === 'place' && place) {
      useLive.getState().set({ areaName: place.name });
      namedFor.current = place;
      return;
    }
    if (namedFor.current && distanceKm(namedFor.current, center) < 0.8) return;
    namedFor.current = center;
    void areaNameFor(center).then((name) => useLive.getState().set({ areaName: name }));
  }, [center, mode, place]);

  const load = useCallback(async (target: LatLng, radius: number, force: boolean) => {
    const live = useLive.getState();
    // Nothing to download outside the regions Pumpwise covers; the screen offers places that are.
    if (loading.current || !regionAt(target.lat, target.lng)) return;
    if (!force && !needsReload(live.loadedFor, live.loadedAt, target, radius, Date.now())) return;
    loading.current = true;
    // Prices for somewhere far away (a different city) are no use here: show the loading cards
    // instead of a misleading "nothing nearby" while the new area downloads.
    const sameArea = live.loadedFor !== null && distanceKm(live.loadedFor, target) < 15;
    const hasData = live.stations.length > 0 && sameArea;
    live.set(hasData ? { refreshing: true } : { feedStatus: 'loading', stations: [], refreshing: true });
    try {
      const { meta, stations } = await loadArea(target, radius);
      useLive.getState().set({
        meta,
        stations,
        feedStatus: 'ready',
        feedError: null,
        loadedFor: { ...target, radiusKm: radius },
        loadedAt: Date.now(),
      });
    } catch (error) {
      const kind = error instanceof FeedError ? error.kind : 'unavailable';
      // Keep showing older prices if there are any; the screen says they could not be updated.
      useLive.getState().set(hasData ? { feedError: kind } : { feedError: kind, feedStatus: 'error' });
    } finally {
      loading.current = false;
      useLive.getState().set({ refreshing: false });
    }
  }, []);

  // Download when the centre moves, the area grows, or prices get old.
  useEffect(() => {
    if (center) void load(center, radiusKm, false);
  }, [center, radiusKm, load]);

  // Pull to refresh and "Try again".
  useEffect(() => {
    if (refreshToken === 0) return;
    const target = centerRef.current;
    if (target) void load(target, useStore.getState().settings.radiusKm, true);
  }, [refreshToken, load]);

  // Check age once a minute and when returning to the app.
  useEffect(() => {
    const tick = () => {
      const target = centerRef.current;
      if (target && AppState.currentState === 'active') void load(target, useStore.getState().settings.radiusKm, false);
    };
    const timer = setInterval(tick, 60_000);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [load]);
}
