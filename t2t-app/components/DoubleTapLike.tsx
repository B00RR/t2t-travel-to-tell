import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface DoubleTapLikeProps {
  children: React.ReactNode;
  onDoubleTap?: () => void;
  color?: string;
}

/**
 * Wraps children with double-tap-to-like gesture.
 * Shows a heart burst animation on double tap.
 */
export function DoubleTapLike({ children, onDoubleTap, color = '#C84242' }: DoubleTapLikeProps) {
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      heartScale.value = 0;
      heartOpacity.value = 1;
      heartScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withDelay(400, withTiming(0, { duration: 200 }))
      );
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(500, withTiming(0, { duration: 300 }))
      );
    });

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={styles.container}>
        {children}
        <Animated.View style={[styles.heartOverlay, heartStyle]}>
          <Ionicons name="heart" size={64} color={color} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
