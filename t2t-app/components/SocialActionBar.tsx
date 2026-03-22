import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiarySocial } from '@/hooks/useDiarySocial';
import { Palette } from '@/constants/theme';
import type { SocialCounters } from '@/types/social';

interface SocialActionBarProps {
  diaryId: string;
  userId: string | undefined;
  initialCounters?: SocialCounters;
  onCommentPress: () => void;
  onSharePress?: () => void;
}

export function SocialActionBar({ diaryId, userId, initialCounters, onCommentPress, onSharePress }: SocialActionBarProps) {
  const { t } = useTranslation();
  const defaultCounters = { like_count: 0, comment_count: 0, save_count: 0 };
  const { hasLiked, hasSaved, counters, toggleLike, toggleSave } = useDiarySocial({
    diaryId,
    userId,
    initialCounters: initialCounters || defaultCounters,
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={toggleLike}
          accessibilityRole="button"
          accessibilityLabel={hasLiked ? t('social.unlike') : t('social.like')}
        >
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={hasLiked ? Palette.red : Palette.textMuted}
          />
          {counters.like_count > 0 && (
            <Text style={[styles.actionCount, hasLiked && styles.actionCountActive]}>
              {counters.like_count}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onCommentPress}
          accessibilityRole="button"
          accessibilityLabel={t('social.comment_action')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Palette.textMuted} />
          {counters.comment_count > 0 && (
            <Text style={styles.actionCount}>{counters.comment_count}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onSharePress}
          accessibilityRole="button"
          accessibilityLabel={t('social.share')}
        >
          <Ionicons name="share-outline" size={20} color={Palette.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={toggleSave}
        accessibilityRole="button"
        accessibilityLabel={hasSaved ? t('social.unsave') : t('social.save')}
      >
        <Ionicons
          name={hasSaved ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={hasSaved ? Palette.teal : Palette.textMuted}
        />
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
  actionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  actionCountActive: {
    color: Palette.red,
  },
});
