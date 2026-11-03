import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Fraction of the screen height the sheet may grow to. */
  maxHeightRatio?: number;
  testID?: string;
}

/** Bottom sheet built on the core Modal so it behaves the same on iOS, Android and web. */
export function Sheet({ visible, onClose, title, children, maxHeightRatio = 0.85, testID }: SheetProps) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [drag] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (visible) drag.setValue(0);
  }, [visible, drag]);
  // Dragging the handle or title down closes the sheet, as on any iOS sheet; a short drag springs back.
  const pan = useMemo(() => {
    const settle = () => Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    return PanResponder.create({
      // Capture, so a drag that starts on the title text still moves the sheet; taps still reach Close.
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => (g.dy > 80 || g.vy > 0.8 ? onClose() : settle()),
      // Keep the drag until the finger lifts, so nothing else takes it halfway.
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: settle,
    });
  }, [drag, onClose]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <Animated.View
          testID={testID}
          style={[
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
              transform: [{ translateY: drag }],
            },
          ]}
        >
          <View {...pan.panHandlers} style={styles.grab}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            {title ? (
              <View style={[styles.header, { paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
                <AppText variant="h3">{title}</AppText>
                <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={12} testID={testID ? `${testID}-close` : undefined}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : null}
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  // The top of the sheet (handle and title) is where a drag down closes it.
  grab: { paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
