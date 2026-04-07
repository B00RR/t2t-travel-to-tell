import { Stack } from 'expo-router';
import {
  diaryDetailTransition,
  modalTransition,
  pushTransition,
  fadeSlideTransition,
} from '@/constants/transitions';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="diary/[id]"
        options={diaryDetailTransition}
      />
      <Stack.Screen
        name="diary/add-day"
        options={modalTransition}
      />
      <Stack.Screen
        name="diary/day/[day_id]"
        options={pushTransition}
      />
      <Stack.Screen
        name="notifications"
        options={pushTransition}
      />
      <Stack.Screen
        name="settings"
        options={pushTransition}
      />
      <Stack.Screen
        name="planner/[id]"
        options={fadeSlideTransition}
      />
      <Stack.Screen
        name="planner/create"
        options={modalTransition}
      />
      <Stack.Screen
        name="profile/[id]"
        options={fadeSlideTransition}
      />
    </Stack>
  );
}
