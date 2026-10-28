import { isInUK } from '@/lib/feed';
import { classifyQuery, type Place } from '@/lib/places';

/**
 * Finds UK towns and postcodes with postcodes.io, a free public service built on Ordnance Survey
 * and ONS open data. Only the words the driver types are sent.
 */
const BASE = 'https://api.postcodes.io';

interface PostcodeResult {
  postcode?: string;
  outcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  admin_district?: string | string[] | null;
  region?: string | null;
}

interface PlaceResult {
  name_1?: string;
  local_type?: string;
  county_unitary?: string | null;
  district_borough?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

async function get<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${BASE}${path}`, { signal: controller.signal });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`postcodes.io ${response.status}`);
    const body = (await response.json()) as { result?: T | null };
    return body.result ?? null;
  } finally {
    clearTimeout(timer);
  }
}

function first(value: string | string[] | null | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function toPlace(name: string, detail: string, lat: number | null | undefined, lng: number | null | undefined): Place | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !isInUK(lat, lng)) return null;
  return { name, detail, lat, lng };
}

const PLACE_TYPES = new Set(['City', 'Town', 'Village', 'Hamlet', 'Suburban Area', 'Other Settlement']);

export async function searchPlaces(input: string): Promise<Place[]> {
  const query = classifyQuery(input);
  if (!query) return [];
  if (query.kind === 'postcode') {
    const result = await get<PostcodeResult>(`/postcodes/${encodeURIComponent(query.value)}`);
    const place = result && toPlace(result.postcode ?? query.value, first(result.admin_district), result.latitude, result.longitude);
    return place ? [place] : [];
  }
  if (query.kind === 'outcode') {
    const result = await get<PostcodeResult>(`/outcodes/${encodeURIComponent(query.value)}`);
    const place = result && toPlace(result.outcode ?? query.value, first(result.admin_district), result.latitude, result.longitude);
    if (place) return [place];
  }
  const results = (await get<PlaceResult[]>(`/places?q=${encodeURIComponent(query.value)}&limit=20`)) ?? [];
  const places: Place[] = [];
  for (const r of results) {
    if (r.local_type && !PLACE_TYPES.has(r.local_type)) continue;
    const detail = [r.district_borough || r.county_unitary, r.region || r.country].filter(Boolean).join(', ');
    const place = toPlace(r.name_1 ?? query.value, detail, r.latitude, r.longitude);
    if (place && !places.some((p) => p.name === place.name && p.detail === place.detail)) places.push(place);
    if (places.length >= 8) break;
  }
  return places;
}
