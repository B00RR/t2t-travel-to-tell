import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
  const { theme } = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <Animated.View
      style={[
        { backgroundColor: theme.bgElevated },
        {
          width: width || '100%',
          height: height || 20,
          borderRadius: borderRadius || 6,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const DiaryCardSkeleton = () => {
  const { theme } = useAppTheme();
  return (
  <View style={[styles.cardSkeleton, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
    {/* Cover */}
    <Skeleton height={200} borderRadius={0} />
    <View style={styles.cardBody}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={styles.authorText}>
          <Skeleton width="50%" height={13} style={{ marginBottom: 5 }} />
          <Skeleton width="30%" height={10} />
        </View>
      </View>
      {/* Title */}
      <Skeleton width="85%" height={22} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={22} style={{ marginBottom: 12 }} />
      {/* Description */}
      <Skeleton width="100%" height={13} style={{ marginBottom: 5 }} />
      <Skeleton width="75%" height={13} />
    </View>
  </View>
  );
};

export const EntryCardSkeleton = () => {
  const { theme } = useAppTheme();
  return (
  <View style={[styles.entrySkeleton, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <Skeleton width="30%" height={20} borderRadius={10} />
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
    <Skeleton width="100%" height={15} style={{ marginBottom: 6 }} />
    <Skeleton width="90%" height={15} style={{ marginBottom: 6 }} />
    <Skeleton width="45%" height={15} />
  </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBody: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  authorText: {
    flex: 1,
  },
  entrySkeleton: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
