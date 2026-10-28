import { useCallback } from 'react';

import type { FeedStation } from '@/lib/feed';
import { openDirections } from '@/services/directions';
import { useStore } from '@/store/useStore';

/** Opens directions to a station in the driver's chosen maps app. */
export function useDirections(): (station: FeedStation) => void {
  const app = useStore((s) => s.settings.directionsApp);
  return useCallback(
    (station: FeedStation) => {
      void openDirections(app, station, station.name);
    },
    [app],
  );
}
