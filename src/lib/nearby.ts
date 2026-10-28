import { type RegionId, regionAt } from './feed';
import { distanceKm, type LatLng } from './geo';
import type { Ranking } from './ranking';

/** Re-download prices when the feed may have moved on (it is rebuilt every 15 minutes). */
export const RELOAD_AFTER_MS = 5 * 60_000;
/** Re-download when the driver has moved this far from where prices were loaded. */
export const RELOAD_AFTER_KM = 3;

export function needsReload(
  loadedFor: (LatLng & { radiusKm: number }) | null,
  loadedAt: number | null,
  center: LatLng,
  radiusKm: number,
  now: number,
): boolean {
  if (!loadedFor || loadedAt === null) return true;
  if (radiusKm > loadedFor.radiusKm) return true;
  if (now - loadedAt > RELOAD_AFTER_MS) return true;
  return distanceKm(center, loadedFor) > RELOAD_AFTER_KM;
}

/** Which screen state the Nearby and Map tabs should show. */
export type NearbyPhase =
  | 'need-permission'
  | 'denied'
  | 'locating'
  | 'location-error'
  | 'not-covered'
  | 'loading'
  | 'region-down'
  | 'error'
  | 'empty'
  | 'ready';

export interface PhaseInput {
  mode: 'gps' | 'place';
  permission: 'checking' | 'undetermined' | 'granted' | 'denied';
  center: LatLng | null;
  locationError: string | null;
  feedStatus: 'idle' | 'loading' | 'ready' | 'error';
  /** Regions with prices in the feed; null until the feed has loaded once. */
  liveRegions: readonly RegionId[] | null;
  /** Regions the feed lists but could not refresh (no prices at all yet). */
  downRegions: readonly RegionId[];
  hasStations: boolean;
  ranking: Ranking | null;
}

export function nearbyPhase(input: PhaseInput): NearbyPhase {
  if (input.mode === 'gps') {
    if (input.permission === 'checking') return 'locating';
    if (input.permission === 'undetermined') return 'need-permission';
    if (input.permission === 'denied') return 'denied';
    if (!input.center) return input.locationError ? 'location-error' : 'locating';
  }
  if (!input.center) return 'need-permission';
  const region = regionAt(input.center.lat, input.center.lng);
  if (!region) return 'not-covered';
  if (input.liveRegions && !input.liveRegions.includes(region)) {
    return input.downRegions.includes(region) ? 'region-down' : 'not-covered';
  }
  if (!input.hasStations) {
    if (input.feedStatus === 'error') return 'error';
    if (input.feedStatus === 'ready') return 'empty';
    return 'loading';
  }
  if (!input.ranking || input.ranking.inArea.length === 0) return 'empty';
  return 'ready';
}
