import type { LatLng } from './geo';

export interface Place extends LatLng {
  name: string;
  /** "Leeds, West Yorkshire" style second line. */
  detail: string;
}

/** Cities to look around when location is off or the phone is outside the UK (App Review included). */
export const CITY_PRESETS: readonly Place[] = [
  { name: 'London', detail: 'Westminster', lat: 51.5072, lng: -0.1276 },
  { name: 'Manchester', detail: 'Greater Manchester', lat: 53.4808, lng: -2.2426 },
  { name: 'Birmingham', detail: 'West Midlands', lat: 52.4862, lng: -1.8904 },
  { name: 'Leeds', detail: 'West Yorkshire', lat: 53.8008, lng: -1.5491 },
  { name: 'Glasgow', detail: 'Scotland', lat: 55.8642, lng: -4.2518 },
  { name: 'Cardiff', detail: 'Wales', lat: 51.4816, lng: -3.1791 },
  { name: 'Bristol', detail: 'South West', lat: 51.4545, lng: -2.5879 },
  { name: 'Belfast', detail: 'Northern Ireland', lat: 54.5973, lng: -5.9301 },
];

/** Full or partial UK postcode, such as "LS1 4AP" or "LS1". */
const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

export type PlaceQuery = { kind: 'postcode'; value: string } | { kind: 'outcode'; value: string } | { kind: 'name'; value: string };

export function classifyQuery(input: string): PlaceQuery | null {
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length < 2) return null;
  if (FULL_POSTCODE.test(value)) return { kind: 'postcode', value: value.replace(/\s/g, '').toUpperCase() };
  if (OUTCODE.test(value)) return { kind: 'outcode', value: value.toUpperCase() };
  return { kind: 'name', value };
}
