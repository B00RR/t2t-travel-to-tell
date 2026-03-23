import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

interface FeedDiaryCardProps {
  item: FeedDiary;
  userId?: string;
  onCommentPress?: (id: string) => void;
}

function getTripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff) + 1);
}

/**
 * Terra — Vertical feed diary card.
 * Clean card with cover image, author info, title, destinations, and social stats.
 */
const FeedDiaryCardComponent = ({ item, userId, onCommentPress }: FeedDiaryCardProps) => {
  const theme = useAppTheme();
  const router = useRouter();
  const profile = item.profiles;
  const hasCover = !!item.cover_image_url;
  const destinations = item.destinations || [];
  const days = getTripDays(item.start_date, item.end_date);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.bgSurface,
          borderColor: theme.border,
        },
        Shadows.card,
      ]}
      onPress={() => router.push(`/diary/${item.id}`)}
      activeOpacity={0.92}
    >
      {/* Cover Image */}
      {hasCover ? (
        <Image source={{ uri: item.cover_image_url! }} style={styles.cover} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: theme.bgElevated }]}>
          <Ionicons name="image-outline" size={40} color={theme.textMuted} />
        </View>
      )}

      {/* Duration badge on cover */}
      {days !== null && (
        <View style={[styles.durationBadge, { backgroundColor: theme.bgSurface }]}>
          <Ionicons name="calendar-outline" size={12} color={theme.teal} />
          <Text style={[styles.durationText, { color: theme.textPrimary }]}>
            {days}d
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Author row */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => profile && router.push(`/profile/${item.author_id}`)}
        >
          <View style={[styles.avatar, { backgroundColor: theme.bgElevated }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={14} color={theme.textMuted} />
            )}
          </View>
          <Text style={[styles.authorName, { color: theme.textSecondary }]} numberOfLines={1}>
            {profile?.display_name || profile?.username || 'Traveler'}
          </Text>
        </TouchableOpacity>

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

        {/* Description preview */}
        {item.description ? (
          <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Social stats bar */}
        <View style={[styles.statsBar, { borderTopColor: theme.border }]}>
          <View style={styles.statGroup}>
            <Ionicons name="heart-outline" size={16} color={theme.textMuted} />
            <Text style={[styles.statNum, { color: theme.textMuted }]}>{item.like_count || 0}</Text>
          </View>
          <TouchableOpacity
            style={styles.statGroup}
            onPress={() => onCommentPress?.(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={15} color={theme.textMuted} />
            <Text style={[styles.statNum, { color: theme.textMuted }]}>{item.comment_count || 0}</Text>
          </TouchableOpacity>
          <View style={styles.statGroup}>
            <Ionicons name="eye-outline" size={16} color={theme.textMuted} />
            <Text style={[styles.statNum, { color: theme.textMuted }]}>{item.view_count || 0}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Ionicons name="bookmark-outline" size={16} color={theme.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const FeedDiaryCard = React.memo(FeedDiaryCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 200,
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
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  durationText: {
    ...Typography.label,
  },
  content: {
    padding: Spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  authorName: {
    ...Typography.caption,
    flex: 1,
  },
  title: {
    ...Typography.h3,
    marginBottom: 6,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  destText: {
    ...Typography.caption,
    flex: 1,
  },
  description: {
    ...Typography.body,
    marginBottom: 4,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm + 4,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.lg,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    ...Typography.caption,
  },
});
