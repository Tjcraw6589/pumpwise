import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { APP_VERSION, REPORT_PRICE_URL, SUPPORT_EMAIL } from '@/config/app';
import { useAreaLabel } from '@/hooks/useAreaLabel';
import { fuelChipLabel, FUELS } from '@/lib/fuels';
import { formatPounds } from '@/lib/format';
import { LITRES_PER_UK_GALLON } from '@/lib/ranking';
import { DIRECTIONS_APPS } from '@/services/directions';
import { FILL_OPTIONS, MPG_OPTIONS, RADIUS_OPTIONS, type ThemePreference, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const THEMES: readonly { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'Automatic' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl }}>
      <AppText variant="overline" tone="muted" style={{ marginBottom: spacing.sm }}>
        {title}
      </AppText>
      {children}
      {hint ? (
        <AppText variant="caption" tone="faint" style={{ marginTop: spacing.xs }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

function LinkRow({ icon, label, detail, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; onPress: () => void; testID?: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.linkRow, { paddingVertical: spacing.md, paddingHorizontal: spacing.md, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      <Ionicons name={icon} size={20} color={colors.accentText} />
      <AppText variant="body" style={[styles.flex, { marginLeft: spacing.md }]}>
        {label}
      </AppText>
      {detail ? (
        <AppText variant="caption" tone="muted" style={{ marginRight: spacing.xs }}>
          {detail}
        </AppText>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetSettings = useStore((s) => s.resetSettings);
  const areaLabel = useAreaLabel();
  const card = { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth };
  // What a one-mile detour (there and back) costs at a typical 140p a litre, to make "best value" concrete.
  const mileCost = ((2 * LITRES_PER_UK_GALLON) / settings.mpg) * 1.4;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]} testID="settings-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={{ marginTop: spacing.sm }}>
          Settings
        </AppText>

        <Section title="Your fuel">
          <View style={styles.wrap}>
            {FUELS.map((f) => (
              <View key={f.code} style={styles.chipGap}>
                <Chip label={fuelChipLabel(f.code)} selected={settings.fuel === f.code} onPress={() => updateSettings({ fuel: f.code })} testID={`settings-fuel-${f.code}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Search area" hint="How far to look for the cheapest station. The nearest one is always shown.">
          <View style={styles.wrap}>
            {RADIUS_OPTIONS.map((r) => (
              <View key={r} style={styles.chipGap}>
                <Chip label={`${r} mi`} selected={settings.radiusMiles === r} onPress={() => updateSettings({ radiusMiles: r })} testID={`settings-radius-${r}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typical fill-up" hint="Used to show what you save, in pounds.">
          <View style={styles.wrap}>
            {FILL_OPTIONS.map((l) => (
              <View key={l} style={styles.chipGap}>
                <Chip label={`${l} L`} selected={settings.fillLitres === l} onPress={() => updateSettings({ fillLitres: l })} testID={`settings-fill-${l}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section
          title="Your car's miles per gallon"
          hint={`"Best value" adds the fuel to drive there and back. At ${settings.mpg} mpg each extra mile costs about ${formatPounds(mileCost)} there and back.`}
        >
          <View style={styles.wrap}>
            {MPG_OPTIONS.map((m) => (
              <View key={m} style={styles.chipGap}>
                <Chip label={`${m}`} selected={settings.mpg === m} onPress={() => updateSettings({ mpg: m })} testID={`settings-mpg-${m}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Directions open in">
          <SegmentedControl options={DIRECTIONS_APPS} value={settings.directionsApp} onChange={(key) => updateSettings({ directionsApp: key })} testID="settings-directions" />
        </Section>

        <Section title="Search around">
          <View style={card}>
            <LinkRow
              icon={settings.locationMode === 'gps' ? 'locate' : 'map'}
              label={settings.locationMode === 'gps' ? 'My location' : 'A chosen place'}
              detail={areaLabel}
              onPress={() => router.push('/place')}
              testID="settings-place"
            />
          </View>
        </Section>

        <Section title="Appearance">
          <SegmentedControl options={THEMES} value={settings.theme} onChange={(theme) => updateSettings({ theme })} testID="theme" />
        </Section>

        <Section title="About">
          <View style={card}>
            <LinkRow icon="information-circle-outline" label="Where the prices come from" onPress={() => router.push('/about')} testID="settings-about" />
            <LinkRow icon="flag-outline" label="Report a wrong price" onPress={() => void Linking.openURL(REPORT_PRICE_URL)} />
            <LinkRow icon="shield-checkmark-outline" label="Privacy" onPress={() => router.push('/legal/privacy')} testID="settings-privacy" />
            <LinkRow icon="document-text-outline" label="Terms of use" onPress={() => router.push('/legal/terms')} testID="settings-terms" />
            <LinkRow
              icon="mail-outline"
              label="Contact support"
              onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pumpwise')}`)}
            />
          </View>
        </Section>

        <Pressable accessibilityRole="button" onPress={resetSettings} style={{ marginTop: spacing.xl, alignSelf: 'center' }} testID="settings-reset">
          <AppText variant="small" tone="muted">
            Reset settings
          </AppText>
        </Pressable>
        <AppText variant="caption" tone="faint" align="center" style={{ marginTop: spacing.lg }}>
          Pumpwise {APP_VERSION} · No account, no tracking.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chipGap: { marginRight: 8, marginBottom: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
});
