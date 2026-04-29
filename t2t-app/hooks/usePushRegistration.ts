import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Foreground presentation: we want the banner + sound + badge even
 * when the app is in the foreground. Configured once at module load.
 * Wrapped in try/catch because expo-notifications is partially
 * unavailable on web and in some test environments.
 */
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // no-op — safe to ignore, push notifications are a soft dependency
}

async function registerAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C85A42',
  });
}

async function getExpoPushToken(): Promise<string | null> {
  // Push tokens only work on physical devices.
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data;
  } catch (err) {
    if (__DEV__) console.warn('Failed to fetch Expo push token', err);
    return null;
  }
}

/**
 * Registers the current device for push notifications and persists the
 * Expo token in `public.push_tokens` so the `send-push` Edge Function
 * can deliver to every device the user has enrolled.
 *
 * Returns nothing: side-effect only. Errors are logged, never thrown —
 * push is a soft dependency, the app must keep working without it.
 */
export function usePushRegistration() {
  const { user } = useAuth();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      registeredRef.current = null;
      return;
    }
    // Avoid double-registration in React strict-mode.
    if (registeredRef.current === user.id) return;
    registeredRef.current = user.id;

    (async () => {
      try {
        await registerAndroidChannel();
        const token = await getExpoPushToken();
        if (!token) return;

        const platform: 'ios' | 'android' | 'web' =
          Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

        const { error } = await supabase
          .from('push_tokens')
          .upsert(
            {
              user_id: user.id,
              token,
              platform,
              device_name: Device.deviceName ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,token' },
          );

        if (error) {
          if (__DEV__) console.warn('Failed to persist push token', error.message);
        }
      } catch (err) {
        if (__DEV__) console.warn('Push registration failed', err);
      }
    })();
  }, [user]);

  // Incoming notification listeners (kept quiet for now — UI reacts via
  // the `notifications` realtime channel; this is the hook point if we
  // later want to show in-app toasts or deep-link on tap).
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Intentionally empty — in-app updates come from the realtime
      // subscription in useNotifications.
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      // TODO(phase-2+): deep-link to the target (diary/comment/follow).
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
}
