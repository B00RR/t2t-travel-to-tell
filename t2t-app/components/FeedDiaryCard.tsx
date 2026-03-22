import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SocialActionBar } from '@/components/SocialActionBar';
import { Palette } from '@/constants/theme';
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

const FeedDiaryCardComponent = ({ item, userId, onCommentPress }: FeedDiaryCardProps) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const author = item.profiles;
  const authorName = author?.display_name || author?.username || t('common.anonymous');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {/* Cover — full bleed with gradient overlay */}
      {item.cover_image_url ? (
        <ImageBackground
          source={{ uri: item.cover_image_url }}
          style={styles.coverImage}
          imageStyle={styles.coverImageStyle}
        >
          <View style={styles.coverGradient}>
            {/* Destination pills on cover */}
            {item.destinations && item.destinations.length > 0 && (
              <View style={styles.destRow}>
                {item.destinations.slice(0, 2).map((dest, idx) => (
                  <View key={idx} style={styles.destPill}>
                    <Text style={styles.destPillText}>📍 {dest}</Text>
                  </View>
                ))}
                {item.destinations.length > 2 && (
                  <View style={styles.destPill}>
                    <Text style={styles.destPillText}>+{item.destinations.length - 2}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="earth-outline" size={36} color={Palette.textMuted} />
          {item.destinations && item.destinations.length > 0 && (
            <View style={styles.destRowFlat}>
              {item.destinations.slice(0, 2).map((dest, idx) => (
                <View key={idx} style={styles.destPillDark}>
                  <Text style={styles.destPillText}>📍 {dest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Card body */}
      <View style={styles.cardBody}>
        {/* Author row */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => router.push(`/profile/${item.author_id}`)}
          activeOpacity={0.75}
        >
          {author?.avatar_url ? (
            <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(authorName)}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Palette.textMuted} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        {/* Description */}
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Social Actions */}
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
  );
};

export const FeedDiaryCard = React.memo(FeedDiaryCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.bgSurface,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  coverImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  coverImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  coverGradient: {
    width: '100%',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 60,
    backgroundColor: 'rgba(9,9,15,0.0)',
  },
  destRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  destRowFlat: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  destPill: {
    backgroundColor: 'rgba(9,9,15,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  destPillDark: {
    backgroundColor: Palette.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  destPillText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: Palette.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
  cardBody: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: Palette.bgPrimary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: -0.3,
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  dateText: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: 8,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
    marginTop: 12,
    marginHorizontal: -16,
  },
});
