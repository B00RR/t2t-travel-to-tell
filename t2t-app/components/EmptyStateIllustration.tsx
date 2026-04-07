import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, withDelay, FadeInUp, withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Typography, Fonts } from '@/constants/theme';

type EmptyType = 'no-diaries' | 'no-following' | 'no-results' | 'no-saved' | 'no-entries' | 'error';

interface EmptyStateIllustrationProps {
  type: EmptyType;
  title: string;
  subtitle?: string;
  accent?: string;
}

const ICON_CONFIG: Record<EmptyType, { name: string; secondaryIcon?: string; tertiaryIcon?: string }> = {
  'no-diaries': { name: 'journal-outline', secondaryIcon: 'airplane-outline', tertiaryIcon: 'camera-outline' },
  'no-following': { name: 'people-outline', secondaryIcon: 'heart-outline', tertiaryIcon: 'chatbubble-outline' },
  'no-results': { name: 'search-outline', secondaryIcon: 'compass-outline' },
  'no-saved': { name: 'bookmark-outline', secondaryIcon: 'heart-outline' },
  'no-entries': { name: 'document-text-outline', secondaryIcon: 'pencil-outline' },
  'error': { name: 'cloud-offline-outline', secondaryIcon: 'refresh-outline' },
};

function EmptyStateIllustrationComponent({ type, title, subtitle, accent }: EmptyStateIllustrationProps) {
  const theme = useAppTheme();
  const config = ICON_CONFIG[type];

  // Floating animation for main icon
  const floatY = useSharedValue(0);
  // Orbiting animations for secondary icons
  const orbit1 = useSharedValue(0);
  const orbit2 = useSharedValue(0);
  // Pulse for the background circle
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Gentle floating
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Orbiting icons
    orbit1.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    orbit2.value = withDelay(500, withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    ));

    // Subtle pulse
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const mainIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const orbit1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: 40 * Math.cos(orbit1.value * Math.PI) },
      { translateY: -50 + 20 * Math.sin(orbit1.value * Math.PI) },
    ],
    opacity: 0.6,
  }));

  const orbit2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -35 * Math.cos(orbit2.value * Math.PI) },
      { translateY: 40 + 15 * Math.sin(orbit2.value * Math.PI) },
    ],
    opacity: 0.5,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const isError = type === 'error';

  return (
    <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.container}>
      {/* Illustration area */}
      <View style={styles.illustrationArea}>
        {/* Background pulse ring */}
        <Animated.View style={[
          styles.pulseRing,
          { borderColor: isError ? theme.red + '15' : theme.tealAlpha10 },
          pulseStyle,
        ]} />

        {/* Main icon */}
        <Animated.View style={[
          styles.mainIconCircle,
          { backgroundColor: isError ? theme.red + '12' : theme.tealAlpha10 },
          mainIconStyle,
        ]}>
          <Ionicons
            name={config.name as any}
            size={44}
            color={isError ? theme.red : theme.teal}
          />
        </Animated.View>

        {/* Secondary orbiting icon */}
        {config.secondaryIcon && (
          <Animated.View style={[styles.orbitIcon, orbit1Style]}>
            <View style={[styles.orbitIconBg, { backgroundColor: theme.orangeAlpha10 }]}>
              <Ionicons name={config.secondaryIcon as any} size={18} color={theme.orange} />
            </View>
          </Animated.View>
        )}

        {/* Tertiary orbiting icon */}
        {config.tertiaryIcon && (
          <Animated.View style={[styles.orbitIcon, orbit2Style]}>
            <View style={[styles.orbitIconBg, { backgroundColor: theme.tealAlpha10 }]}>
              <Ionicons name={config.tertiaryIcon as any} size={16} color={theme.teal} />
            </View>
          </Animated.View>
        )}
      </View>

      {/* Accent text (handwritten) */}
      {accent && (
        <Text style={[styles.accent, { color: theme.teal, fontFamily: Fonts.handwritten }]}>
          {accent}
        </Text>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      )}
    </Animated.View>
  );
}

export const EmptyStateIllustration = React.memo(EmptyStateIllustrationComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  illustrationArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
  mainIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitIcon: {
    position: 'absolute',
  },
  orbitIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
