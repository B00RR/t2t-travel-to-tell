import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiarySocial } from '@/hooks/useDiarySocial';
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
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
          <Ionicons 
            name={hasLiked ? 'heart' : 'heart-outline'} 
            size={26} 
            color={hasLiked ? '#FF3B30' : '#4a4a4a'} 
            accessibilityLabel={t('social.like')}
          />
          <Text style={styles.actionText}>{counters.like_count > 0 ? counters.like_count : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={24} color="#4a4a4a" />
          <Text style={styles.actionText}>{counters.comment_count > 0 ? counters.comment_count : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onSharePress}>
          <Ionicons name="share-outline" size={24} color="#4a4a4a" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={toggleSave}>
        <Ionicons 
          name={hasSaved ? 'bookmark' : 'bookmark-outline'} 
          size={24} 
          color={hasSaved ? '#007AFF' : '#4a4a4a'} 
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a4a4a',
  },
});
