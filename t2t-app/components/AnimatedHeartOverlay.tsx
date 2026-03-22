import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';

interface AnimatedHeartOverlayProps {
  visible: boolean;
  onFinish: () => void;
}

/**
 * Full-screen heart burst animation for double-tap like.
 * The heart scales up with a bouncy spring, then fades out.
 */
export function AnimatedHeartOverlay({ visible, onFinish }: AnimatedHeartOverlayProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    opacity.value = 1;
    rotation.value = -10;

    scale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 300 }),
      withDelay(300, withTiming(1.5, { duration: 200, easing: Easing.out(Easing.ease) })),
    );

    rotation.value = withSequence(
      withSpring(0, { damping: 8, stiffness: 200 }),
    );

    opacity.value = withDelay(
      600,
      withTiming(0, { duration: 300 }, () => {
        scale.value = 0;
        runOnJS(onFinish)();
      }),
    );
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Ionicons name="heart" size={90} color={Palette.red} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
