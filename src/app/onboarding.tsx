import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { askForLocation } from '@/components/PhaseState';
import { PriceSign } from '@/components/PriceSign';
import { PumpMark } from '@/components/PumpMark';
import { FUELS } from '@/lib/fuels';
import { selectionHaptic } from '@/services/haptics';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

/** Three quick steps: what Pumpwise does, which fuel, and location. */
export default function OnboardingScreen() {
  const { colors, spacing, radius } = useTheme();
  const [step, setStep] = useState(0);
  const fuel = useStore((s) => s.settings.fuel);
  const updateSettings = useStore((s) => s.updateSettings);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

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
          <Pressable accessibilityRole="button" onPress={() => void finish(false)} hitSlop={10} testID="onboarding-skip">
            <AppText variant="small" tone="muted">
              Skip
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={[styles.body, { padding: spacing.lg }]}>
        {step === 0 ? (
          <View style={styles.center}>
            <PumpMark size={120} />
            <AppText variant="title" align="center" style={{ fontSize: 44, lineHeight: 46, marginTop: spacing.xl }}>
              Cheap fuel,{'\n'}close by.
            </AppText>
            <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.md, maxWidth: 340 }}>
              Open Pumpwise anywhere in the UK and see the nearest station and the cheapest one around you, with directions in one tap.
            </AppText>
            <View style={[styles.signs, { marginTop: spacing.xl, gap: spacing.md }]}>
              <View style={styles.center}>
                <PriceSign pence={139.9} size="lg" tone="cheap" label="CHEAPEST" />
              </View>
              <View style={styles.center}>
                <PriceSign pence={146.9} size="lg" label="NEAREST" />
              </View>
            </View>
            <View style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.cheap} />
              <AppText variant="caption" style={[styles.flex, { marginLeft: spacing.sm }]}>
                Official prices from the UK Government Fuel Finder scheme. By law, forecourts report every change within 30 minutes.
              </AppText>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View>
            <AppText variant="title">What do you fill up with?</AppText>
            <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
              You can switch any time from the top of the screen.
            </AppText>
            {FUELS.filter((f) => f.common).map((f) => {
              const selected = f.code === fuel;
              return (
                <Pressable
                  key={f.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  testID={`onboarding-fuel-${f.code}`}
                  onPress={() => {
                    selectionHaptic();
                    updateSettings({ fuel: f.code });
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
              Find stations around you
            </AppText>
            <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.sm, maxWidth: 340 }}>
              Pumpwise uses your location only while it is open, to work out what is near. Your exact location stays on your iPhone.
            </AppText>
            <View style={[styles.fact, { backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl }]}>
              <Ionicons name="car" size={20} color={colors.warning} />
              <AppText variant="caption" style={[styles.flex, { marginLeft: spacing.sm }]}>
                Driving? Let a passenger check, or look before you set off. Directions open in your maps app.
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        {step < 2 ? (
          <Button label="Continue" size="lg" fullWidth onPress={() => setStep(step + 1)} testID="onboarding-next" />
        ) : (
          <>
            <Button label="Allow location" size="lg" fullWidth onPress={() => void finish(true)} testID="onboarding-allow" />
            <Button label="Not now" variant="ghost" size="lg" fullWidth onPress={() => void finish(false)} testID="onboarding-not-now" />
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
