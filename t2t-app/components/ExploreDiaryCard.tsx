import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Typography, Shadows } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

interface ExploreDiaryCardProps {
  item: FeedDiary;
}

const ExploreDiaryCardComponent = ({ item }: ExploreDiaryCardProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const likeCount = item.like_count ?? 0;
  const firstDest = item.destinations?.[0] ?? null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.bgSurface, borderColor: theme.border },
        Shadows.card,
      ]}
      activeOpacity={0.88}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {/* Cover image */}
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.bgElevated }]}>
          <Ionicons name="image-outline" size={30} color={theme.textMuted} />
        </View>
      )}

      {/* Destination badge (top-left) */}
      {firstDest && (
        <View style={[styles.destBadge, { backgroundColor: theme.bgSurface }]}>
          <Text style={[styles.destBadgeText, { color: theme.textPrimary }]} numberOfLines={1}>
            {firstDest}
          </Text>
        </View>
      )}

      {/* Like count (top-right) */}
      {likeCount > 0 && (
        <View style={[styles.likeBadge, { backgroundColor: theme.bgSurface }]}>
          <Ionicons name="heart" size={9} color={theme.red} />
          <Text style={[styles.likeBadgeText, { color: theme.textPrimary }]}>{likeCount}</Text>
        </View>
      )}

      {/* Bottom content */}
      <View style={[styles.content, { backgroundColor: theme.bgSurface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.author, { color: theme.teal }]} numberOfLines={1}>
          {item.profiles?.display_name || item.profiles?.username || t('common.anonymous')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const ExploreDiaryCard = React.memo(ExploreDiaryCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: Radius.sm,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: 140,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },

  destBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: Radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: '75%',
  },
  destBadgeText: {
    ...Typography.micro,
  },

  likeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  likeBadgeText: {
    ...Typography.micro,
  },

  content: {
    padding: 10,
  },
  title: {
    ...Typography.caption,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 3,
  },
  author: {
    fontSize: 11,
    fontWeight: '600',
  },
});
