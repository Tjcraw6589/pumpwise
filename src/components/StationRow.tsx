import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatMiles, formatPounds } from '@/lib/format';
import type { PriceBand, RankedStation, SortMode } from '@/lib/ranking';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { FreshnessTag } from './FreshnessTag';
import { PriceSign } from './PriceSign';

interface StationRowProps {
  item: RankedStation;
  band: PriceBand;
  sortBy: SortMode;
  now: Date;
  onPress: () => void;
}

export function StationRow({ item, band, sortBy, now, onPress }: StationRowProps) {
  const { colors, spacing, radius } = useTheme();
  const { station, open } = item;
  const closed = open.status === 'closed';
  const subtitle = [station.brand && station.brand !== station.name ? station.brand : null, station.town].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${station.name}, ${item.price.p} pence, ${formatMiles(item.distance)}`}
      testID={`station-row-${station.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          opacity: closed ? 0.6 : 1,
        },
      ]}
    >
      <PriceSign pence={item.price.p} size="md" tone={item.stale ? 'muted' : band === 'low' ? 'cheap' : 'normal'} />
      <View style={[styles.body, { marginLeft: spacing.md }]}>
        <View style={styles.titleRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.flex}>
            {station.name}
          </AppText>
          <AppText variant="stat" style={{ marginLeft: spacing.sm, fontSize: 17, lineHeight: 22 }}>
            {formatMiles(item.distance)}
          </AppText>
        </View>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        <View style={[styles.metaRow, { marginTop: 4 }]}>
          <View style={styles.flex}>
            <FreshnessTag at={item.price.at} now={now} />
          </View>
          {sortBy === 'value' ? (
            <AppText variant="small" tone="muted">
              {formatPounds(item.realCost)} total
            </AppText>
          ) : open.label ? (
            <AppText variant="small" tone={closed ? 'pricey' : 'muted'} numberOfLines={1}>
              {closed ? 'Closed' : open.label.replace('Open until', 'Till')}
            </AppText>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: spacing.xs }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
