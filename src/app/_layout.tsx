import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { queryClient } from '@/api/queryClient';
import { SignInScreen } from '@/auth/SignInScreen';
import { useAuthStatus } from '@/auth/useAuth';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const auth = useAuthStatus();
  const ready = (fontsLoaded || !!fontError) && auth !== 'loading';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // A different user (or none) must not see the previous one's cached data.
  useEffect(() => {
    if (auth === 'signedOut') {
      queryClient.clear();
    }
  }, [auth]);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      {auth === 'signedOut' ? (
        <SignInScreen />
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.space } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      )}
    </QueryClientProvider>
  );
}
