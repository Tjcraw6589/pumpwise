import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { APP_VERSION, SUPPORT_EMAIL } from '@/config/app';
import { useAreaLabel } from '@/hooks/useAreaLabel';
import { useRegion } from '@/hooks/useRegion';
import { formatMoney } from '@/lib/format';
import { fuelChipLabel, fuelOption } from '@/lib/regions';
import { economyLabel, economyToL100, formatDistance, sameEconomy, sameRadius, toKm } from '@/lib/units';
import { DIRECTIONS_APPS } from '@/services/directions';
import { FILL_OPTIONS, type ThemePreference, useStore } from '@/store/useStore';
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
  const region = useRegion();
  const chosenFuel = fuelOption(region, settings.fuel).kind;
  const distanceUnit = region.distanceUnit;
  const card = { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth };
  // What one extra mile or kilometre (there and back) costs at a typical price, to make "best value" concrete.
  const typicalPrice = region.id === 'wa' ? 2.0 : 1.4;
  const unitCost = 2 * toKm(1, distanceUnit) * (settings.economyL100 / 100) * typicalPrice;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]} testID="settings-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={{ marginTop: spacing.sm }}>
          Settings
        </AppText>

        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
          Showing {region.name} fuels and units.
        </AppText>

        <Section title="Your fuel">
          <View style={styles.wrap}>
            {region.fuels.map((f) => (
              <View key={f.kind} style={styles.chipGap}>
                <Chip label={fuelChipLabel(region, f.kind)} selected={chosenFuel === f.kind} onPress={() => updateSettings({ fuel: f.kind })} testID={`settings-fuel-${f.kind}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Search area" hint="How far to look for the cheapest station. The nearest one is always shown.">
          <View style={styles.wrap}>
            {region.radiusOptions.map((r) => (
              <View key={r} style={styles.chipGap}>
                <Chip
                  label={`${r} ${distanceUnit}`}
                  selected={sameRadius(settings.radiusKm, r, distanceUnit)}
                  onPress={() => updateSettings({ radiusKm: toKm(r, distanceUnit) })}
                  testID={`settings-radius-${r}`}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typical fill-up" hint="Used to show what you save.">
          <View style={styles.wrap}>
            {FILL_OPTIONS.map((l) => (
              <View key={l} style={styles.chipGap}>
                <Chip label={`${l} L`} selected={settings.fillLitres === l} onPress={() => updateSettings({ fillLitres: l })} testID={`settings-fill-${l}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section
          title={region.economyUnit === 'mpg' ? "Your car's miles per gallon" : "Your car's fuel use"}
          hint={`"Best value" adds the fuel to drive there and back. Each extra ${formatDistance(toKm(1, distanceUnit), distanceUnit).replace('1.0 ', '')} costs about ${formatMoney(unitCost, region.currency)} there and back.`}
        >
          <View style={styles.wrap}>
            {region.economyOptions.map((m) => (
              <View key={m} style={styles.chipGap}>
                <Chip
                  label={economyLabel(m, region.economyUnit)}
                  selected={sameEconomy(settings.economyL100, m, region.economyUnit)}
                  onPress={() => updateSettings({ economyL100: economyToL100(m, region.economyUnit) })}
                  testID={`settings-economy-${m}`}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Members-only stations" hint="Some stations, like Costco, only sell to members. Turn this on if you are one.">
          <View style={[card, styles.switchRow, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
            <AppText variant="body" style={styles.flex}>
              Include members-only stations
            </AppText>
            <Switch
              value={settings.includeMembersOnly}
              onValueChange={(includeMembersOnly) => updateSettings({ includeMembersOnly })}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#FFFFFF"
              testID="settings-members"
              accessibilityLabel="Include members-only stations"
            />
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
            <LinkRow icon="flag-outline" label="Report a wrong price" detail={region.source.name} onPress={() => void Linking.openURL(region.report.url)} />
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
  switchRow: { flexDirection: 'row', alignItems: 'center' },
});
