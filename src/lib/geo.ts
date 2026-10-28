export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_MILES = 3958.8;

/** Straight-line distance in miles. Roads are longer, so the app says "about" where it matters. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Map region (in degrees) that fits a circle of `radiusMiles`, with a little margin. */
export function regionForRadius(center: LatLng, radiusMiles: number) {
  const latitudeDelta = (radiusMiles / 69.0) * 2.4;
  const longitudeDelta = latitudeDelta / Math.max(0.2, Math.cos((center.lat * Math.PI) / 180));
  return { latitude: center.lat, longitude: center.lng, latitudeDelta, longitudeDelta };
}
