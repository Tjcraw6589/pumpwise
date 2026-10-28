import type { FeedPrice, FeedStation, FuelKind } from './feed';
import { distanceKm, type LatLng } from './geo';
import { openState, type OpenState } from './hours';
import { REGIONS } from './regions';

/** Prices older than this are still listed but never picked as "cheapest" or "nearest". */
export const HERO_MAX_AGE_DAYS = 30;
/** Tags that mean a driver may not be able to buy here. */
export const MEMBERS_ONLY = 'members-only';
export const PERMIT_REQUIRED = 'permit-required';

export type SortMode = 'price' | 'distance' | 'value';

export interface RankedStation {
  station: FeedStation;
  /** Straight-line kilometres from the search centre. */
  distance: number;
  price: FeedPrice;
  /** Tomorrow's fixed price, where published. */
  tomorrow: number | null;
  open: OpenState;
  /** Litres burned driving there and back. */
  tripLitres: number;
  /** The fill-up plus the fuel used to get there and back, in pounds or dollars. */
  realCost: number;
  /** Too old to be picked for the headline cards. */
  stale: boolean;
  /** Members only or entry permit needed: listed, never a headline pick. */
  restricted: boolean;
}

export interface RankOptions {
  center: LatLng;
  fuel: FuelKind;
  radiusKm: number;
  fillLitres: number;
  /** The car's fuel use in litres per 100 km. */
  economyL100: number;
  includeMembersOnly: boolean;
  now: Date;
}

export interface Savings {
  /** Net saving of the cheapest over the nearest, after the extra driving. Negative means it costs more. */
  amount: number;
  /** Saving at the pump alone. */
  pumpSaving: number;
  /** Extra kilometres there and back compared with the nearest. */
  extraKm: number;
  worthIt: boolean;
}

export interface Trend {
  /** Typical change from today to tomorrow, in pence or cents per litre. */
  change: number;
  /** Stations the trend is based on. */
  count: number;
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
  /** How prices in the area move tomorrow, where tomorrow's prices are published. */
  trend: Trend | null;
  /** Stations selling the fuel anywhere in the downloaded tiles. */
  loadedWithFuel: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function rankStations(stations: FeedStation[], options: RankOptions): Ranking {
  const { center, fuel, radiusKm, fillLitres, economyL100, includeMembersOnly, now } = options;
  const litresPerKm = Math.max(1, economyL100) / 100;
  const staleBefore = now.getTime() - HERO_MAX_AGE_DAYS * 86_400_000;

  const all: RankedStation[] = [];
  for (const station of stations) {
    const price = station.prices[fuel];
    if (!price) continue;
    const membersOnly = station.tags.includes(MEMBERS_ONLY);
    if (membersOnly && !includeMembersOnly) continue;
    const distance = distanceKm(center, station);
    const tripLitres = 2 * distance * litresPerKm;
    const region = REGIONS[station.region];
    all.push({
      station,
      distance,
      price,
      tomorrow: station.tomorrow?.[fuel] ?? null,
      open: openState(station.hours, now, region.utcOffsetMinutes(now)),
      tripLitres,
      realCost: ((fillLitres + tripLitres) * price.p) / 100,
      stale: Date.parse(price.at) < staleBefore,
      restricted: station.tags.includes(PERMIT_REQUIRED) || (membersOnly && !includeMembersOnly),
    });
  }

  const inArea = sortStations(
    all.filter((r) => r.distance <= radiusKm),
    'price',
  );
  const eligible = (r: RankedStation) => r.open.status !== 'closed' && !r.stale && !r.restricted;

  const nearest = sortStations(all.filter(eligible), 'distance')[0] ?? null;
  const candidates = inArea.filter(eligible);
  const cheapest = candidates[0] ?? null;
  const bestValue = sortStations(candidates, 'value')[0] ?? null;

  let savings: Savings | null = null;
  if (nearest && cheapest && nearest.station.id !== cheapest.station.id) {
    const amount = nearest.realCost - cheapest.realCost;
    savings = {
      amount,
      pumpSaving: (fillLitres * (nearest.price.p - cheapest.price.p)) / 100,
      extraKm: Math.max(0, 2 * (cheapest.distance - nearest.distance)),
      worthIt: amount >= 0.25,
    };
  }

  const changes = inArea.filter((r) => r.tomorrow !== null && !r.restricted).map((r) => (r.tomorrow as number) - r.price.p);
  const trend = changes.length >= 3 ? { change: Math.round(median(changes) * 10) / 10, count: changes.length } : null;

  return { inArea, nearest, cheapest, bestValue, savings, trend, loadedWithFuel: all.length };
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

export function priceBands(list: RankedStation[]): (price: number) => PriceBand {
  const prices = list.map((r) => r.price.p).sort((a, b) => a - b);
  if (prices.length < 3) return () => 'mid';
  const low = prices[Math.floor((prices.length - 1) * 0.25)] ?? 0;
  const high = prices[Math.ceil((prices.length - 1) * 0.75)] ?? 0;
  return (price) => (price <= low ? 'low' : price >= high && high > low ? 'high' : 'mid');
}
