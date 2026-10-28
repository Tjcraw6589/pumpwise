import type { LatLng } from './geo';

export interface Place extends LatLng {
  name: string;
  /** "Western Australia" or "Leeds, West Yorkshire" style second line. */
  detail: string;
}

/** Full or partial UK postcode, such as "LS1 4AP" or "LS1". */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const UK_OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;
/** Australian postcode: four digits. */
const AU_POSTCODE = /^\d{4}$/;

export type PlaceQuery =
  | { kind: 'uk-postcode'; value: string }
  | { kind: 'uk-outcode'; value: string }
  | { kind: 'au-postcode'; value: string }
  | { kind: 'name'; value: string };

export function classifyQuery(input: string): PlaceQuery | null {
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length < 2) return null;
  if (AU_POSTCODE.test(value)) return { kind: 'au-postcode', value };
  if (UK_POSTCODE.test(value)) return { kind: 'uk-postcode', value: value.replace(/\s/g, '').toUpperCase() };
  if (UK_OUTCODE.test(value)) return { kind: 'uk-outcode', value: value.toUpperCase() };
  return { kind: 'name', value };
}
