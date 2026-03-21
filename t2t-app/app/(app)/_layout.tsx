import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="diary/[id]" />
      <Stack.Screen name="diary/add-day" options={{ presentation: 'modal' }} />
      <Stack.Screen name="diary/day/[day_id]" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
