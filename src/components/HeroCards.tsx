import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { fuelInfo } from '@/lib/fuels';
import { formatMiles, formatPounds } from '@/lib/format';
import type { RankedStation, Savings } from '@/lib/ranking';
import type { FuelCode } from '@/lib/feed';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';
import { FreshnessTag } from './FreshnessTag';
import { PriceSign } from './PriceSign';

interface CheapestCardProps {
  item: RankedStation;
  radiusMiles: number;
  fuel: FuelCode;
  fillLitres: number;
  savings: Savings | null;
  alsoNearest: boolean;
  now: Date;
  onDirections: () => void;
  onDetails: () => void;
}

function Meta({ item }: { item: RankedStation }) {
  const { colors, spacing } = useTheme();
  const parts = [formatMiles(item.distance), item.open.label].filter(Boolean);
  return (
    <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
      <Ionicons name="navigate" size={13} color={colors.accentText} />
      <AppText variant="caption" tone="muted" style={{ marginLeft: 4 }} numberOfLines={1}>
        {parts.join(' · ')}
      </AppText>
    </View>
  );
}

function SavingsLine({ savings, fillLitres }: { savings: Savings; fillLitres: number }) {
  const { colors, spacing, radius } = useTheme();
  const extra = savings.extraMiles >= 0.1 ? `, even after the extra ${savings.extraMiles.toFixed(1)} mi there and back` : '';
  const text = savings.worthIt
    ? `Saves ${formatPounds(savings.pounds)} on a ${fillLitres} L fill-up compared with the nearest${extra}.`
    : `Only ${formatPounds(Math.max(0, savings.pumpSaving))} cheaper on ${fillLitres} L than the nearest, and the extra driving eats most of that.`;
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
        {text}
      </AppText>
    </View>
  );
}

/** The headline: the cheapest open station inside the search area. */
export function CheapestCard({ item, radiusMiles, fuel, fillLitres, savings, alsoNearest, now, onDirections, onDetails }: CheapestCardProps) {
  const { colors, spacing, radius } = useTheme();
  const { station } = item;
  return (
    <View
      testID="cheapest-card"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg }]}
    >
      <View style={styles.headerRow}>
        <AppText variant="overline" tone="accent" style={styles.flex}>
          Cheapest within {radiusMiles} mi
        </AppText>
        {alsoNearest ? (
          <View style={[styles.pill, { backgroundColor: colors.cheapSoft, borderRadius: radius.pill }]}>
            <AppText variant="small" tone="cheap">
              Also the nearest
            </AppText>
          </View>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${station.name} details`} onPress={onDetails} style={[styles.mainRow, { marginTop: spacing.md }]}>
        <PriceSign pence={item.price.p} size="lg" tone="cheap" label={fuelInfo(fuel).pumpCode} testID="cheapest-price" />
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
          <View style={{ marginTop: spacing.xs }}>
            <FreshnessTag at={item.price.at} now={now} />
          </View>
        </View>
      </Pressable>
      {savings ? <SavingsLine savings={savings} fillLitres={fillLitres} /> : null}
      <View style={[styles.actions, { marginTop: spacing.lg, gap: spacing.sm }]}>
        <Button
          label="Directions"
          variant="accent"
          size="lg"
          onPress={onDirections}
          icon={<Ionicons name="navigate" size={18} color="#121B26" />}
          style={styles.flex}
          testID="cheapest-directions"
        />
        <Button label="Details" variant="secondary" size="lg" onPress={onDetails} testID="cheapest-details" />
      </View>
    </View>
  );
}

interface NearestCardProps {
  item: RankedStation;
  fuel: FuelCode;
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
      accessibilityLabel={`Nearest: ${station.name}`}
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
        Nearest{insideArea ? '' : ' (outside your area)'}
      </AppText>
      <View style={[styles.mainRow, { marginTop: spacing.sm }]}>
        <PriceSign pence={item.price.p} size="md" label={fuelInfo(fuel).pumpCode} testID="nearest-price" />
        <View style={[styles.flex, { marginLeft: spacing.md }]}>
          <AppText variant="bodyBold" numberOfLines={1} testID="nearest-name">
            {station.name}
          </AppText>
          <Meta item={item} />
          <View style={{ marginTop: 2 }}>
            <FreshnessTag at={item.price.at} now={now} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Directions to ${station.name}`}
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
