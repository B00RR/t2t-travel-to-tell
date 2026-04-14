import { Stack } from 'expo-router';
import {
  diaryDetailTransition,
  modalTransition,
  pushTransition,
  fadeSlideTransition,
} from '@/constants/transitions';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { OfflineBanner } from '@/components/OfflineBanner';
import { View } from 'react-native';

export default function AppLayout() {
  usePushRegistration();

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
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
          name="settings/password"
          options={pushTransition}
        />
        <Stack.Screen
          name="settings/delete-account"
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
    </View>
  );
}
