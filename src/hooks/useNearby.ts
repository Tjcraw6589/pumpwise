import { useEffect, useMemo, useState } from 'react';

import { nearbyPhase, type NearbyPhase } from '@/lib/nearby';
import { rankStations, type Ranking } from '@/lib/ranking';
import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';

import { useSearchCenter } from './useLiveController';

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
  const center = useSearchCenter();
  const now = useNow();
  // Ranking only changes when the minute does, which keeps scrolling smooth.
  const minute = Math.floor(now.getTime() / 60_000);

  const ranking = useMemo(() => {
    if (!center || stations.length === 0) return null;
    return rankStations(stations, {
      center,
      fuel: settings.fuel,
      radiusMiles: settings.radiusMiles,
      fillLitres: settings.fillLitres,
      mpg: settings.mpg,
      now: new Date(minute * 60_000),
    });
  }, [center, stations, settings.fuel, settings.radiusMiles, settings.fillLitres, settings.mpg, minute]);

  const phase = nearbyPhase({
    mode: settings.locationMode,
    permission,
    center,
    locationError,
    feedStatus,
    hasStations: stations.length > 0,
    ranking,
  });

  return { phase, ranking, now };
}
