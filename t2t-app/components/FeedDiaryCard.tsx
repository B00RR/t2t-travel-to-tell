import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SocialActionBar } from '@/components/SocialActionBar';
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
      activeOpacity={0.9}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {/* Cover Image */}
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      )}

      {/* Content */}
      <View style={styles.cardBody}>
        {/* Author Row */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => router.push(`/profile/${item.author_id}`)}
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
        </TouchableOpacity>

        {/* Title & Destinations */}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        {item.destinations && item.destinations.length > 0 && (
          <View style={styles.destinationRow}>
            {item.destinations.slice(0, 3).map((dest, idx) => (
              <View key={idx} style={styles.destPill}>
                <Text style={styles.destPillText}>📍 {dest}</Text>
              </View>
            ))}
            {item.destinations.length > 3 && (
              <Text style={styles.moreText}>+{item.destinations.length - 3}</Text>
            )}
          </View>
        )}

        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}

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
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 26,
  },
  destinationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  destPill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  destPillText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
});
