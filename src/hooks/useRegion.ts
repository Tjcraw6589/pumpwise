import { type RegionId, regionAt } from '@/lib/feed';
import { DEFAULT_REGION, regionInfo, type RegionInfo } from '@/lib/regions';
import { useLive } from '@/store/useLive';

import { useSearchCenter } from './useLiveController';

/** The region the search centre is in, or the default region when it is outside every region. */
export function useRegion(): RegionInfo {
  const center = useSearchCenter();
  return regionInfo(center ? (regionAt(center.lat, center.lng) ?? DEFAULT_REGION) : DEFAULT_REGION);
}

/** Regions with prices in the feed (WA until the feed has loaded once), and regions that are down. */
export function useCoverage(): { live: RegionId[]; down: RegionId[]; known: boolean } {
  const meta = useLive((s) => s.meta);
  if (!meta) return { live: [DEFAULT_REGION], down: [], known: false };
  const entries = Object.entries(meta.regions) as [RegionId, { status: string; stationCount: number }][];
  return {
    live: entries.filter(([, r]) => r.status === 'live' && r.stationCount > 0).map(([id]) => id),
    down: entries.filter(([, r]) => r.status !== 'live' || r.stationCount === 0).map(([id]) => id),
    known: true,
  };
}
