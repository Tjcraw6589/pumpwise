import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bannerUnitId, loadAdsModule, useAdsStatus } from '@/services/ads';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

/**
 * Anchored adaptive banner at the bottom of the Nearby tab. Renders nothing until an ad has
 * actually loaded, so a slow network or a no-fill never leaves a blank gap, and never renders
 * before onboarding is complete.
 */
export function AdBanner() {
  const onboarded = useStore((s) => s.settings.onboardingComplete);
  const status = useAdsStatus();
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const mod = loadAdsModule();
  const unitId = bannerUnitId();

  if (!onboarded || status !== 'ready' || !mod || !unitId) return null;
  const { BannerAd, BannerAdSize } = mod;

  return (
    <View
      testID="ad-banner"
      style={[styles.slot, loaded && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surface }]}
    >
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setLoaded(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', overflow: 'hidden' },
});
