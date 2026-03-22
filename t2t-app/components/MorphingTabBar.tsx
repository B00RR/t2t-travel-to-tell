import React, { useEffect } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette, Glass } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';

interface MorphingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_ICONS: Record<string, { default: string; active: string }> = {
  index:   { default: 'compass-outline',  active: 'compass' },
  create:  { default: 'add',              active: 'add' },
  profile: { default: 'person-outline',   active: 'person' },
};

/**
 * 3-tab morphing navigation bar.
 * Clean, minimal design with a glowing center Create button.
 * Adapts to both light and dark themes via glassmorphism.
 */
export function MorphingTabBar({ state, descriptors, navigation }: MorphingTabBarProps) {
  const { unreadCount } = useNotifications();

  // Animate in on mount
  const mountProgress = useSharedValue(0);
  useEffect(() => {
    mountProgress.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(mountProgress.value, [0, 1], [100, 0]) },
      { scale: interpolate(mountProgress.value, [0, 1], [0.8, 1]) },
    ],
    opacity: mountProgress.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCreate = route.name === 'create';

          const iconConfig = TAB_ICONS[route.name] || TAB_ICONS.index;
          const iconName = isFocused ? iconConfig.active : iconConfig.default;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCreate) {
            return (
              <TouchableOpacity
                key={route.key}
                style={styles.createBtnOuter}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.createBtn, isFocused && styles.createBtnFocused]}>
                  <Ionicons
                    name="add"
                    size={28}
                    color={isFocused ? Palette.bgPrimary : '#fff'}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabBtn}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={isFocused ? Palette.teal : 'rgba(255,255,255,0.5)'}
                />
                {/* Active indicator dot */}
                {isFocused && <View style={styles.activeDot} />}
                {/* Notification badge on profile */}
                {route.name === 'profile' && unreadCount > 0 && (
                  <View style={styles.notifDot} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,15,25,0.85)',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    // Deep shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 24,
  },

  tabBtn: {
    width: 56,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.teal,
    marginTop: 4,
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.red,
    borderWidth: 1.5,
    borderColor: 'rgba(15,15,25,0.85)',
  },

  // Center Create button — the star of the show
  createBtnOuter: {
    marginHorizontal: 8,
  },
  createBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    // Teal glow aura
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  createBtnFocused: {
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.5,
  },
});
