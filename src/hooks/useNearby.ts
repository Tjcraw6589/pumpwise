import { useEffect, useMemo, useState } from 'react';

import { nearbyPhase, type NearbyPhase } from '@/lib/nearby';
import { rankStations, type Ranking } from '@/lib/ranking';
import { fuelOption } from '@/lib/regions';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';

import { useSearchCenter } from './useLiveController';
import { useCoverage, useRegion } from './useRegion';

/** Re-renders every 30 seconds so "12 min ago" and "open until" labels stay true. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export interface NearbyView {
  phase: NearbyPhase;
  ranking: Ranking | null;
  now: Date;
}

/** Everything the Nearby and Map tabs show, worked out from settings, location and the feed. */
export function useNearby(): NearbyView {
  const settings = useStore((s) => s.settings);
  const permission = useLive((s) => s.permission);
  const locationError = useLive((s) => s.locationError);
  const feedStatus = useLive((s) => s.feedStatus);
  const stations = useLive((s) => s.stations);
  const coverage = useCoverage();
  const center = useSearchCenter();
  // A fuel the region doesn't sell (say B10 after leaving the UK) falls back to the region's first fuel.
  const fuel = fuelOption(useRegion(), settings.fuel).kind;
  const now = useNow();
  // Ranking only changes when the minute does, which keeps scrolling smooth.
  const minute = Math.floor(now.getTime() / 60_000);

  const ranking = useMemo(() => {
    if (!center || stations.length === 0) return null;
    return rankStations(stations, {
      center,
      fuel,
      radiusKm: settings.radiusKm,
      fillLitres: settings.fillLitres,
      economyL100: settings.economyL100,
      includeMembersOnly: settings.includeMembersOnly,
      now: new Date(minute * 60_000),
    });
  }, [
    center,
    stations,
    fuel,
    settings.radiusKm,
    settings.fillLitres,
    settings.economyL100,
    settings.includeMembersOnly,
    minute,
  ]);

  const phase = nearbyPhase({
    mode: settings.locationMode,
    permission,
    center,
    locationError,
    feedStatus,
    liveRegions: coverage.known ? coverage.live : null,
    downRegions: coverage.down,
    hasStations: stations.length > 0,
    ranking,
  });

  return { phase, ranking, now };
}
