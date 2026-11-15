import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { selectionHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Shows a small chevron: the chip opens a picker. */
  picker?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
}

/** Chips are 36 points tall; 4 points of slop on every side make the tap area 44, Apple's minimum. */
export const CHIP_HEIGHT = 36;
export const CHIP_SLOP = 4;

export function Chip({ label, selected = false, onPress, picker = false, icon, testID }: ChipProps) {
  const { colors, radius, spacing } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
      hitSlop={CHIP_SLOP}
      onPress={() => {
        selectionHaptic();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.onPrimary : colors.accentText} style={styles.icon} /> : null}
      <AppText variant="small" style={{ color: fg }} numberOfLines={1}>
        {label}
      </AppText>
      {picker ? <Ionicons name="chevron-down" size={14} color={selected ? colors.onPrimary : colors.textMuted} style={styles.chevron} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, height: CHIP_HEIGHT, flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 6 },
  chevron: { marginLeft: 4 },
});
