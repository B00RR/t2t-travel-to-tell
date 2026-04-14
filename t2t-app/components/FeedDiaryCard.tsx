import React from 'react';
import {
  View, Text, StyleSheet, Image, Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography, Shadows, Fonts } from '@/constants/theme';
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
 * Terra Evolved v2 — Feed diary card redesign.
 * Immersive cover, gradient overlay, premium typography, swipe gestures.
 * Adaptive: respects light/dark system theme.
 */
const FeedDiaryCardComponent = ({
  item, userId, onCommentPress, onLike, onSave, onLongPress, index = 0,
}: FeedDiaryCardProps) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const profile = normalizeProfile(item.profiles);
  const hasCover = !!item.cover_image_url;
  const destinations = item.destinations || [];
  const days = getTripDays(item.start_date, item.end_date);

  // Swipe gesture
  const translateX = useSharedValue(0);

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
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Gradient overlay colors based on theme
  const overlayColors = (theme.isDark
    ? ['rgba(20,18,16,0.0)', 'rgba(20,18,16,0.55)', 'rgba(20,18,16,0.92)']
    : ['rgba(250,246,240,0.0)', 'rgba(250,246,240,0.45)', 'rgba(250,246,240,0.95)']) as [string, string, string];

  return (
    <View style={styles.container}>
      {/* ── Main Card ── */}
      <GestureDetector gesture={panGesture}>
        <AnimatedPressable
          entering={FadeInUp.delay(Math.min(index * 80, 400)).duration(450).springify()}
          style={[
            styles.card,
            {
              backgroundColor: theme.bgElevated,
              borderColor: theme.border,
              ...Shadows.card,
            },
            cardAnimStyle,
          ]}
          onPress={handleNavigate}
          onLongPress={handleLongPressAction}
          delayLongPress={500}
        >
          {/* ── COVER IMAGE ── */}
          <View style={styles.coverWrapper}>
            {hasCover ? (
              <>
                <Image
                  source={{ uri: item.cover_image_url! }}
                  style={styles.cover}
                  resizeMode="cover"
                />
                {/* Gradient overlay */}
                <LinearGradient
                  colors={overlayColors}
                  style={StyleSheet.absoluteFill}
                />
                {/* Duration badge */}
                {days !== null && (
                  <View style={[
                    styles.durationBadge,
                    { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.92)' },
                  ]}>
                    <Ionicons name="calendar-outline" size={11} color={theme.teal} />
                    <Text style={[styles.durationText, { color: theme.textPrimary }]}>
                      {days}{t('common.days_short')}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: theme.tealAlpha10 }]}>
                <Ionicons name="image-outline" size={44} color={theme.textMuted} />
              </View>
            )}
          </View>

          {/* ── CONTENT ── */}
          <View style={styles.content}>
            {/* Author row */}
            <Pressable
              style={styles.authorRow}
              onPress={handleAuthorPress}
              android_ripple={{ color: theme.borderLight }}
            >
              <View style={[
                styles.avatar,
                { backgroundColor: theme.tealAlpha10, borderColor: theme.border },
              ]}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={14} color={theme.textMuted} />
                )}
              </View>
              <Text style={[styles.authorName, { color: theme.textSecondary }]} numberOfLines={1}>
                {profile?.display_name || profile?.username || 'Traveler'}
              </Text>
              <Text style={[styles.authorTime, { color: theme.textMuted }]}>
                {new Date(item.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
              </Text>
            </Pressable>

            {/* Title — Playfair Display */}
            <Text
              style={[styles.title, { color: theme.textPrimary }]}
              numberOfLines={2}
            >
              {item.title || t('common.untitled')}
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

            {/* Social stats bar */}
            <View style={[styles.statsBar, { borderTopColor: theme.border }]}>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={14} color={theme.red} />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.like_count ?? 0}</Text>
              </View>
              <Pressable
                style={styles.statItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCommentPress?.(item.id);
                }}
                android_ripple={{ color: theme.borderLight }}
              >
                <Ionicons name="chatbubble-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.comment_count ?? 0}</Text>
              </Pressable>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.view_count ?? 0}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Ionicons name="bookmark-outline" size={15} color={theme.textMuted} style={{ opacity: 0.6 }} />
            </View>
          </View>
        </AnimatedPressable>
      </GestureDetector>
    </View>
  );
};

export const FeedDiaryCard = React.memo(FeedDiaryCardComponent);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  coverWrapper: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 200,
  },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(200,90,66,0.15)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  durationText: {
    fontFamily: Typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarImg: {
    width: 28,
    height: 28,
  },
  authorName: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  authorTime: {
    fontFamily: Fonts.handwritten,
    fontSize: 13,
  },
  title: {
    fontFamily: Typography.h3.fontFamily, // Playfair Display
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 27,
    marginTop: 10,
    marginBottom: 6,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destText: {
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
  },
  description: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
