import React, { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface KenBurnsImageProps {
  uri: string;
  style?: ViewStyle;
  duration?: number;
  maxScale?: number;
  paused?: boolean;
}

/**
 * Cinematic Ken Burns image — slow continuous zoom & pan.
 * Creates that "National Geographic documentary" feel.
 */
export function KenBurnsImage({
  uri,
  style,
  duration = 15000,
  maxScale = 1.15,
  paused = false,
}: KenBurnsImageProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (paused) return;

    const halfDuration = duration / 2;
    const panRange = 12; // pixels of subtle pan

    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(panRange, { duration: halfDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-panRange, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: halfDuration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-panRange * 0.6, { duration: halfDuration * 1.3, easing: Easing.inOut(Easing.ease) }),
        withTiming(panRange * 0.6, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: halfDuration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [paused, duration, maxScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.Image
      source={{ uri }}
      style={[styles.image, style, animatedStyle]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
