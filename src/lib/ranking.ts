import type { FeedPrice, FeedStation, FuelCode } from './feed';
import { distanceMiles, type LatLng } from './geo';
import { openState, type OpenState } from './hours';

export const LITRES_PER_UK_GALLON = 4.54609;
/** Prices older than this are still listed but never picked as "cheapest" or "nearest". */
export const HERO_MAX_AGE_DAYS = 30;

export type SortMode = 'price' | 'distance' | 'value';

export interface RankedStation {
  station: FeedStation;
  /** Straight-line miles from the search centre. */
  distance: number;
  price: FeedPrice;
  open: OpenState;
  /** Litres burned driving there and back. */
  tripLitres: number;
  /** The fill-up plus the fuel used to get there and back, in pounds. */
  realCost: number;
  /** Too old to be picked for the headline cards. */
  stale: boolean;
}

export interface RankOptions {
  center: LatLng;
  fuel: FuelCode;
  radiusMiles: number;
  fillLitres: number;
  mpg: number;
  now: Date;
}

export interface Savings {
  /** Net saving of the cheapest over the nearest, after the extra driving. Negative means it costs more. */
  pounds: number;
  /** Saving at the pump alone. */
  pumpSaving: number;
  /** Extra miles there and back compared with the nearest. */
  extraMiles: number;
  worthIt: boolean;
}

export interface Ranking {
  /** Stations inside the search area that sell the chosen fuel, cheapest first. */
  inArea: RankedStation[];
  /** The closest open station that sells the fuel, even if it is outside the area. */
  nearest: RankedStation | null;
  /** The cheapest open station inside the area. */
  cheapest: RankedStation | null;
  /** The lowest real cost (pump price plus the drive) inside the area. */
  bestValue: RankedStation | null;
  savings: Savings | null;
  /** Stations selling the fuel anywhere in the downloaded tiles. */
  loadedWithFuel: number;
}

export function rankStations(stations: FeedStation[], options: RankOptions): Ranking {
  const { center, fuel, radiusMiles, fillLitres, mpg, now } = options;
  const litresPerMile = LITRES_PER_UK_GALLON / Math.max(5, mpg);
  const staleBefore = now.getTime() - HERO_MAX_AGE_DAYS * 86_400_000;

  const all: RankedStation[] = [];
  for (const station of stations) {
    const price = station.prices[fuel];
    if (!price) continue;
    const distance = distanceMiles(center, station);
    const tripLitres = 2 * distance * litresPerMile;
    all.push({
      station,
      distance,
      price,
      open: openState(station.hours, now),
      tripLitres,
      realCost: ((fillLitres + tripLitres) * price.p) / 100,
      stale: Date.parse(price.at) < staleBefore,
    });
  }

  const inArea = sortStations(
    all.filter((r) => r.distance <= radiusMiles),
    'price',
  );
  const eligible = (r: RankedStation) => r.open.status !== 'closed' && !r.stale;

  const nearest = sortStations(all.filter(eligible), 'distance')[0] ?? null;
  const candidates = inArea.filter(eligible);
  const cheapest = candidates[0] ?? null;
  const bestValue = sortStations(candidates, 'value')[0] ?? null;

  let savings: Savings | null = null;
  if (nearest && cheapest && nearest.station.id !== cheapest.station.id) {
    const pounds = nearest.realCost - cheapest.realCost;
    savings = {
      pounds,
      pumpSaving: (fillLitres * (nearest.price.p - cheapest.price.p)) / 100,
      extraMiles: Math.max(0, 2 * (cheapest.distance - nearest.distance)),
      worthIt: pounds >= 0.25,
    };
  }

  return { inArea, nearest, cheapest, bestValue, savings, loadedWithFuel: all.length };
}

export function sortStations(list: RankedStation[], mode: SortMode): RankedStation[] {
  const byDistance = (a: RankedStation, b: RankedStation) => a.distance - b.distance;
  const compare: Record<SortMode, (a: RankedStation, b: RankedStation) => number> = {
    price: (a, b) => a.price.p - b.price.p || byDistance(a, b),
    distance: (a, b) => byDistance(a, b) || a.price.p - b.price.p,
    value: (a, b) => a.realCost - b.realCost || byDistance(a, b),
  };
  return [...list].sort(compare[mode]);
}

/** Where a price sits among the others in the area: used to colour map pins and list prices. */
export type PriceBand = 'low' | 'mid' | 'high';

export function priceBands(list: RankedStation[]): (pence: number) => PriceBand {
  const prices = list.map((r) => r.price.p).sort((a, b) => a - b);
  if (prices.length < 3) return () => 'mid';
  const low = prices[Math.floor((prices.length - 1) * 0.25)] ?? 0;
  const high = prices[Math.ceil((prices.length - 1) * 0.75)] ?? 0;
  return (pence) => (pence <= low ? 'low' : pence >= high && high > low ? 'high' : 'mid');
}
