import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';
import { normalizeProfile } from '@/types/supabase';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ExploreDiaryCardProps {
  item: FeedDiary;
  index?: number;
}

const ExploreDiaryCardComponent = ({ item, index = 0 }: ExploreDiaryCardProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const likeCount = item.like_count ?? 0;
  const firstDest = item.destinations?.[0] ?? null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/diary/${item.id}`);
  };

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 60).duration(350)}
      style={[
        styles.card,
        { backgroundColor: theme.bgSurface, borderColor: theme.tealAlpha10 },
        Shadows.card,
      ]}
      onPress={handlePress}
    >
      {/* Cover image */}
      {item.cover_image_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.cover_image_url }} style={styles.image} />
          <View style={styles.imageOverlay} />
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.bgElevated }]}>
          <Ionicons name="image-outline" size={30} color={theme.textMuted} />
        </View>
      )}

      {/* Destination badge (top-left) */}
      {firstDest && (
        <View style={[styles.destBadge, { backgroundColor: 'rgba(250,246,240,0.90)' }]}>
          <Ionicons name="location" size={10} color={theme.teal} />
          <Text style={[styles.destBadgeText, { color: theme.textPrimary }]} numberOfLines={1}>
            {firstDest}
          </Text>
        </View>
      )}

      {/* Like count (top-right) */}
      {likeCount > 0 && (
        <View style={[styles.likeBadge, { backgroundColor: 'rgba(250,246,240,0.90)' }]}>
          <Ionicons name="heart" size={10} color={theme.red} />
          <Text style={[styles.likeBadgeText, { color: theme.textPrimary }]}>{likeCount}</Text>
        </View>
      )}

      {/* Bottom content */}
      <View style={[styles.content, { backgroundColor: theme.bgSurface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.author, { color: theme.teal }]} numberOfLines={1}>
          {(normalizeProfile(item.profiles))?.display_name || (normalizeProfile(item.profiles))?.username || t('common.anonymous')}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export const ExploreDiaryCard = React.memo(ExploreDiaryCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '75%',
  },
  destBadgeText: {
    fontFamily: Typography.micro.fontFamily,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  likeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeBadgeText: {
    fontFamily: Typography.micro.fontFamily,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  title: {
    fontFamily: Typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  author: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
});
