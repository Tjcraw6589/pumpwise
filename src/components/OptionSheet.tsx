import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { selectionHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Sheet } from './Sheet';

export interface Option<K extends string | number> {
  key: K;
  label: string;
  detail?: string;
  /** Short badge on the right, such as a pump code. */
  badge?: string;
}

interface OptionSheetProps<K extends string | number> {
  visible: boolean;
  title: string;
  options: readonly Option<K>[];
  value: K;
  onSelect: (key: K) => void;
  onClose: () => void;
  testID?: string;
}

/** A bottom sheet with a tick list; picking an option closes it. */
export function OptionSheet<K extends string | number>({ visible, title, options, value, onSelect, onClose, testID }: OptionSheetProps<K>) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title} testID={testID}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        {options.map((option) => {
          const selected = option.key === value;
          return (
            <Pressable
              key={String(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={testID ? `${testID}-${option.key}` : undefined}
              onPress={() => {
                selectionHaptic();
                onSelect(option.key);
                onClose();
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: selected ? colors.accentSoft : pressed ? colors.surfaceAlt : 'transparent',
                },
              ]}
            >
              <View style={styles.text}>
                <AppText variant="bodyBold">{option.label}</AppText>
                {option.detail ? (
                  <AppText variant="caption" tone="muted">
                    {option.detail}
                  </AppText>
                ) : null}
              </View>
              {option.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.sign, borderRadius: radius.sm, marginRight: spacing.sm }]}>
                  <AppText variant="small" style={{ color: colors.signDigits }}>
                    {option.badge}
                  </AppText>
                </View>
              ) : null}
              <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? colors.accentText : colors.textFaint} />
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, marginBottom: 4 },
  text: { flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
});
