import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  /** Buttons, stacked. */
  children?: ReactNode;
  testID?: string;
}

/** Friendly full-width message for "no location", "no prices yet" and similar states. */
export function EmptyState({ icon, title, body, children, testID }: EmptyStateProps) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={[styles.wrap, { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }]} testID={testID}>
      <View style={[styles.badge, { backgroundColor: colors.sign, borderRadius: radius.xl, borderColor: colors.signBorder }]}>
        <Ionicons name={icon} size={34} color={colors.accent} />
      </View>
      <AppText variant="h2" align="center" style={{ marginTop: spacing.xl }}>
        {title}
      </AppText>
      <AppText variant="body" tone="muted" align="center" style={{ marginTop: spacing.sm, maxWidth: 340 }}>
        {body}
      </AppText>
      {children ? <View style={[styles.actions, { marginTop: spacing.xl, gap: spacing.sm }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  badge: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actions: { alignSelf: 'stretch', maxWidth: 360, width: '100%', marginHorizontal: 'auto' },
});
