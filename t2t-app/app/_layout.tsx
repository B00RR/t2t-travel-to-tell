import { Stack, useRouter, useSegments, SplashScreen, ErrorBoundary } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Caveat_400Regular,
  Caveat_600SemiBold,
} from '@expo-google-fonts/caveat';
import 'react-native-reanimated';
import '../i18n';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemePreferenceProvider } from '@/hooks/useThemePreference';

export { ErrorBoundary };

// Mantieni lo splash nativo visibile finché non sappiamo lo stato auth
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Caveat_400Regular,
    Caveat_600SemiBold,
  });

  useEffect(() => {
    if (loading || (!fontsLoaded && !fontError)) return;

    // Auth verificato e font caricati: nascondi splash
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/(tabs)/home' as never);
    }
  }, [session, loading, fontsLoaded, fontError, router, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemePreferenceProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemePreferenceProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
