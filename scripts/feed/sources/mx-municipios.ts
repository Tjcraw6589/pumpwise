// Mexico: which municipality and state a point is in, worked out offline from simplified INEGI
// boundaries (scripts/feed/data/mx-municipios.json.gz, made by scripts/feed/mx-municipios/generate.mjs).
// The CNE station list gives only a name and a position, so this is how Mexican stations get a town.
//
// Boundaries: INEGI, Marco Geoestadístico 2024, under the Términos de Libre Uso de la Información del
// INEGI. Attribution: MX_MUNICIPIOS_ATTRIBUTION below. Simplified to about 100 m, so a station within
// about 100 m of a municipal border may be given the neighbouring municipality.
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

export const MX_MUNICIPIOS_ATTRIBUTION =
  'Fuente: INEGI, Marco Geoestadístico 2024 (Marco Geoestadístico Integrado, agosto 2024). Límites municipales simplificados y redondeados por Pumpwise.';
/** A point outside every boundary (a pier, a gap left by simplifying) takes the nearest municipality this close. */
export const MX_NEAREST_KM = 3;

export interface MxMunicipio {
  municipio: string;
  estado: string;
}

interface DataFile {
  step: number;
  states: string[];
  /** [name, state index, CVEGEO, ...rings]; a ring is lng, lat in steps, the first pair absolute and the rest differences. */
  municipios: [string, number, string, ...number[][]][];
}

interface Area {
  result: MxMunicipio;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  /** Each ring as lng, lat pairs in degrees. */
  rings: Float64Array[];
}

const CELL_DEG = 0.25;
const KM_PER_DEG = 111.2;

let areas: Area[] | null = null;
const grid = new Map<string, number[]>();

const cellKey = (y: number, x: number): string => `${y}_${x}`;

function load(): Area[] {
  if (areas) return areas;
  const file = new URL('../data/mx-municipios.json.gz', import.meta.url);
  const data = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as DataFile;
  const loaded: Area[] = [];
  for (const [name, state, , ...encoded] of data.municipios) {
    const area: Area = { result: { municipio: name, estado: data.states[state] ?? '' }, minLat: 90, maxLat: -90, minLng: 180, maxLng: -180, rings: [] };
    for (const ring of encoded) {
      const coords = new Float64Array(ring.length);
      let x = 0;
      let y = 0;
      for (let i = 0; i + 1 < ring.length; i += 2) {
        x += ring[i] as number;
        y += ring[i + 1] as number;
        const lng = x * data.step;
        const lat = y * data.step;
        coords[i] = lng;
        coords[i + 1] = lat;
        if (lat < area.minLat) area.minLat = lat;
        if (lat > area.maxLat) area.maxLat = lat;
        if (lng < area.minLng) area.minLng = lng;
        if (lng > area.maxLng) area.maxLng = lng;
      }
      area.rings.push(coords);
    }
    const index = loaded.push(area) - 1;
    for (let cy = Math.floor(area.minLat / CELL_DEG); cy <= Math.floor(area.maxLat / CELL_DEG); cy++) {
      for (let cx = Math.floor(area.minLng / CELL_DEG); cx <= Math.floor(area.maxLng / CELL_DEG); cx++) {
        const key = cellKey(cy, cx);
        const list = grid.get(key);
        if (list) list.push(index);
        else grid.set(key, [index]);
      }
    }
  }
  areas = loaded;
  return loaded;
}

/** Even-odd rule over every ring, so holes and islands both work. */
function contains(area: Area, lat: number, lng: number): boolean {
  if (lat < area.minLat || lat > area.maxLat || lng < area.minLng || lng > area.maxLng) return false;
  let inside = false;
  for (const ring of area.rings) {
    const n = ring.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const xi = ring[i] as number;
      const yi = ring[i + 1] as number;
      const xj = ring[j] as number;
      const yj = ring[j + 1] as number;
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/** Shortest distance in km from the point to the area's border (flat-earth, fine over a few km). */
function distanceKm(area: Area, lat: number, lng: number, kx: number): number {
  let best = Infinity;
  for (const ring of area.rings) {
    const n = ring.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const ax = ((ring[j] as number) - lng) * kx;
      const ay = ((ring[j + 1] as number) - lat) * KM_PER_DEG;
      const bx = ((ring[i] as number) - lng) * kx;
      const by = ((ring[i + 1] as number) - lat) * KM_PER_DEG;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
      const d = Math.hypot(ax + t * dx, ay + t * dy);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * The municipality and state a point is in, by INEGI's names ("Zapopan", "Jalisco"), or the nearest
 * one within MX_NEAREST_KM; null out at sea or outside Mexico.
 */
export function mxMunicipio(lat: number, lng: number): MxMunicipio | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const all = load();
  for (const index of grid.get(cellKey(Math.floor(lat / CELL_DEG), Math.floor(lng / CELL_DEG))) ?? []) {
    const area = all[index] as Area;
    if (contains(area, lat, lng)) return area.result;
  }
  const kx = KM_PER_DEG * Math.cos((lat * Math.PI) / 180);
  const dLat = MX_NEAREST_KM / KM_PER_DEG;
  const dLng = MX_NEAREST_KM / kx;
  const seen = new Set<number>();
  let nearest: Area | null = null;
  let nearestKm = MX_NEAREST_KM;
  for (let cy = Math.floor((lat - dLat) / CELL_DEG); cy <= Math.floor((lat + dLat) / CELL_DEG); cy++) {
    for (let cx = Math.floor((lng - dLng) / CELL_DEG); cx <= Math.floor((lng + dLng) / CELL_DEG); cx++) {
      for (const index of grid.get(cellKey(cy, cx)) ?? []) {
        if (seen.has(index)) continue;
        seen.add(index);
        const area = all[index] as Area;
        if (lat < area.minLat - dLat || lat > area.maxLat + dLat || lng < area.minLng - dLng || lng > area.maxLng + dLng) continue;
        const km = distanceKm(area, lat, lng, kx);
        if (km <= nearestKm) {
          nearestKm = km;
          nearest = area;
        }
      }
    }
  }
  return nearest ? nearest.result : null;
}
