import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import type { TypographyVariant } from '@/theme/tokens';

export type TextTone = 'text' | 'muted' | 'faint' | 'accent' | 'cheap' | 'pricey' | 'warning' | 'onPrimary' | 'danger';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', tone = 'text', align, style, ...rest }: AppTextProps) {
  const { colors, typography } = useTheme();
  const color = {
    text: colors.text,
    muted: colors.textMuted,
    faint: colors.textFaint,
    accent: colors.accentText,
    cheap: colors.cheap,
    pricey: colors.pricey,
    warning: colors.warning,
    onPrimary: colors.onPrimary,
    danger: colors.danger,
  }[tone];
  return <Text maxFontSizeMultiplier={1.6} {...rest} style={[typography[variant] as TextStyle, { color, textAlign: align }, style]} />;
}
