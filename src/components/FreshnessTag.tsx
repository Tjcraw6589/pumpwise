import { StyleSheet, View } from 'react-native';

import type { RegionId } from '@/lib/feed';
import { dailyLabel, freshness, timeAgo } from '@/lib/format';
import { REGIONS } from '@/lib/regions';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

/**
 * How current a price is. UK: "● Reported 25 min ago". WA, where prices are fixed for the day:
 * "● Today's price". Green when current, amber when older, then a gentle warning.
 */
export function FreshnessTag({ at, region, now, testID }: { at: string; region: RegionId; now: Date; testID?: string }) {
  const { colors, spacing } = useTheme();
  const info = REGIONS[region];
  let text: string;
  let level: ReturnType<typeof freshness>;
  if (info.priceMode === 'daily') {
    ({ text, level } = dailyLabel(at, now, info.utcOffsetMinutes(now)));
  } else {
    level = freshness(at, now);
    text = level === 'old' ? `Not confirmed since ${timeAgo(at, now)}` : `Reported ${timeAgo(at, now)}`;
  }
  const dot = level === 'fresh' ? colors.cheap : level === 'recent' ? colors.accent : colors.pricey;
  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.dot, { backgroundColor: dot, marginRight: spacing.xs + 2 }]} />
      <AppText variant="caption" tone={level === 'old' ? 'warning' : 'muted'} numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
