import { StyleSheet, View } from 'react-native';

import { freshness, timeAgo } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

/** "● Reported 25 min ago". Green within a day, amber within two weeks, then a gentle warning. */
export function FreshnessTag({ at, now, testID }: { at: string; now: Date; testID?: string }) {
  const { colors, spacing } = useTheme();
  const level = freshness(at, now);
  const dot = level === 'fresh' ? colors.cheap : level === 'recent' ? colors.accent : colors.pricey;
  const text = level === 'old' ? `Not confirmed since ${timeAgo(at, now)}` : `Reported ${timeAgo(at, now)}`;
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
