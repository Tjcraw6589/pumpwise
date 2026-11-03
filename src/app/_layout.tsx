import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, useFonts } from '@expo-google-fonts/barlow-condensed';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated);
  const onboardingComplete = useStore((s) => s.settings.onboardingComplete);
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });
  const ready = hydrated && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Protected guard={!onboardingComplete}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={onboardingComplete}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="station/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="place" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="about" />
        </Stack.Protected>
        <Stack.Screen name="legal/[doc]" />
      </Stack>
    </SafeAreaProvider>
  );
}
