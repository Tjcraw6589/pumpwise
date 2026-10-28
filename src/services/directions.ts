import { Linking, Platform } from 'react-native';

import type { LatLng } from '@/lib/geo';
import type { DirectionsApp } from '@/store/useStore';

export const DIRECTIONS_APPS: readonly { key: DirectionsApp; label: string }[] = [
  { key: 'apple', label: 'Apple Maps' },
  { key: 'google', label: 'Google Maps' },
  { key: 'waze', label: 'Waze' },
];

export function directionsUrls(app: DirectionsApp, to: LatLng, name: string): { native: string | null; web: string } {
  const ll = `${to.lat},${to.lng}`;
  const q = encodeURIComponent(name);
  switch (app) {
    case 'google':
      return {
        native: `comgooglemaps://?daddr=${ll}&directionsmode=driving`,
        web: `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=driving`,
      };
    case 'waze':
      return { native: `waze://?ll=${ll}&navigate=yes`, web: `https://waze.com/ul?ll=${ll}&navigate=yes` };
    default:
      return {
        native: Platform.OS === 'ios' ? `maps://?daddr=${ll}&dirflg=d&q=${q}` : null,
        web: `https://maps.apple.com/?daddr=${ll}&dirflg=d&q=${q}`,
      };
  }
}

/** Opens turn-by-turn directions in the driver's chosen app, falling back to the web link. */
export async function openDirections(app: DirectionsApp, to: LatLng, name: string): Promise<void> {
  const { native, web } = directionsUrls(app, to, name);
  if (native) {
    try {
      if (await Linking.canOpenURL(native)) {
        await Linking.openURL(native);
        return;
      }
    } catch {
      // Fall through to the web link.
    }
  }
  await Linking.openURL(web).catch(() => undefined);
}
