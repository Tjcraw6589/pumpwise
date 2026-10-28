import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface HeaderProps {
  title: string;
  /** 'back' shows a chevron, 'close' an X. Omit for a plain title. */
  dismiss?: 'back' | 'close';
  onDismiss?: () => void;
  right?: ReactNode;
  large?: boolean;
}

export function Header({ title, dismiss, onDismiss, right, large = false }: HeaderProps) {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View style={[styles.row, { paddingVertical: spacing.md }]}>
      {dismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismiss === 'back' ? 'Back' : 'Close'}
          hitSlop={12}
          onPress={handleDismiss}
          style={{ marginRight: spacing.sm }}
          testID="header-dismiss"
        >
          <Ionicons name={dismiss === 'back' ? 'chevron-back' : 'close'} size={26} color={colors.text} />
        </Pressable>
      ) : null}
      <AppText variant={large ? 'title' : 'h2'} style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
});
