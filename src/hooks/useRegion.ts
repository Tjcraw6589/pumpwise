import { type FeedMeta, type RegionId, regionAt } from '@/lib/feed';
import { DEFAULT_REGION, EXPECTED_REGIONS, regionInfo, type RegionInfo } from '@/lib/regions';
import { useLive } from '@/store/useLive';

import { useSearchCenter } from './useLiveController';

/** The region the search centre is in, or the default region when it is outside every region. */
export function useRegion(): RegionInfo {
  const center = useSearchCenter();
  return regionInfo(center ? (regionAt(center.lat, center.lng) ?? DEFAULT_REGION) : DEFAULT_REGION);
}

export interface Coverage {
  live: RegionId[];
  down: RegionId[];
  known: boolean;
}

/** Regions with prices in a feed, and regions that are down. */
export function coverageOf(meta: FeedMeta): Coverage {
  const entries = Object.entries(meta.regions) as [RegionId, { status: string; stationCount: number }][];
  return {
    live: entries.filter(([, r]) => r.status === 'live' && r.stationCount > 0).map(([id]) => id),
    down: entries.filter(([, r]) => r.status !== 'live' || r.stationCount === 0).map(([id]) => id),
    known: true,
  };
}

/** Regions with prices in the feed (the expected regions until the feed has loaded once), and regions that are down. */
export function useCoverage(): Coverage {
  const meta = useLive((s) => s.meta);
  if (!meta) return { live: [...EXPECTED_REGIONS], down: [], known: false };
  return coverageOf(meta);
}
