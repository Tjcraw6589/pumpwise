import { useColorScheme } from 'react-native';

import { useStore } from '@/store/useStore';

import { darkColors, fonts, lightColors, radius, spacing, type ThemeColors, typography } from './tokens';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fonts: typeof fonts;
}

export function useTheme(): Theme {
  const preference = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  const scheme: 'light' | 'dark' = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    fonts,
  };
}
