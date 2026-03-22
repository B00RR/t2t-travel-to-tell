import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/theme';

interface CompassRandomizerProps {
  onRandomize: () => void;
  disabled?: boolean;
}

/**
 * Floating compass button that spins on press
 * and triggers a random destination selection.
 * Includes progressive haptic feedback during spin.
 */
export function CompassRandomizer({ onRandomize, disabled }: CompassRandomizerProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const spinning = useRef(false);

  function handlePress() {
    if (spinning.current || disabled) return;
    spinning.current = true;

    // Progressive haptic feedback
    const hapticSequence = async () => {
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 80 + i * 40));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      // Final heavy impact when "landing"
      await new Promise(r => setTimeout(r, 100));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };
    hapticSequence();

    // Spin animation: accelerate → decelerate
    const totalRotation = rotation.value + 1080 + Math.random() * 360;
    rotation.value = withTiming(
      totalRotation,
      { duration: 1200, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(() => {
          spinning.current = false;
          onRandomize();
        })();
      },
    );

    // Bounce scale
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Animated.View style={[styles.btn, animatedStyle]}>
        <Ionicons name="compass" size={28} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: 20,
    zIndex: 10,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.orange,
    justifyContent: 'center',
    alignItems: 'center',
    // Orange glow aura
    shadowColor: Palette.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
