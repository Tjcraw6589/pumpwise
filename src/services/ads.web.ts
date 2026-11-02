import { createStatusStore } from './statusStore';

export type AdsStatus = 'idle' | 'initializing' | 'ready' | 'disabled';

/** Mobile ads are a native capability; the web preview never shows a banner. */
const status = createStatusStore<AdsStatus>('disabled');
export const useAdsStatus = status.use;
export const getAdsStatus = status.get;

export function usePrivacyOptionsRequired(): boolean {
  return false;
}

export async function showAdPrivacyOptions(): Promise<boolean> {
  return false;
}

export function loadAdsModule(): null {
  return null;
}

export function bannerUnitId(): string | null {
  return null;
}

export async function initializeAds(): Promise<void> {
  status.set('disabled');
}
