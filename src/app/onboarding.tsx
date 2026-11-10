import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { askForLocation } from '@/components/PhaseState';
import { PriceSign } from '@/components/PriceSign';
import { PumpMark } from '@/components/PumpMark';
import { type Coverage, coverageOf, useCoverage } from '@/hooks/useRegion';
import { deviceCountry, t } from '@/i18n';
import type { RegionId } from '@/lib/feed';
import { DEFAULT_REGION, type RegionInfo, REGIONS, regionList } from '@/lib/regions';
import { fetchMeta } from '@/services/feedClient';
import { selectionHaptic } from '@/services/haptics';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

/** Where a new user probably is, from the phone's country, so the welcome shows their fuels and money. */
const COUNTRY_REGION: Record<string, RegionId> = { AU: 'wa', ES: 'es', FR: 'fr', MX: 'mx', PT: 'pt', GB: 'uk' };

/** Two believable signs for the welcome, in the feed's hundredths of the region's money. */
function samplePrices(region: RegionInfo): [number, number] {
  if (region.currencyCode === 'EUR') return [154.9, 169.9];
  if (region.currencyCode === 'MXN') return [2399, 2459];
  if (region.currencyCode === 'GBP') return [139.9, 147.9];
  return [189.9, 204.5];
}

/** Three quick steps: what Pumpwise does, which fuel, and location. */
export default function OnboardingScreen() {
  const { colors, spacing, radius } = useTheme();
  const [step, setStep] = useState(0);
  const loaded = useCoverage();
  // The feed only loads once the tabs open, so fetch its summary here: the welcome then names only
  // the places that really have prices, never the ones still waiting to go live.
  const [fetched, setFetched] = useState<Coverage | null>(null);
  useEffect(() => {
    let gone = false;
    fetchMeta()
      .then((meta) => {
        if (!gone) setFetched(coverageOf(meta));
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, []);
  const coverage = loaded.known ? loaded : fetched;
  const country = deviceCountry();
  const guess = country ? COUNTRY_REGION[country] : undefined;
  const start = REGIONS[guess && (!coverage || coverage.live.includes(guess)) ? guess : DEFAULT_REGION];
  const [cheapSample, nearSample] = samplePrices(start);
  // WA's "tomorrow's prices" line only for phones in Australia; anywhere else, the general line.
  const fact =
    !guess || start.currencyCode !== 'AUD' ? t('onboard.factOfficial') : coverage?.live.includes('nsw') ? t('onboard.factNsw') : t('onboard.factWa');
  const fuel = useStore((s) => s.settings.fuel);
  const updateSettings = useStore((s) => s.updateSettings);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  // iPhone SE and other short screens get a smaller mark and title so the welcome fits without scrolling.
  const compact = useWindowDimensions().height < 740;
  const gap = compact ? spacing.lg : spacing.xl;

  const finish = async (withLocation: boolean) => {
    if (withLocation) await askForLocation();
    completeOnboarding();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} testID="onboarding">
      <View style={[styles.top, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === step ? colors.accent : colors.border, width: i === step ? 22 : 8 }]}
            />
          ))}
        </View>
        {step < 2 ? (
          <Pressable accessibilityRole="button" onPress={() => void finish(false)} hitSlop={14} testID="onboarding-skip">
            <AppText variant="small" tone="muted">
              {t('onboard.skip')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={[styles.body, { padding: spacing.lg }]}>
        {step === 0 ? (
          <View style={styles.center}>
            <PumpMark size={compact ? 80 : 120} />
            <AppText variant="title" align="center" style={{ fontSize: compact ? 38 : 44, lineHeight: compact ? 40 : 46, marginTop: gap }}>
              {t('onboard.headline')}
            </AppText>
            <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.md, maxWidth: 340 }}>
              {t('onboard.pitch')}
              {coverage && coverage.live.length > 0 ? t('onboard.covering', regionList(coverage.live)) : ''}
            </AppText>
            <View style={[styles.signs, { marginTop: gap, gap: spacing.md }]}>
              <View style={styles.center}>
                <PriceSign pence={cheapSample} region={start} size={compact ? 'md' : 'lg'} tone="cheap" label={t('onboard.cheapest')} />
              </View>
              <View style={styles.center}>
                <PriceSign pence={nearSample} region={start} size={compact ? 'md' : 'lg'} label={t('onboard.nearest')} />
              </View>
            </View>
            <View style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginTop: gap }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.cheap} />
              <AppText variant="caption" style={[styles.flex, { marginLeft: spacing.sm }]}>
                {fact}
              </AppText>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View>
            <AppText variant="title">{t('onboard.fuelTitle')}</AppText>
            <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              {t('onboard.fuelBody')}
            </AppText>
            {start.fuels.filter((f) => f.common).map((f) => {
              const selected = f.kind === fuel;
              return (
                <Pressable
                  key={f.kind}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  testID={`onboarding-fuel-${f.kind}`}
                  onPress={() => {
                    selectionHaptic();
                    updateSettings({ fuel: f.kind });
                  }}
                  style={[
                    styles.fuel,
                    {
                      backgroundColor: selected ? colors.accentSoft : colors.surface,
                      borderColor: selected ? colors.accent : colors.border,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <View style={[styles.code, { backgroundColor: colors.sign, borderRadius: radius.sm }]}>
                    <AppText variant="stat" style={{ color: colors.signDigits }}>
                      {f.pumpCode}
                    </AppText>
                  </View>
                  <View style={[styles.flex, { marginLeft: spacing.md }]}>
                    <AppText variant="bodyBold">{f.label}</AppText>
                    <AppText variant="caption" tone="muted">
                      {f.description}
                    </AppText>
                  </View>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? colors.accentText : colors.textFaint} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.center}>
            <View style={[styles.locBadge, { backgroundColor: colors.sign, borderColor: colors.signBorder, borderRadius: radius.xl }]}>
              <Ionicons name="navigate" size={44} color={colors.accent} />
            </View>
            <AppText variant="title" align="center" style={{ marginTop: spacing.xl }}>
              {t('onboard.locTitle')}
            </AppText>
            <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.sm, maxWidth: 340 }}>
              {t('onboard.locBody')}
            </AppText>
            <View style={[styles.fact, { backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl }]}>
              <Ionicons name="car" size={20} color={colors.warning} />
              <AppText variant="caption" style={[styles.flex, { marginLeft: spacing.sm }]}>
                {t('onboard.driving')}
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        {step < 2 ? (
          <Button label={t('action.continue')} size="lg" fullWidth onPress={() => setStep(step + 1)} testID="onboarding-next" />
        ) : (
          <>
            <Button label={t('action.allowLocation')} size="lg" fullWidth onPress={() => void finish(true)} testID="onboarding-allow" />
            <Button label={t('onboard.notNow')} variant="ghost" size="lg" fullWidth onPress={() => void finish(false)} testID="onboarding-not-now" />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  body: { flexGrow: 1, justifyContent: 'center' },
  center: { alignItems: 'center' },
  signs: { flexDirection: 'row', justifyContent: 'center' },
  fact: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  fuel: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, minHeight: 72 },
  code: { width: 56, height: 40, alignItems: 'center', justifyContent: 'center' },
  locBadge: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
