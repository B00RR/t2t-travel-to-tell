import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ImageBackground, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SocialActionBar } from '@/components/SocialActionBar';
import { Palette, Glass, Motion } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

interface FeedDiaryCardProps {
  item: FeedDiary;
  userId: string | undefined;
  onCommentPress: (id: string) => void;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getTripDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff) + 1);
}

const FeedDiaryCardComponent = ({ item, userId, onCommentPress }: FeedDiaryCardProps) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const pressAnim = useRef(new Animated.Value(1)).current;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  const author = item.profiles;
  const authorName = author?.display_name || author?.username || t('common.anonymous');
  const days = getTripDays(item.start_date, item.end_date);
  const viewCount = item.view_count ?? 0;

  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.97, ...Motion.spring.snappy }).start();

  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, ...Motion.spring.normal }).start();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => router.push(`/diary/${item.id}`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* ── CINEMATIC COVER ── */}
        {item.cover_image_url ? (
          <ImageBackground
            source={{ uri: item.cover_image_url }}
            style={styles.cover}
            imageStyle={styles.coverImg}
          >
            {/* Bottom scrim — gives title its cinema stage */}
            <View style={styles.scrimBottom} pointerEvents="none" />
            <View style={styles.scrimBottomDeep} pointerEvents="none" />

            {/* Top row: author glass pill + days badge */}
            <View style={styles.coverTop}>
              <TouchableOpacity
                style={styles.authorPill}
                onPress={() => router.push(`/profile/${item.author_id}`)}
                activeOpacity={0.8}
              >
                {author?.avatar_url ? (
                  <Image source={{ uri: author.avatar_url }} style={styles.pillAvatar} />
                ) : (
                  <View style={styles.pillAvatarFallback}>
                    <Text style={styles.pillInitials}>{getInitials(authorName)}</Text>
                  </View>
                )}
                <Text style={styles.pillName} numberOfLines={1}>{authorName}</Text>
              </TouchableOpacity>

              {days !== null && (
                <View style={styles.daysBadge}>
                  <Text style={styles.daysNum}>{days}</Text>
                  <Text style={styles.daysLabel}>days</Text>
                </View>
              )}
            </View>

            {/* Bottom overlay: destinations + big title */}
            <View style={styles.coverBottom}>
              {item.destinations && item.destinations.length > 0 && (
                <View style={styles.destRow}>
                  {item.destinations.slice(0, 2).map((dest, idx) => (
                    <View key={idx} style={styles.destPill}>
                      <Text style={styles.destText}>📍 {dest}</Text>
                    </View>
                  ))}
                  {item.destinations.length > 2 && (
                    <View style={styles.destPill}>
                      <Text style={styles.destText}>+{item.destinations.length - 2}</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.coverTitle} numberOfLines={2}>{item.title}</Text>
            </View>
          </ImageBackground>
        ) : (
          /* ── PLACEHOLDER COVER (no image) ── */
          <View style={styles.coverPlaceholder}>
            <Ionicons name="earth-outline" size={44} color={Palette.gray700} />
            {item.destinations && item.destinations.length > 0 && (
              <Text style={styles.placeholderDest}>📍 {item.destinations[0]}</Text>
            )}
            <Text style={styles.placeholderTitle} numberOfLines={2}>{item.title}</Text>
          </View>
        )}

        {/* ── MINIMAL CARD BODY ── */}
        <View style={styles.body}>
          {/* Meta: date + view count */}
          <View style={styles.metaRow}>
            <Text style={styles.metaDate}>{formatDate(item.created_at)}</Text>
            {viewCount > 0 && (
              <View style={styles.viewsChip}>
                <Ionicons name="eye-outline" size={11} color={Palette.textMuted} />
                <Text style={styles.viewsText}>{viewCount.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={styles.divider} />

          <SocialActionBar
            diaryId={item.id}
            userId={userId}
            initialCounters={{
              like_count: item.like_count || 0,
              comment_count: item.comment_count || 0,
              save_count: item.save_count || 0,
            }}
            onCommentPress={() => onCommentPress(item.id)}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const FeedDiaryCard = React.memo(FeedDiaryCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.bgSurface,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 10,
  },

  // Cover: full-bleed cinematic hero
  cover: {
    width: '100%',
    height: 290,
    justifyContent: 'space-between',
  },
  coverImg: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Gradient simulation: two layered scrims at the bottom
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(9,9,15,0.55)',
  },
  scrimBottomDeep: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(9,9,15,0.45)',
  },

  // Top row inside cover
  coverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Glass.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '65%',
  },
  pillAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillInitials: {
    color: Palette.bgPrimary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pillName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },

  daysBadge: {
    alignItems: 'center',
    backgroundColor: Glass.bgTeal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.borderTeal,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  daysNum: {
    color: Palette.teal,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 17,
    letterSpacing: -0.5,
  },
  daysLabel: {
    color: Palette.teal,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Bottom content inside cover
  coverBottom: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  destRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  destPill: {
    backgroundColor: 'rgba(9,9,15,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  destText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Placeholder cover (no image)
  coverPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Palette.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    gap: 10,
    paddingHorizontal: 24,
  },
  placeholderDest: {
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '600',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textSecondary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  // Minimal card body
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaDate: {
    fontSize: 12,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  viewsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
    marginTop: 12,
    marginHorizontal: -16,
  },
});
