import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface NoticeProps {
  tone?: 'info' | 'warning';
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  action?: { label: string; onPress: () => void };
  testID?: string;
}

/** A slim banner for things worth knowing but not blocking, such as "prices could not be updated". */
export function Notice({ tone = 'info', icon, text, action, testID }: NoticeProps) {
  const { colors, spacing, radius } = useTheme();
  const bg = tone === 'warning' ? colors.warningSoft : colors.accentSoft;
  const fg = tone === 'warning' ? colors.warning : colors.accentText;
  return (
    <View
      testID={testID}
      style={[styles.row, { backgroundColor: bg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }]}
    >
      <Ionicons name={icon ?? (tone === 'warning' ? 'cloud-offline-outline' : 'information-circle-outline')} size={18} color={fg} />
      <AppText variant="caption" style={[styles.text, { color: colors.text, marginLeft: spacing.sm }]}>
        {text}
      </AppText>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8} style={{ marginLeft: spacing.sm }}>
          <AppText variant="small" style={{ color: fg }}>
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1 },
});
