import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';
import { normalizeProfile } from '@/types/supabase';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FeedDiaryCardProps {
  item: FeedDiary;
  userId?: string;
  onCommentPress?: (id: string) => void;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onLongPress?: (id: string) => void;
  index?: number;
}

function getTripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff) + 1);
}

const SWIPE_THRESHOLD = 80;

/**
 * Terra Evolved — Feed diary card with swipe gestures.
 * Swipe right → like, swipe left → save, long press → context menu.
 * Staggered entry, haptic feedback, terracotta glow border.
 */
const FeedDiaryCardComponent = ({
  item, userId, onCommentPress, onLike, onSave, onLongPress, index = 0,
}: FeedDiaryCardProps) => {
  const theme = useAppTheme();
  const router = useRouter();
  const profile = normalizeProfile(item.profiles);
  const hasCover = !!item.cover_image_url;
  const destinations = item.destinations || [];
  const days = getTripDays(item.start_date, item.end_date);

  // Swipe gesture
  const translateX = useSharedValue(0);
  const swipeActive = useSharedValue(0); // -1 = left (save), 1 = right (like)

  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/diary/${item.id}`);
  };

  const handleAuthorPress = () => {
    if (profile) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/profile/${item.author_id}`);
    }
  };

  const handleLongPressAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress?.(item.id);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      if (e.translationX > SWIPE_THRESHOLD) {
        swipeActive.value = 1;
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        swipeActive.value = -1;
      } else {
        swipeActive.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(() => onLike?.(item.id))();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(() => onSave?.(item.id))();
      }
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      swipeActive.value = 0;
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const likeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1], Extrapolation.CLAMP) }],
  }));

  const saveIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0.5], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={styles.swipeContainer}>
      {/* Like indicator (right) */}
      <Animated.View style={[styles.swipeIndicator, styles.likeIndicator, likeIndicatorStyle]}>
        <Ionicons name="heart" size={28} color={theme.red} />
      </Animated.View>

      {/* Save indicator (left) */}
      <Animated.View style={[styles.swipeIndicator, styles.saveIndicator, saveIndicatorStyle]}>
        <Ionicons name="bookmark" size={28} color={theme.teal} />
      </Animated.View>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <AnimatedPressable
          entering={FadeInUp.delay(index * 80).duration(400)}
          style={[
            styles.card,
            {
              backgroundColor: theme.bgSurface,
              borderColor: theme.tealAlpha15,
            },
            Shadows.card,
            cardStyle,
          ]}
          onPress={handleNavigate}
          onLongPress={handleLongPressAction}
          delayLongPress={500}
        >
          {/* Cover Image */}
          {hasCover ? (
            <View style={styles.coverContainer}>
              <Image source={{ uri: item.cover_image_url! }} style={styles.cover} />
              <View style={styles.coverGradient} />
            </View>
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: theme.bgElevated }]}>
              <Ionicons name="image-outline" size={40} color={theme.textMuted} />
            </View>
          )}

          {/* Duration badge */}
          {days !== null && (
            <View style={[styles.durationBadge, { backgroundColor: 'rgba(250,246,240,0.88)' }]}>
              <Ionicons name="calendar-outline" size={12} color={theme.teal} />
              <Text style={[styles.durationText, { color: theme.textPrimary }]}>{days}d</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Author row */}
            <Pressable style={styles.authorRow} onPress={handleAuthorPress}>
              <View style={[styles.avatar, { backgroundColor: theme.bgElevated, borderColor: theme.tealAlpha15 }]}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={14} color={theme.textMuted} />
                )}
              </View>
              <Text style={[styles.authorName, { color: theme.textSecondary }]} numberOfLines={1}>
                {profile?.display_name || profile?.username || 'Traveler'}
              </Text>
            </Pressable>

            {/* Title */}
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Destinations */}
            {destinations.length > 0 && (
              <View style={styles.destRow}>
                <Ionicons name="location-outline" size={14} color={theme.teal} />
                <Text style={[styles.destText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {destinations.join(' · ')}
                </Text>
              </View>
            )}

            {/* Description */}
            {item.description ? (
              <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            {/* Social stats */}
            <View style={[styles.statsBar, { borderTopColor: theme.border }]}>
              <View style={styles.statGroup}>
                <Ionicons name="heart-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.statNum, { color: theme.textMuted }]}>{item.like_count || 0}</Text>
              </View>
              <Pressable
                style={styles.statGroup}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCommentPress?.(item.id);
                }}
              >
                <Ionicons name="chatbubble-outline" size={15} color={theme.textMuted} />
                <Text style={[styles.statNum, { color: theme.textMuted }]}>{item.comment_count || 0}</Text>
              </Pressable>
              <View style={styles.statGroup}>
                <Ionicons name="eye-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.statNum, { color: theme.textMuted }]}>{item.view_count || 0}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Ionicons name="bookmark-outline" size={16} color={theme.textMuted} />
            </View>
          </View>
        </AnimatedPressable>
      </GestureDetector>
    </View>
  );
};

export const FeedDiaryCard = React.memo(FeedDiaryCardComponent);

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  likeIndicator: {
    right: -50,
  },
  saveIndicator: {
    left: -50,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverContainer: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 220,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  coverPlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(200,90,66,0.15)',
  },
  durationText: {
    fontFamily: Typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorName: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  title: {
    fontFamily: Typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 6,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  destText: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
  },
  description: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.xl,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 12,
  },
});
