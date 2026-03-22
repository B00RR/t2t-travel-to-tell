import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiarySocial } from '@/hooks/useDiarySocial';
import { Palette, Motion } from '@/constants/theme';
import type { SocialCounters } from '@/types/social';

interface SocialActionBarProps {
  diaryId: string;
  userId: string | undefined;
  initialCounters?: SocialCounters;
  onCommentPress: () => void;
  onSharePress?: () => void;
}

/** A heart icon that bounces + glows on activation */
function AnimatedHeart({ active, size }: { active: boolean; size: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevActive = useRef(active);

  useEffect(() => {
    if (active && !prevActive.current) {
      // Bouncy scale-up when liked
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, ...Motion.spring.bouncy }),
        Animated.spring(scale, { toValue: 1,   ...Motion.spring.snappy }),
      ]).start();
    }
    prevActive.current = active;
  }, [active, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? Palette.red : Palette.textMuted}
      />
    </Animated.View>
  );
}

export function SocialActionBar({
  diaryId, userId, initialCounters, onCommentPress, onSharePress,
}: SocialActionBarProps) {
  const { t } = useTranslation();
  const { hasLiked, hasSaved, counters, toggleLike, toggleSave } = useDiarySocial({
    diaryId,
    userId,
    initialCounters: initialCounters ?? { like_count: 0, comment_count: 0, save_count: 0 },
  });

  // Save bookmark press scale
  const saveScale = useRef(new Animated.Value(1)).current;

  function handleSavePress() {
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.35, ...Motion.spring.bouncy }),
      Animated.spring(saveScale, { toValue: 1,    ...Motion.spring.snappy }),
    ]).start();
    toggleSave();
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        {/* Like */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={toggleLike}
          accessibilityRole="button"
          accessibilityLabel={hasLiked ? t('social.unlike') : t('social.like')}
        >
          <AnimatedHeart active={hasLiked} size={22} />
          {counters.like_count > 0 && (
            <Text style={[styles.count, hasLiked && styles.countLiked]}>
              {counters.like_count}
            </Text>
          )}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onCommentPress}
          accessibilityRole="button"
          accessibilityLabel={t('social.comment_action')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Palette.textMuted} />
          {counters.comment_count > 0 && (
            <Text style={styles.count}>{counters.comment_count}</Text>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onSharePress}
          accessibilityRole="button"
          accessibilityLabel={t('social.share')}
        >
          <Ionicons name="share-outline" size={20} color={Palette.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Save — with bounce animation */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={handleSavePress}
        accessibilityRole="button"
        accessibilityLabel={hasSaved ? t('social.unsave') : t('social.save')}
      >
        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
          <Ionicons
            name={hasSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={hasSaved ? Palette.teal : Palette.textMuted}
          />
        </Animated.View>
      </TouchableOpacity>
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
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  countLiked: {
    color: Palette.red,
  },
});
