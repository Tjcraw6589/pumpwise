import { StyleSheet, View, type ViewStyle } from 'react-native';

import { formatPrice } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

export type SignTone = 'cheap' | 'normal' | 'muted';
export type SignSize = 'xl' | 'lg' | 'md' | 'sm';

interface PriceSignProps {
  /** Price per litre in pence or cents. */
  pence: number;
  tone?: SignTone;
  size?: SignSize;
  /** Small label under the digits, such as "E10". */
  label?: string;
  style?: ViewStyle;
  testID?: string;
}

const SIZES: Record<SignSize, { digits: number; tenth: number; padH: number; padV: number; minWidth: number; label: number }> = {
  xl: { digits: 66, tenth: 30, padH: 18, padV: 10, minWidth: 156, label: 12 },
  lg: { digits: 44, tenth: 24, padH: 14, padV: 8, minWidth: 112, label: 11 },
  md: { digits: 30, tenth: 17, padH: 10, padV: 6, minWidth: 82, label: 10 },
  sm: { digits: 18, tenth: 11, padH: 7, padV: 3, minWidth: 0, label: 9 },
};

/**
 * A forecourt price sign: lit digits on a dark panel, whole pence large and the tenth of a penny
 * smaller, as on UK pole signs. Always dark, in light and dark mode alike.
 */
export function PriceSign({ pence, tone = 'normal', size = 'md', label, style, testID }: PriceSignProps) {
  const { colors, fonts, radius } = useTheme();
  const s = SIZES[size];
  const [whole, tenth] = formatPrice(pence).split('.');
  const digitColor = tone === 'cheap' ? colors.signCheap : tone === 'muted' ? colors.signLabel : colors.signDigits;
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${formatPrice(pence)} per litre`}
      style={[
        styles.panel,
        {
          backgroundColor: colors.sign,
          borderColor: colors.signBorder,
          borderRadius: size === 'sm' ? radius.sm : radius.md,
          paddingHorizontal: s.padH,
          paddingVertical: s.padV,
          minWidth: s.minWidth,
        },
        style,
      ]}
    >
      <View style={styles.digits}>
        <AppText
          style={{ fontFamily: fonts.display, fontSize: s.digits, lineHeight: s.digits * 1.05, color: digitColor, letterSpacing: 1 }}
          maxFontSizeMultiplier={1.2}
        >
          {whole}
        </AppText>
        <AppText
          style={{
            fontFamily: fonts.display,
            fontSize: s.tenth,
            lineHeight: s.tenth * 1.05,
            color: digitColor,
            marginBottom: s.digits * 0.07,
          }}
          maxFontSizeMultiplier={1.2}
        >
          .{tenth}
        </AppText>
      </View>
      {label ? (
        <AppText
          style={{ fontFamily: fonts.displaySemi, fontSize: s.label, letterSpacing: 1.2, color: colors.signLabel, marginTop: 1 }}
          maxFontSizeMultiplier={1.2}
        >
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  digits: { flexDirection: 'row', alignItems: 'flex-end' },
});
