import { useLive } from '@/store/useLive';
import { useStore } from '@/store/useStore';

/** "Near Harrogate" when following the phone, or the chosen place's name. */
export function useAreaLabel(): string {
  const mode = useStore((s) => s.settings.locationMode);
  const place = useStore((s) => s.settings.place);
  const areaName = useLive((s) => s.areaName);
  if (mode === 'place' && place) return place.name;
  return areaName ? `Near ${areaName}` : 'Near you';
}
