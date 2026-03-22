import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Palette } from '@/constants/theme';

interface StoryProgressBarProps {
  count: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
}

/**
 * Segmented progress bar at top of immersive story carousel.
 * Each segment represents one diary. Active segment fills with teal.
 */
export function StoryProgressBar({ count, scrollX, screenWidth }: StoryProgressBarProps) {
  if (count <= 1) return null;

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <SegmentBar key={i} index={i} scrollX={scrollX} screenWidth={screenWidth} count={count} />
      ))}
    </View>
  );
}

function SegmentBar({
  index,
  scrollX,
  screenWidth,
  count,
}: {
  index: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
  count: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const scaleX = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      'clamp',
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      'clamp',
    );

    return { opacity, transform: [{ scaleX }] };
  });

  return (
    <View style={[styles.segment, { flex: 1 / count }]}>
      <View style={styles.segmentBg} />
      <Animated.View style={[styles.segmentFill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  segment: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
  },
  segmentFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.teal,
    borderRadius: 2,
    transformOrigin: 'left',
  },
});
