import { create } from 'zustand';

import type { FeedMeta, FeedStation } from '@/lib/feed';
import type { LatLng } from '@/lib/geo';

export type PermissionState = 'checking' | 'undetermined' | 'granted' | 'denied';

export type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Position extends LatLng {
  at: number;
}

/** What the app knows right now: location and downloaded prices. Not saved between launches. */
export interface LiveState {
  permission: PermissionState;
  /** iOS only asks once; after a "Don't allow" the driver has to use Settings. */
  canAskAgain: boolean;
  position: Position | null;
  locating: boolean;
  locationError: string | null;
  /** Suburb or town name for the search centre, such as "Cannington". */
  areaName: string | null;
  feedStatus: FeedStatus;
  /** A download is running while older prices stay on screen. */
  refreshing: boolean;
  feedError: 'offline' | 'unavailable' | null;
  meta: FeedMeta | null;
  stations: FeedStation[];
  /** Search centre the stations were downloaded for. */
  loadedFor: (LatLng & { radiusKm: number }) | null;
  loadedAt: number | null;
  /** Bumped to ask the controller for a fresh download (pull to refresh). */
  refreshToken: number;
  set: (patch: Partial<LiveState>) => void;
  requestRefresh: () => void;
}

export const useLive = create<LiveState>()((set) => ({
  permission: 'checking',
  canAskAgain: true,
  position: null,
  locating: false,
  locationError: null,
  areaName: null,
  feedStatus: 'idle',
  refreshing: false,
  feedError: null,
  meta: null,
  stations: [],
  loadedFor: null,
  loadedAt: null,
  refreshToken: 0,
  set: (patch) => set(patch),
  requestRefresh: () => set((s) => ({ refreshToken: s.refreshToken + 1 })),
}));
