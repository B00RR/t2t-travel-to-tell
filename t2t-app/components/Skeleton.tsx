import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
  const shimmerAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnimatedValue]);

  const opacity = shimmerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width || '100%',
          height: height || 20,
          borderRadius: borderRadius || 4,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const DiaryCardSkeleton = () => (
  <View style={styles.cardSkeleton}>
    <Skeleton height={180} borderRadius={20} style={{ marginBottom: 16 }} />
    <View style={{ padding: 16 }}>
       <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={{ marginLeft: 10, flex: 1 }}>
             <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
             <Skeleton width="30%" height={10} />
          </View>
       </View>
       <Skeleton width="90%" height={24} style={{ marginBottom: 8 }} />
       <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
       <Skeleton width="80%" height={14} />
    </View>
  </View>
);

export const EntryCardSkeleton = () => (
  <View style={styles.entrySkeleton}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
       <Skeleton width="30%" height={20} borderRadius={10} />
       <Skeleton width={24} height={24} borderRadius={12} />
    </View>
    <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
    <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
    <Skeleton width="40%" height={16} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  cardSkeleton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  entrySkeleton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  }
});
