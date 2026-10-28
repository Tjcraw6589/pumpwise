import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { type RegionId, regionAt } from '@/lib/feed';
import { classifyQuery, type Place } from '@/lib/places';
import { REGIONS } from '@/lib/regions';

/**
 * Finds towns, suburbs and postcodes. On the iPhone, names and Australian postcodes go to
 * Apple's own map service (the same one Apple Maps uses); UK postcodes go to postcodes.io, a
 * free public service built on Ordnance Survey and ONS open data. Only the typed words are sent.
 */
const POSTCODES = 'https://api.postcodes.io';

interface PostcodeResult {
  postcode?: string;
  outcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  admin_district?: string | string[] | null;
}

interface PostcodesPlace {
  name_1?: string;
  local_type?: string;
  county_unitary?: string | null;
  district_borough?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

async function getPostcodes<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${POSTCODES}${path}`, { signal: controller.signal });
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

function place(name: string, detail: string, lat: number | null | undefined, lng: number | null | undefined, allowed: readonly RegionId[]): Place | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const region = regionAt(lat, lng);
  if (!region || !allowed.includes(region)) return null;
  return { name, detail, lat, lng };
}

/** Apple's geocoder, then a reverse lookup for a readable name. iPhone only. */
async function appleSearch(query: string, allowed: readonly RegionId[]): Promise<Place[]> {
  if (Platform.OS === 'web') return [];
  const attempts = [query, ...allowed.map((id) => `${query}, ${REGIONS[id].name}`)];
  const results: Place[] = [];
  for (const attempt of attempts) {
    const found = await Location.geocodeAsync(attempt).catch(() => []);
    for (const hit of found.slice(0, 5)) {
      const region = regionAt(hit.latitude, hit.longitude);
      if (!region || !allowed.includes(region)) continue;
      const [address] = await Location.reverseGeocodeAsync({ latitude: hit.latitude, longitude: hit.longitude }).catch(() => []);
      const name = address?.district || address?.city || address?.subregion || query;
      const detail = [address?.city !== name ? address?.city : null, address?.region].filter(Boolean).join(', ') || REGIONS[region].name;
      if (!results.some((p) => p.name === name && p.detail === detail)) results.push({ name, detail, lat: hit.latitude, lng: hit.longitude });
    }
    if (results.length > 0) break;
  }
  return results.slice(0, 8);
}

const PLACE_TYPES = new Set(['City', 'Town', 'Village', 'Hamlet', 'Suburban Area', 'Other Settlement']);

/** Places matching what the driver typed, inside the regions Pumpwise covers. */
export async function searchPlaces(input: string, allowed: readonly RegionId[]): Promise<Place[]> {
  const query = classifyQuery(input);
  if (!query) return [];
  const ukAllowed = allowed.includes('uk');

  if (query.kind === 'uk-postcode' && ukAllowed) {
    const result = await getPostcodes<PostcodeResult>(`/postcodes/${encodeURIComponent(query.value)}`);
    const found = result && place(result.postcode ?? query.value, first(result.admin_district), result.latitude, result.longitude, allowed);
    return found ? [found] : [];
  }
  if (query.kind === 'uk-outcode' && ukAllowed) {
    const result = await getPostcodes<PostcodeResult>(`/outcodes/${encodeURIComponent(query.value)}`);
    const found = result && place(result.outcode ?? query.value, first(result.admin_district), result.latitude, result.longitude, allowed);
    if (found) return [found];
  }
  if (query.kind === 'au-postcode') {
    return appleSearch(`${query.value} Australia`, allowed);
  }

  const apple = await appleSearch(query.value, allowed);
  if (apple.length > 0 || !ukAllowed) return apple;

  // Web preview and UK names: postcodes.io's place search.
  const results = (await getPostcodes<PostcodesPlace[]>(`/places?q=${encodeURIComponent(query.value)}&limit=20`)) ?? [];
  const places: Place[] = [];
  for (const r of results) {
    if (r.local_type && !PLACE_TYPES.has(r.local_type)) continue;
    const detail = [r.district_borough || r.county_unitary, r.region || r.country].filter(Boolean).join(', ');
    const found = place(r.name_1 ?? query.value, detail, r.latitude, r.longitude, allowed);
    if (found && !places.some((p) => p.name === found.name && p.detail === found.detail)) places.push(found);
    if (places.length >= 8) break;
  }
  return places;
}

/** City shortcuts for the regions Pumpwise covers. */
export function citiesFor(regions: readonly RegionId[]): Place[] {
  return regions.flatMap((id) => [...REGIONS[id].cities]);
}
