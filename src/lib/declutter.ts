import type { RankedStation } from './ranking';

/** How much of the map one screen point covers, in degrees. */
export interface MapScale {
  latPerPt: number;
  lngPerPt: number;
}

/** A price pin's footprint on screen, in points, with a little breathing room. */
export const PIN_FOOTPRINT = { width: 62, height: 32 };

/**
 * The pins to draw at this zoom: where pins would overlap, only the cheapest of the cluster shows
 * (then the closest). Stations in `keepIds` (the cheapest, the nearest, the tapped one) always show.
 * Zooming in spreads the stations out, so more pins appear; every station stays in the list.
 */
export function declutterPins(list: readonly RankedStation[], scale: MapScale, keepIds: readonly (string | null | undefined)[] = []): RankedStation[] {
  if (!(scale.latPerPt > 0) || !(scale.lngPerPt > 0)) return [...list];
  const keep = new Set(keepIds.filter((id): id is string => !!id));
  const dLat = PIN_FOOTPRINT.height * scale.latPerPt;
  const dLng = PIN_FOOTPRINT.width * scale.lngPerPt;
  const order = [...list].sort(
    (a, b) =>
      Number(keep.has(b.station.id)) - Number(keep.has(a.station.id)) ||
      Number(a.restricted || a.stale) - Number(b.restricted || b.stale) ||
      a.price.p - b.price.p ||
      a.distance - b.distance,
  );
  const shown: RankedStation[] = [];
  for (const item of order) {
    const clash = shown.some(
      (s) => Math.abs(s.station.lat - item.station.lat) < dLat && Math.abs(s.station.lng - item.station.lng) < dLng,
    );
    if (!clash || keep.has(item.station.id)) shown.push(item);
  }
  return shown;
}
