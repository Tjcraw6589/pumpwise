import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import type { FuelKind } from '@/lib/feed';
import { formatMoney, spokenPrice } from '@/lib/format';
import type { RankedStation, Savings } from '@/lib/ranking';
import { fuelOption, REGIONS } from '@/lib/regions';
import { formatDistance, radiusLabel } from '@/lib/units';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';
import { FreshnessTag } from './FreshnessTag';
import { PriceSign } from './PriceSign';
import { TomorrowTag } from './TomorrowTag';

/** What VoiceOver reads for a headline card: name, price, distance and opening. */
function spokenSummary(item: RankedStation): string {
  const region = REGIONS[item.station.region];
  return [item.station.name, spokenPrice(item.price.p, region), formatDistance(item.distance, region.distanceUnit), item.open.label]
    .filter(Boolean)
    .join(', ');
}

function Meta({ item }: { item: RankedStation }) {
  const { colors, spacing } = useTheme();
  const unit = REGIONS[item.station.region].distanceUnit;
  const parts = [formatDistance(item.distance, unit), item.open.label].filter(Boolean);
  return (
    <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
      <Ionicons name="navigate" size={13} color={colors.accentText} />
      <AppText variant="caption" tone="muted" style={{ marginLeft: 4, flexShrink: 1 }} numberOfLines={2}>
        {parts.join(' · ')}
      </AppText>
    </View>
  );
}

function PriceInfo({ item, now }: { item: RankedStation; now: Date }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.xs, gap: 2 }}>
      <FreshnessTag at={item.price.at} region={item.station.region} now={now} />
      {item.tomorrow !== null ? <TomorrowTag today={item.price.p} tomorrow={item.tomorrow} testID="tomorrow-tag" /> : null}
    </View>
  );
}

/** A station that works out cheaper than the headline pick once the drive there and back is counted. */
export interface BetterStill {
  name: string;
  /** Money better than the headline pick, all in, in the region's currency. */
  amount: number;
}

function SavingsLine({
  savings,
  fillLitres,
  item,
  betterPick,
  betterStill,
}: {
  savings: Savings;
  fillLitres: number;
  item: RankedStation;
  betterPick: boolean;
  betterStill: BetterStill | null;
}) {
  const { colors, spacing, radius } = useTheme();
  const region = REGIONS[item.station.region];
  const extra =
    savings.extraKm >= 0.2 ? t('hero.extraThereBack', formatDistance(savings.extraKm, region.distanceUnit)) : '';
  // When a third station beats the nearest once the drive is counted, point there instead of at the nearest.
  const verdict = betterPick ? t('hero.verdictBetterPick') : savings.amount > 0 ? t('hero.verdictFine') : t('hero.verdictNearest');
  const still = betterStill ? t('hero.betterStill', betterStill.name, formatMoney(betterStill.amount, region)) : '';
  const text = savings.worthIt
    ? null
    : savings.amount > 0
      ? t('hero.onlyAhead', formatMoney(savings.amount, region), fillLitres, formatDistance(savings.extraKm, region.distanceUnit), verdict)
      : t('hero.cheaperButFar', formatDistance(savings.extraKm, region.distanceUnit), fillLitres, verdict);
  return (
    <View
      testID="savings-line"
      style={[
        styles.savings,
        {
          backgroundColor: savings.worthIt ? colors.cheapSoft : colors.surfaceAlt,
          borderRadius: radius.md,
          padding: spacing.md,
          marginTop: spacing.md,
        },
      ]}
    >
      <Ionicons name={savings.worthIt ? 'trending-down' : 'swap-horizontal'} size={18} color={savings.worthIt ? colors.cheap : colors.textMuted} />
      <AppText variant="caption" style={{ flex: 1, marginLeft: spacing.sm }}>
        {savings.worthIt ? (
          <>
            {t('hero.saves')}{' '}
            <AppText variant="caption" style={{ fontWeight: '700', color: colors.cheap }}>
              {formatMoney(savings.amount, region)}
            </AppText>{' '}
            {t('hero.savesRest', fillLitres, extra, still)}
          </>
        ) : (
          text
        )}
      </AppText>
    </View>
  );
}

interface CheapestCardProps {
  item: RankedStation;
  radiusKm: number;
  fuel: FuelKind;
  fillLitres: number;
  savings: Savings | null;
  alsoNearest: boolean;
  /** A best value station (shown below) beats the nearest once the drive is counted. */
  betterPick?: boolean;
  /** The best value station, when it beats this one once the drive is counted. */
  betterStill?: BetterStill | null;
  now: Date;
  onDirections: () => void;
  onDetails: () => void;
}

