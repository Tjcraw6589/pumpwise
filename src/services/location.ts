import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import type { LatLng } from '@/lib/geo';
import type { PermissionState } from '@/store/useLive';

/**
 * Location stays on the phone. It is used to work out distances and which area of the price feed
 * to download; it is never sent to Pumpwise or stored.
 */

export interface PermissionResult {
  state: PermissionState;
  canAskAgain: boolean;
}

function toState(response: Location.LocationPermissionResponse): PermissionResult {
  const state: PermissionState = response.granted ? 'granted' : response.status === 'undetermined' ? 'undetermined' : 'denied';
  return { state, canAskAgain: response.canAskAgain };
}

export async function checkPermission(): Promise<PermissionResult> {
  try {
    return toState(await Location.getForegroundPermissionsAsync());
  } catch {
    return { state: 'undetermined', canAskAgain: true };
  }
}

export async function requestPermission(): Promise<PermissionResult> {
  try {
    return toState(await Location.requestForegroundPermissionsAsync());
  } catch {
    return { state: 'denied', canAskAgain: false };
  }
}

export async function currentPosition(): Promise<LatLng> {
  try {
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12_000)),
    ]);
    return { lat: fix.coords.latitude, lng: fix.coords.longitude };
  } catch (error) {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 }).catch(() => null);
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    throw error;
  }
}

/** Follows the driver: calls back every few hundred metres of movement. */
export async function watchPosition(onMove: (position: LatLng) => void): Promise<() => void> {
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 300, timeInterval: 15_000 },
    (fix) => onMove({ lat: fix.coords.latitude, lng: fix.coords.longitude }),
  );
  return () => subscription.remove();
}

/** A short place name for the header, such as "Harrogate". Uses the phone's own map service. */
export async function areaNameFor(point: LatLng): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: point.lat, longitude: point.lng });
    if (!place) return null;
    return place.district || place.city || place.subregion || place.region || null;
  } catch {
    return null;
  }
}

export function openAppSettings(): void {
  Linking.openSettings().catch(() => undefined);
}
