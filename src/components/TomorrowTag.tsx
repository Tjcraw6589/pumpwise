import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { formatChange, formatPrice } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

/**
 * "Tomorrow 182.9 (−4.0)": green when it drops, red when it rises. WA only.
 * `compact` ("182.9 tomorrow") fits beside the opening hours in list rows; the arrow and colour show the direction.
 */
export function TomorrowTag({ today, tomorrow, compact, testID }: { today: number; tomorrow: number; compact?: boolean; testID?: string }) {
  const { colors } = useTheme();
  const change = tomorrow - today;
  const tone = change < -0.05 ? 'cheap' : change > 0.05 ? 'pricey' : 'muted';
  const icon = change < -0.05 ? 'arrow-down' : change > 0.05 ? 'arrow-up' : 'remove';
  const color = tone === 'cheap' ? colors.cheap : tone === 'pricey' ? colors.pricey : colors.textMuted;
  return (
    <View style={styles.row} testID={testID} accessibilityLabel={`Tomorrow ${formatPrice(tomorrow)}, ${formatChange(change)}`}>
      <Ionicons name={icon} size={12} color={color} />
      <AppText variant="caption" tone={tone} style={{ marginLeft: 4 }} numberOfLines={1}>
        {compact ? `${formatPrice(tomorrow)} tomorrow` : `Tomorrow ${formatPrice(tomorrow)} (${formatChange(change)})`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