/** The headline: the cheapest open station inside the search area. */
export function CheapestCard({ item, radiusKm, fuel, fillLitres, savings, alsoNearest, betterPick = false, betterStill = null, now, onDirections, onDetails }: CheapestCardProps) {
  const { colors, spacing, radius } = useTheme();
  const { station } = item;
  const region = REGIONS[station.region];
  return (
    <View
      testID="cheapest-card"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg }]}
    >
      <View style={styles.headerRow}>
        <AppText variant="overline" tone="accent" style={styles.flex}>
          {t('hero.cheapestWithin', radiusLabel(radiusKm, region.distanceUnit))}
        </AppText>
        {alsoNearest ? (
          <View style={[styles.pill, { backgroundColor: colors.cheapSoft, borderRadius: radius.pill }]}>
            <AppText variant="small" tone="cheap">
              {t('hero.alsoNearest')}
            </AppText>
          </View>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('hero.cheapestSpoken', spokenSummary(item))}
        accessibilityHint={t('a11y.opensStation')}
        onPress={onDetails} style={[styles.mainRow, { marginTop: spacing.md }]}>
        <PriceSign pence={item.price.p} region={region} size="lg" tone="cheap" label={fuelOption(region, fuel).pumpCode} testID="cheapest-price" />
        <View style={[styles.flex, { marginLeft: spacing.lg }]}>
          <AppText variant="h2" numberOfLines={2} testID="cheapest-name">
            {station.name}
          </AppText>
          {station.brand && station.brand !== station.name ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {station.brand}
            </AppText>
          ) : null}
          <Meta item={item} />
          <PriceInfo item={item} now={now} />
        </View>
      </Pressable>
      {savings ? <SavingsLine savings={savings} fillLitres={fillLitres} item={item} betterPick={betterPick} betterStill={betterStill} /> : null}
      <View style={[styles.actions, { marginTop: spacing.lg, gap: spacing.sm }]}>
        <Button
          label={t('action.directions')}
          variant="accent"
          size="lg"
          onPress={onDirections}
          icon={<Ionicons name="navigate" size={18} color="#121B26" />}
          style={styles.flex}
          testID="cheapest-directions"
        />
        <Button label={t('action.details')} variant="secondary" size="lg" onPress={onDetails} testID="cheapest-details" />
      </View>
    </View>
  );
}

interface NearestCardProps {
  item: RankedStation;
  fuel: FuelKind;
  now: Date;
  insideArea: boolean;
  onDirections: () => void;
  onDetails: () => void;
}

/** Compact card: the closest open station that sells the chosen fuel. */
export function NearestCard({ item, fuel, now, insideArea, onDirections, onDetails }: NearestCardProps) {
  const { colors, spacing, radius } = useTheme();
  const { station } = item;
  return (
    <Pressable
      testID="nearest-card"
      accessibilityRole="button"
      accessibilityLabel={t('hero.nearestSpoken', spokenSummary(item))}
      accessibilityHint={t('hero.nearestHint')}
      // VoiceOver can't reach a button inside another button, so directions is also an action here.
      accessibilityActions={[{ name: 'directions', label: t('action.directions') }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'directions') onDirections();
      }}
      onPress={onDetails}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: spacing.lg,
          marginTop: spacing.md,
        },
      ]}
    >
      <AppText variant="overline" tone="muted">
        {insideArea ? t('hero.nearest') : t('hero.nearestOutside')}
      </AppText>
      <View style={[styles.mainRow, { marginTop: spacing.sm }]}>
        <PriceSign pence={item.price.p} region={REGIONS[station.region]} size="md" label={fuelOption(REGIONS[station.region], fuel).pumpCode} testID="nearest-price" />
        <View style={[styles.flex, { marginLeft: spacing.md }]}>
          <AppText variant="bodyBold" numberOfLines={2} testID="nearest-name">
            {station.name}
          </AppText>
          <Meta item={item} />
          <PriceInfo item={item} now={now} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('hero.directionsTo', station.name)}
          onPress={onDirections}
          hitSlop={8}
          testID="nearest-directions"
          style={({ pressed }) => [
            styles.go,
            { backgroundColor: colors.accent, borderRadius: radius.pill, opacity: pressed ? 0.8 : 1, marginLeft: spacing.sm },
          ]}
        >
          <Ionicons name="navigate" size={20} color="#121B26" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  pill: { paddingHorizontal: 10, paddingVertical: 4 },
  mainRow: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  savings: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row' },
  go: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
