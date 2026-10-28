import type { DistanceUnit, EconomyUnit } from './regions';

export const KM_PER_MILE = 1.609344;
/** L/100km = 282.481 / UK mpg. */
const UK_MPG_FACTOR = 282.481;

export function toKm(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value * KM_PER_MILE : value;
}

export function fromKm(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? km / KM_PER_MILE : km;
}

/** "2.3 km", "450 m", "12 mi", "Under 0.1 mi". */
export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === 'km') {
    if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }
  const miles = km / KM_PER_MILE;
  if (miles < 0.1) return 'Under 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** The area option closest to a stored radius, so chips stay selected after unit changes. */
export function sameRadius(km: number, option: number, unit: DistanceUnit): boolean {
  return Math.abs(toKm(option, unit) - km) < 0.15;
}

/** "Within 5 mi", "Within 8 km". */
export function radiusLabel(km: number, unit: DistanceUnit): string {
  const value = fromKm(km, unit);
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${unit}`;
}

export function economyToL100(value: number, unit: EconomyUnit): number {
  return unit === 'mpg' ? UK_MPG_FACTOR / value : value;
}

export function economyFromL100(l100: number, unit: EconomyUnit): number {
  return unit === 'mpg' ? UK_MPG_FACTOR / l100 : l100;
}

export function sameEconomy(l100: number, option: number, unit: EconomyUnit): boolean {
  return Math.abs(economyToL100(option, unit) - l100) < 0.05;
}

export function economyLabel(value: number, unit: EconomyUnit): string {
  return unit === 'mpg' ? `${value} mpg` : `${value} L/100km`;
}
