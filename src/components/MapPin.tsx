import { StyleSheet, View } from 'react-native';

import { formatPrice } from '@/lib/format';
import type { PriceBand } from '@/lib/ranking';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

/** A small price sign with a pointer, used as a map marker. Green digits for the cheapest quarter. */
export function MapPin({ pence, band, selected, stale }: { pence: number; band: PriceBand; selected: boolean; stale: boolean }) {
  const { colors, fonts } = useTheme();
  const digit = stale ? colors.signLabel : band === 'low' ? colors.signCheap : band === 'high' ? '#FF8A80' : colors.signDigits;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.sign,
            borderColor: selected ? colors.accent : colors.signBorder,
            borderWidth: selected ? 2 : 1,
            paddingHorizontal: selected ? 9 : 6,
            paddingVertical: selected ? 4 : 2,
          },
        ]}
      >
        <AppText style={{ fontFamily: fonts.display, fontSize: selected ? 19 : 15, lineHeight: selected ? 22 : 18, color: digit }} maxFontSizeMultiplier={1}>
          {formatPrice(pence)}
        </AppText>
      </View>
      <View style={[styles.pointer, { borderTopColor: selected ? colors.accent : colors.sign }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bubble: { borderRadius: 8 },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
