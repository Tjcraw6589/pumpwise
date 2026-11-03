import type { LatLng } from '@/lib/geo';
import type { PriceBand, RankedStation } from '@/lib/ranking';

export interface StationMapProps {
  center: LatLng;
  radiusKm: number;
  /** Stations to pin, already filtered to the search area. */
  stations: RankedStation[];
  band: (pence: number) => PriceBand;
  selectedId: string | null;
  /** Stations whose pins always show, however crowded the map (the cheapest and the nearest). */
  keepIds?: readonly (string | null | undefined)[];
  onSelect: (id: string | null) => void;
  showsUserLocation: boolean;
  /** Changes when the map should fly back to the search area. */
  recenterToken: number;
}
