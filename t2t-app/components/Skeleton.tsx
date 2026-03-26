import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

/**
 * Terra Evolved — Skeleton loading with shimmer effect.
 * Uses Reanimated for 60fps performance.
 */
export const Skeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
  const theme = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.25, 0.55]),
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.bgElevated,
          width: width || '100%',
          height: height || 20,
          borderRadius: borderRadius || Radius.sm,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const DiaryCardSkeleton = () => {
  const theme = useAppTheme();
  return (
    <View style={[styles.cardSkeleton, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      {/* Cover */}
      <Skeleton height={200} borderRadius={0} />
      <View style={styles.cardBody}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={styles.authorText}>
            <Skeleton width="50%" height={13} style={{ marginBottom: 5 }} />
          </View>
        </View>
        {/* Title */}
        <Skeleton width="85%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
        {/* Description */}
        <Skeleton width="100%" height={13} style={{ marginBottom: 5 }} />
        <Skeleton width="75%" height={13} />
        {/* Stats bar */}
        <View style={styles.statsRow}>
          <Skeleton width={50} height={12} />
          <Skeleton width={50} height={12} />
          <Skeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
};

export const EntryCardSkeleton = () => {
  const theme = useAppTheme();
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

export const ProfileSkeleton = () => {
  const theme = useAppTheme();
  return (
    <View style={[styles.profileSkeleton, { backgroundColor: theme.bgSurface }]}>
      {/* Avatar */}
      <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
      {/* Name */}
      <Skeleton width="40%" height={22} style={{ alignSelf: 'center', marginBottom: 8 }} />
      {/* Bio */}
      <Skeleton width="70%" height={14} style={{ alignSelf: 'center', marginBottom: 20 }} />
      {/* Stats */}
      <View style={styles.statsRow}>
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={60} height={32} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardBody: {
    padding: Spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  authorText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  entrySkeleton: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  profileSkeleton: {
    padding: Spacing.xl,
  },
});
