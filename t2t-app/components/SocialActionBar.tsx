import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDiarySocial } from '@/hooks/useDiarySocial';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography } from '@/constants/theme';
import type { SocialCounters } from '@/types/social';

interface SocialActionBarProps {
  diaryId: string;
  userId: string | undefined;
  initialCounters?: SocialCounters;
  onCommentPress: () => void;
  onSharePress?: () => void;
}

/**
 * Terra Evolved — Social action bar with spring bounce animations.
 * Heart bounces on like, bookmark pulses on save, haptic feedback everywhere.
 */
function AnimatedHeart({ active, size, colors }: { active: boolean; size: number; colors: { red: string; muted: string } }) {
  const scale = useSharedValue(1);
  const prevActive = useRef(active);

  useEffect(() => {
    if (active && !prevActive.current) {
      scale.value = withSequence(
        withSpring(1.5, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
    prevActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? colors.red : colors.muted}
      />
    </Animated.View>
  );
}

function AnimatedBookmark({ active, size, colors }: { active: boolean; size: number; colors: { teal: string; muted: string } }) {
  const scale = useSharedValue(1);
  const prevActive = useRef(active);

  useEffect(() => {
    if (active && !prevActive.current) {
      scale.value = withSequence(
        withSpring(1.4, { damping: 5, stiffness: 250 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
    prevActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={active ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={active ? colors.teal : colors.muted}
      />
    </Animated.View>
  );
}

export function SocialActionBar({
  diaryId, userId, initialCounters, onCommentPress, onSharePress,
}: SocialActionBarProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { hasLiked, hasSaved, counters, toggleLike, toggleSave } = useDiarySocial({
    diaryId,
    userId,
    initialCounters: initialCounters ?? { like_count: 0, comment_count: 0, save_count: 0 },
  });

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleLike();
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        {/* Like */}
        <Pressable
          style={styles.actionBtn}
          onPress={handleLike}
          accessibilityRole="button"
          accessibilityLabel={hasLiked ? t('social.unlike') : t('social.like')}
        >
          <AnimatedHeart active={hasLiked} size={22} colors={{ red: theme.red, muted: theme.textMuted }} />
          {counters.like_count > 0 && (
            <Text style={[styles.count, { color: hasLiked ? theme.red : theme.textMuted }]}>
              {counters.like_count}
            </Text>
          )}
        </Pressable>

        {/* Comment */}
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCommentPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('social.comment_action')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
          {counters.comment_count > 0 && (
            <Text style={[styles.count, { color: theme.textMuted }]}>{counters.comment_count}</Text>
          )}
        </Pressable>

        {/* Share */}
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSharePress?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('social.share')}
        >
          <Ionicons name="share-outline" size={20} color={theme.textMuted} />
        </Pressable>
      </View>

      {/* Save */}
      <Pressable
        style={styles.actionBtn}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityLabel={hasSaved ? t('social.unsave') : t('social.save')}
      >
        <AnimatedBookmark active={hasSaved} size={20} colors={{ teal: theme.teal, muted: theme.textMuted }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  count: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
  },
});
