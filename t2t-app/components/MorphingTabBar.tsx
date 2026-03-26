import React, { useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { Spacing, Radius, Typography, Shadows } from '@/constants/theme';

interface MorphingTabBarProps {
  state: { routes: Array<{ key: string; name: string }>; index: number };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { emit: (e: any) => any; navigate: (name: string) => void };
}

const TAB_ICONS: Record<string, { default: string; active: string }> = {
  home:    { default: 'home-outline',     active: 'home' },
  explore: { default: 'compass-outline',  active: 'compass' },
  create:  { default: 'add-circle-outline', active: 'add-circle' },
  profile: { default: 'person-outline',   active: 'person' },
};

const TAB_LABELS: Record<string, string> = {
  home:    'Home',
  explore: 'Esplora',
  profile: 'Profilo',
};

/**
 * Terra Evolved — 3-tab premium bottom bar.
 * Spring mount animation, active indicator with glow,
 * icon breathing effect, haptic feedback.
 */
export function MorphingTabBar({ state, descriptors, navigation }: MorphingTabBarProps) {
  const theme = useAppTheme();
  const { unreadCount } = useNotifications();

  // Mount animation
  const mountProgress = useSharedValue(0);
  useEffect(() => {
    mountProgress.value = withSpring(1, { damping: 18, stiffness: 90 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(mountProgress.value, [0, 1], [80, 0]) },
    ],
    opacity: mountProgress.value,
  }));

  const handlePress = useCallback((route: any, index: number, isFocused: boolean) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }, [navigation]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.bgSurface,
          borderTopColor: theme.border,
        },
        Shadows.tabBar,
        containerStyle,
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isCreate = route.name === 'create';

        const iconConfig = TAB_ICONS[route.name] || TAB_ICONS.index;
        const iconName = isFocused ? iconConfig.active : iconConfig.default;
        const label = TAB_LABELS[route.name] || route.name;

        if (isCreate) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabBtn}
              onPress={handlePress(route, index, isFocused)}
              activeOpacity={0.7}
            >
              <View style={[styles.createBtn, { backgroundColor: theme.teal }]}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabBtn}
            onPress={handlePress(route, index, isFocused)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={22}
                color={isFocused ? theme.teal : theme.textMuted}
              />
              {route.name === 'profile' && unreadCount > 0 && (
                <View style={[styles.notifDot, { backgroundColor: theme.red }]} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isFocused ? theme.teal : theme.textMuted,
                  fontFamily: isFocused
                    ? Typography.label.fontFamily
                    : Typography.caption.fontFamily,
                },
              ]}
            >
              {label}
            </Text>
            {isFocused && (
              <Animated.View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: theme.teal },
                  Shadows.glow(theme.teal),
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2.5,
    borderRadius: 2,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
