import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Premium screen transition presets for Terra Evolved design system.
 * These give a cinematic feel to navigation without requiring shared-element libraries.
 */

/** Diary detail — immersive fade-scale entry (feels like zooming into the card) */
export const diaryDetailTransition: NativeStackNavigationOptions = {
  animation: 'fade_from_bottom',
  animationDuration: 350,
  gestureEnabled: true,
  // On iOS use a custom animation that feels like zooming in
  ...Platform.select({
    ios: {
      animation: 'fade_from_bottom' as const,
      animationDuration: 400,
    },
    default: {
      animation: 'fade_from_bottom' as const,
      animationDuration: 350,
    },
  }),
};

/** Modal presentation — slides up with spring feel */
export const modalTransition: NativeStackNavigationOptions = {
  presentation: 'modal',
  animation: 'slide_from_bottom',
  animationDuration: 350,
  gestureEnabled: true,
};

/** Standard push — smooth horizontal slide */
export const pushTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  animationDuration: 280,
  gestureEnabled: true,
};

/** Profile/detail — fade with slight slide */
export const fadeSlideTransition: NativeStackNavigationOptions = {
  animation: 'fade_from_bottom',
  animationDuration: 300,
  gestureEnabled: true,
};
