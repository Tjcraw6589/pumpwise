import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { MARK } from '@/lib/mark';
import { useTheme } from '@/theme/useTheme';

/** The Pumpwise mark (pin, fuel drop, price-down chevron), the same shapes as the app icon. */
export function PumpMark({ size = 64, testID }: { size?: number; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="120 100 760 820" testID={testID} accessibilityLabel="Pumpwise">
      <Defs>
        <LinearGradient id="pumpwise-pin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFC93D" />
          <Stop offset="1" stopColor="#F29A00" />
        </LinearGradient>
      </Defs>
      <Path d={MARK.pin} fill="url(#pumpwise-pin)" />
      <Path d={MARK.drop} fill={colors.sign} />
      <Path
        d={MARK.chevron}
        fill="none"
        stroke={colors.accent}
        strokeWidth={MARK.chevronWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
