import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, StatusBar, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  type SharedValue,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { KenBurnsImage } from '@/components/KenBurnsImage';
import { AnimatedHeartOverlay } from '@/components/AnimatedHeartOverlay';
import { useDiarySocial } from '@/hooks/useDiarySocial';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Glass } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';
import { normalizeProfile } from '@/types/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_PANEL_HEIGHT = 200;

interface ImmersiveStoryCardProps {
  item: FeedDiary;
  userId: string | undefined;
  scrollX: SharedValue<number>;
  index: number;
  onCommentPress: (id: string) => void;
  isActive: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getTripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff) + 1);
}

export const ImmersiveStoryCard = React.memo(function ImmersiveStoryCard({
  item, userId, scrollX, index, onCommentPress, isActive,
}: ImmersiveStoryCardProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const panelY = useSharedValue(0);
  const lastTapTime = useRef(0);

  const { hasLiked, hasSaved, counters, toggleLike, toggleSave } = useDiarySocial({
    diaryId: item.id,
    userId,
    initialCounters: {
      like_count: item.like_count || 0,
      comment_count: item.comment_count || 0,
      save_count: item.save_count || 0,
    },
  });

  const author = normalizeProfile(item.profiles);
  const authorName = author?.display_name || author?.username || t('common.anonymous');
  const days = getTripDays(item.start_date, item.end_date);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  // Parallax effect based on horizontal scroll position
  const parallaxStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-30, 0, 30],
      'clamp',
    );
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [1.1, 1, 1.1],
      'clamp',
    );
    return {
      transform: [{ translateX }, { scale }],
    };
  });

  // Title fade-in when card becomes active
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);

  useEffect(() => {
    if (isActive) {
      titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 120 });
    } else {
      titleOpacity.value = withTiming(0.6, { duration: 300 });
      titleTranslateY.value = 20;
    }
  }, [isActive]);

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  // Expanded panel animation
  const panelAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelY.value }],
  }));

  const handleToggleExpand = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    panelY.value = withSpring(newExpanded ? -BOTTOM_PANEL_HEIGHT : 0, {
      damping: 18,
      stiffness: 150,
    });
  }, [expanded]);

  // Double-tap to like
  const handleDoubleTap = useCallback(() => {
    if (!hasLiked) {
      toggleLike();
    }
    setShowHeart(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [hasLiked, toggleLike]);

  // Memoize gesture objects to avoid recreating on every render
  const composedGesture = useMemo(() => {
    const swipe = Gesture.Pan()
      .onEnd((e) => {
        if (e.translationY < -50) {
          runOnJS(handleToggleExpand)();
        } else if (e.translationY > 50 && expanded) {
          runOnJS(handleToggleExpand)();
        }
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        runOnJS(handleDoubleTap)();
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        runOnJS(() => router.push(`/diary/${item.id}`))();
      });

    return Gesture.Simultaneous(Gesture.Exclusive(doubleTap, singleTap), swipe);
  }, [handleToggleExpand, handleDoubleTap, expanded, router, item.id]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.inner}>
          {/* Full-bleed background image with Ken Burns */}
          <Animated.View style={[styles.imageContainer, parallaxStyle]}>
            {item.cover_image_url ? (
              <KenBurnsImage
                uri={item.cover_image_url}
                style={styles.fullImage}
                paused={!isActive}
              />
            ) : (
              <View style={[styles.placeholderBg, { backgroundColor: theme.bgElevated }]}>
                <Ionicons name="earth" size={80} color={theme.tealDim} />
              </View>
            )}
          </Animated.View>

          {/* Top scrim gradient */}
          <View style={[styles.scrimTop, { backgroundColor: theme.storyScrimTop }]} pointerEvents="none" />

          {/* Bottom scrim gradient */}
          <View style={styles.scrimBottom} pointerEvents="none" />

          {/* Top bar: author pill */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.authorPill}
              onPress={() => router.push(`/profile/${item.author_id}`)}
              activeOpacity={0.8}
            >
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={styles.pillAvatar} />
              ) : (
                <View style={[styles.pillAvatarFallback, { backgroundColor: theme.teal }]}>
                  <Text style={styles.pillInitials}>{getInitials(authorName)}</Text>
                </View>
              )}
              <Text style={styles.pillName} numberOfLines={1}>{authorName}</Text>
            </TouchableOpacity>

            {days !== null && (
              <View style={styles.daysBadge}>
                <Text style={[styles.daysNum, { color: theme.teal }]}>{days}</Text>
                <Text style={[styles.daysLabel, { color: theme.teal }]}>{t('common.days')}</Text>
              </View>
            )}
          </View>

          {/* Bottom content overlay */}
          <Animated.View style={[styles.bottomContent, titleAnimStyle]}>
            {/* Destination pills */}
            {item.destinations && item.destinations.length > 0 && (
              <View style={styles.destRow}>
                {item.destinations.slice(0, 3).map((dest, idx) => (
                  <View key={idx} style={styles.destPill}>
                    <Ionicons name="location" size={10} color={theme.teal} />
                    <Text style={styles.destText}>{dest}</Text>
                  </View>
                ))}
                {item.destinations.length > 3 && (
                  <View style={styles.destPill}>
                    <Text style={styles.destText}>+{item.destinations.length - 3}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Title */}
            <Text style={styles.title} numberOfLines={3}>{item.title}</Text>

            {/* Date & meta */}
            <Text style={styles.dateLine}>{formatDate(item.created_at)}</Text>
          </Animated.View>

          {/* Right-side floating social actions */}
          <View style={styles.socialColumn}>
            <TouchableOpacity style={styles.socialBtn} onPress={toggleLike}>
              <Ionicons
                name={hasLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={hasLiked ? theme.red : '#fff'}
              />
              {counters.like_count > 0 && (
                <Text style={styles.socialCount}>{counters.like_count}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} onPress={() => onCommentPress(item.id)}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              {counters.comment_count > 0 && (
                <Text style={styles.socialCount}>{counters.comment_count}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} onPress={toggleSave}>
              <Ionicons
                name={hasSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={hasSaved ? theme.teal : '#fff'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => router.push(`/diary/${item.id}`)}
            >
              <Ionicons name="arrow-forward-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Swipe up hint */}
          <View style={styles.swipeHint} pointerEvents="none">
            <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.swipeHintText}>{t('home.swipe_details')}</Text>
          </View>

          {/* Expanded detail panel */}
          <Animated.View style={[styles.expandPanel, panelAnimStyle]}>
            <View style={styles.expandHandle} />
            {item.description && (
              <Text style={styles.expandDesc} numberOfLines={4}>{item.description}</Text>
            )}
            {item.view_count !== null && item.view_count !== undefined && item.view_count > 0 && (
              <View style={styles.expandMeta}>
                <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.expandMetaText}>
                  {item.view_count.toLocaleString()} {t('common.views')}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Double-tap heart overlay */}
          <AnimatedHeartOverlay
            visible={showHeart}
            onFinish={() => setShowHeart(false)}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
  },

  // Full-bleed image
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  fullImage: {
    width: SCREEN_WIDTH + 60,
    height: SCREEN_HEIGHT,
    marginLeft: -30,
  },
  placeholderBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scrims
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: 'transparent',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 65 : 45,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Glass.storyBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.storyBorder,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '65%',
  },
  pillAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pillAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  pillName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  daysBadge: {
    alignItems: 'center',
    backgroundColor: Glass.bgTeal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.borderTeal,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  daysNum: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  daysLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Bottom content
  bottomContent: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120,
    left: 20,
    right: 80,
    zIndex: 5,
  },
  destRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  destPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  destText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  dateLine: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },

  // Right-side social column
  socialColumn: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 160 : 140,
    alignItems: 'center',
    gap: 20,
    zIndex: 5,
  },
  socialBtn: {
    alignItems: 'center',
    gap: 4,
  },
  socialCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
    zIndex: 2,
  },
  swipeHintText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Expanded panel
  expandPanel: {
    position: 'absolute',
    bottom: -BOTTOM_PANEL_HEIGHT,
    left: 0,
    right: 0,
    height: BOTTOM_PANEL_HEIGHT,
    backgroundColor: Glass.storyBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 6,
  },
  expandHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  expandDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    letterSpacing: -0.1,
    marginBottom: 12,
  },
  expandMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandMetaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});
