import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="diary/[id]"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="diary/add-day"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 350,
        }}
      />
      <Stack.Screen
        name="diary/day/[day_id]"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="planner/[id]"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="planner/create"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 350,
        }}
      />
      <Stack.Screen
        name="profile/[id]"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack>
  );
}
