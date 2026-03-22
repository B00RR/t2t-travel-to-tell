import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Palette, Glass } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

interface ExploreDiaryCardProps {
  item: FeedDiary;
}

const ExploreDiaryCardComponent = ({ item }: ExploreDiaryCardProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const likeCount = item.like_count ?? 0;
  const firstDest = item.destinations?.[0] ?? null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {/* Cover image */}
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="earth-outline" size={30} color={Palette.gray700} />
        </View>
      )}

      {/* Bottom gradient overlay */}
      <View style={styles.overlay} pointerEvents="none" />
      <View style={styles.overlayDeep} pointerEvents="none" />

      {/* Destination badge (top-left) */}
      {firstDest && (
        <View style={styles.destBadge}>
          <Text style={styles.destBadgeText} numberOfLines={1}>📍 {firstDest}</Text>
        </View>
      )}

      {/* Like count (top-right) */}
      {likeCount > 0 && (
        <View style={styles.likeBadge}>
          <Ionicons name="heart" size={9} color={Palette.red} />
          <Text style={styles.likeBadgeText}>{likeCount}</Text>
        </View>
      )}

      {/* Bottom content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author} numberOfLines={1}>
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
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: Palette.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.bgElevated,
  },

  // Gradient scrims
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: 'rgba(9,9,15,0.55)',
  },
  overlayDeep: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(9,9,15,0.4)',
  },

  // Destination glass pill (top-left)
  destBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: Glass.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.border,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: '75%',
  },
  destBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Like count glass pill (top-right)
  likeBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Glass.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.border,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  likeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Text content at the bottom
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingBottom: 12,
  },
  title: {
    color: Palette.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 17,
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  author: {
    color: Palette.teal,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
