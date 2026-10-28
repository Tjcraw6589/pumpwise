import Constants from 'expo-constants';

interface Extra {
  feedUrl?: string;
  support?: { email?: string; siteUrl?: string; privacyUrl?: string; termsUrl?: string };
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Where the price feed lives. The web smoke test points this at a local made-up feed through
 * EXPO_PUBLIC_FEED_URL; the app itself uses the GitHub Pages address from app.json.
 */
export const FEED_URL = (process.env.EXPO_PUBLIC_FEED_URL || extra.feedUrl || 'https://tjcraw6589.github.io/pumpwise/data/v2').replace(
  /\/$/,
  '',
);

export const APP_NAME = Constants.expoConfig?.name ?? 'Pumpwise';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const SUPPORT_EMAIL = extra.support?.email ?? 'tyjcraw@gmail.com';
export const SITE_URL = extra.support?.siteUrl ?? 'https://tjcraw6589.github.io/pumpwise/';
