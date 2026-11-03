import appJson from '../../app.json';

/** Google's sample AdMob publisher, used until the owner's own AdMob app exists. */
const GOOGLE_SAMPLE_PUBLISHER = 'ca-app-pub-3940256099942544';

interface AppJson {
  expo: {
    version: string;
    plugins: (string | [string, Record<string, unknown>])[];
    extra: { monetization?: { admobBannerIos?: string } };
  };
}

const app = appJson as unknown as AppJson;
const adsPlugin = app.expo.plugins.find((p): p is [string, Record<string, unknown>] => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');

describe('app config', () => {
  test('a real banner unit never ships with the sample AdMob app id, and both come from the same AdMob account', () => {
    const unit = (app.expo.extra.monetization?.admobBannerIos ?? '').trim();
    if (!unit || !adsPlugin) return; // No unit: no ads are requested at all.
    const appId = String(adsPlugin[1].iosAppId ?? '');
    expect(appId.startsWith(GOOGLE_SAMPLE_PUBLISHER)).toBe(false);
    expect(unit.startsWith(GOOGLE_SAMPLE_PUBLISHER)).toBe(false);
    expect(unit).toMatch(/^ca-app-pub-\d+\/\d+$/);
    expect(appId).toMatch(/^ca-app-pub-\d+~\d+$/);
    expect(unit.split('/')[0]).toBe(appId.split('~')[0]);
  });
});
