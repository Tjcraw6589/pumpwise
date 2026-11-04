import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { APP_VERSION, SUPPORT_EMAIL } from '@/config/app';
import { useAreaLabel } from '@/hooks/useAreaLabel';
import { useRegion } from '@/hooks/useRegion';
import { type PlainKey, t } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { fuelChipLabel, fuelOption } from '@/lib/regions';
import { economyLabel, economyToL100, radiusLabel, sameEconomy, sameRadius, toKm } from '@/lib/units';
import { showAdPrivacyOptions, usePrivacyOptionsRequired } from '@/services/ads';
import { DIRECTIONS_APPS } from '@/services/directions';
import { FILL_OPTIONS, type ThemePreference, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

const THEMES: readonly { key: ThemePreference; label: PlainKey }[] = [
  { key: 'system', label: 'theme.system' },
  { key: 'light', label: 'theme.light' },
  { key: 'dark', label: 'theme.dark' },
];

/** A typical price per litre in each currency, to put "best value" in money. */
const TYPICAL_PRICE: Record<string, number> = { AUD: 2.0, GBP: 1.4, EUR: 1.7, MXN: 24 };

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl }}>
      <AppText variant="overline" tone="muted" accessibilityRole="header" style={{ marginBottom: spacing.sm }}>
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

/** Asks before wiping every setting, since one stray tap would otherwise lose them. */
function confirmReset(reset: () => void): void {
  const message = t('settings.resetMessage');
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${t('settings.resetTitle')} ${message}`) ?? true) reset();
    return;
  }
  Alert.alert(t('settings.resetTitle'), message, [
    { text: t('action.cancel'), style: 'cancel' },
    { text: t('settings.resetConfirm'), style: 'destructive', onPress: reset },
  ]);
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetSettings = useStore((s) => s.resetSettings);
  const areaLabel = useAreaLabel();
  const region = useRegion();
  const adPrivacyRequired = usePrivacyOptionsRequired();
  const chosenFuel = fuelOption(region, settings.fuel).kind;
  const distanceUnit = region.distanceUnit;
  const card = { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth };
  // What one extra mile or kilometre (there and back) costs at a typical price, to make "best value" concrete.
  const typicalPrice = TYPICAL_PRICE[region.currencyCode] ?? 1.7;
  const unitCost = 2 * toKm(1, distanceUnit) * (settings.economyL100 / 100) * typicalPrice;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]} testID="settings-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={{ marginTop: spacing.sm }}>
          {t('settings.title')}
        </AppText>

        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
          {t('settings.showing', region.name)}
        </AppText>

        <Section title={t('settings.fuel')}>
          <View style={styles.wrap}>
            {region.fuels.map((f) => (
              <View key={f.kind} style={styles.chipGap}>
                <Chip label={fuelChipLabel(region, f.kind)} selected={chosenFuel === f.kind} onPress={() => updateSettings({ fuel: f.kind })} testID={`settings-fuel-${f.kind}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section title={t('search.area')} hint={t('settings.areaHint')}>
          <View style={styles.wrap}>
            {region.radiusOptions.map((r) => (
              <View key={r} style={styles.chipGap}>
                <Chip
                  label={radiusLabel(toKm(r, distanceUnit), distanceUnit)}
                  selected={sameRadius(settings.radiusKm, r, distanceUnit)}
                  onPress={() => updateSettings({ radiusKm: toKm(r, distanceUnit) })}
                  testID={`settings-radius-${r}`}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title={t('settings.fill')} hint={t('settings.fillHint')}>
          <View style={styles.wrap}>
            {FILL_OPTIONS.map((l) => (
              <View key={l} style={styles.chipGap}>
                <Chip label={`${l} L`} selected={settings.fillLitres === l} onPress={() => updateSettings({ fillLitres: l })} testID={`settings-fill-${l}`} />
              </View>
            ))}
          </View>
        </Section>

        <Section
          title={region.economyUnit === 'mpg' ? t('settings.mpg') : t('settings.economy')}
          hint={t('settings.economyHint', distanceUnit, formatMoney(unitCost, region))}
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

        <Section title={t('settings.members')} hint={t('settings.membersHint')}>
          <View style={[card, styles.switchRow, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
            <AppText variant="body" style={styles.flex}>
              {t('settings.includeMembers')}
            </AppText>
            <Switch
              value={settings.includeMembersOnly}
              onValueChange={(includeMembersOnly) => updateSettings({ includeMembersOnly })}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#FFFFFF"
              testID="settings-members"
              accessibilityLabel={t('settings.includeMembers')}
            />
          </View>
        </Section>

        <Section title={t('settings.directions')}>
          <SegmentedControl options={DIRECTIONS_APPS} value={settings.directionsApp} onChange={(key) => updateSettings({ directionsApp: key })} testID="settings-directions" />
        </Section>

        <Section title={t('place.title')}>
          <View style={card}>
            <LinkRow
              icon={settings.locationMode === 'gps' ? 'locate' : 'map'}
              label={settings.locationMode === 'gps' ? t('settings.myLocation') : t('settings.chosenPlace')}
              detail={areaLabel}
              onPress={() => router.push('/place')}
              testID="settings-place"
            />
          </View>
        </Section>

        <Section title={t('settings.appearance')}>
          <SegmentedControl options={THEMES.map((o) => ({ key: o.key, label: t(o.label) }))} value={settings.theme} onChange={(theme) => updateSettings({ theme })} testID="theme" />
        </Section>

        <Section title={t('settings.about')}>
          <View style={card}>
            <LinkRow icon="information-circle-outline" label={t('settings.whereFrom')} onPress={() => router.push('/about')} testID="settings-about" />
            <LinkRow icon="flag-outline" label={t('settings.report')} detail={region.source.name} onPress={() => void Linking.openURL(region.report.url)} />
            <LinkRow icon="shield-checkmark-outline" label={t('settings.privacy')} onPress={() => router.push('/legal/privacy')} testID="settings-privacy" />
            {adPrivacyRequired ? (
              <LinkRow icon="options-outline" label={t('settings.adPrivacy')} onPress={() => void showAdPrivacyOptions()} testID="settings-ad-privacy" />
            ) : null}
            <LinkRow icon="document-text-outline" label={t('settings.terms')} onPress={() => router.push('/legal/terms')} testID="settings-terms" />
            <LinkRow
              icon="mail-outline"
              label={t('settings.contact')}
              onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pumpwise')}`)}
            />
          </View>
        </Section>

        <Pressable
          accessibilityRole="button"
          onPress={() => confirmReset(resetSettings)}
          hitSlop={12}
          style={{ marginTop: spacing.xl, alignSelf: 'center' }}
          testID="settings-reset"
        >
          <AppText variant="small" tone="muted">
            {t('settings.reset')}
          </AppText>
        </Pressable>
        <AppText variant="caption" tone="faint" align="center" style={{ marginTop: spacing.lg }}>
          {t('settings.footer', APP_VERSION)}
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
