import { Pressable, StyleSheet, View } from 'react-native';

import { selectionHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface SegmentedControlProps<K extends string> {
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  testID?: string;
}

export function SegmentedControl<K extends string>({ options, value, onChange, testID }: SegmentedControlProps<K>) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]} testID={testID}>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            testID={testID ? `${testID}-${o.key}` : undefined}
            hitSlop={SEGMENT_SLOP}
            onPress={() => {
              if (!selected) {
                selectionHaptic();
                onChange(o.key);
              }
            }}
            style={[
              styles.segment,
              { borderRadius: radius.sm, backgroundColor: selected ? colors.surface : 'transparent' },
              selected && styles.selectedShadow,
            ]}
          >
            <AppText variant="small" tone={selected ? 'text' : 'muted'} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The segments are 32 points tall (16 of text, 8 above and below), like Apple's own; the slop makes the tap area 44. */
export const SEGMENT_HEIGHT = 32;
export const SEGMENT_SLOP = { top: 6, bottom: 6 } as const;

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  selectedShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
