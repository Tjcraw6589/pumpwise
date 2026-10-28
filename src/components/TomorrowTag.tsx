import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { formatChange, formatPrice } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

/** "Tomorrow 182.9 (−4.0)": green when it drops, red when it rises. WA only. */
export function TomorrowTag({ today, tomorrow, testID }: { today: number; tomorrow: number; testID?: string }) {
  const { colors } = useTheme();
  const change = tomorrow - today;
  const tone = change < -0.05 ? 'cheap' : change > 0.05 ? 'pricey' : 'muted';
  const icon = change < -0.05 ? 'arrow-down' : change > 0.05 ? 'arrow-up' : 'remove';
  const color = tone === 'cheap' ? colors.cheap : tone === 'pricey' ? colors.pricey : colors.textMuted;
  return (
    <View style={styles.row} testID={testID} accessibilityLabel={`Tomorrow ${formatPrice(tomorrow)}, ${formatChange(change)}`}>
      <Ionicons name={icon} size={12} color={color} />
      <AppText variant="caption" tone={tone} style={{ marginLeft: 4 }} numberOfLines={1}>
        Tomorrow {formatPrice(tomorrow)} ({formatChange(change)})
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
