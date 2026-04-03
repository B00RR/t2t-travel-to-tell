// Root redirect: il _layout.tsx gestisce la navigazione in base all'auth state
// Questo file esiste solo per soddisfare expo-router (serve una route iniziale)
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    // Mentre carica, mostra lo splash (gestito dal layout con SplashScreen.preventAutoHideAsync)
    return null;
  }

  return <Redirect href={session ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
