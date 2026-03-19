import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { SocialActionBar } from '@/components/SocialActionBar';
import { CommentsModal } from '@/components/CommentsModal';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import { ErrorView } from '@/components/ErrorView';
import type { FeedDiary } from '@/types/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<FeedDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  // Comment modal state
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [])
  );

  async function fetchFeed() {
    if (!refreshing) setLoading(true);

    const { data, error } = await supabase
      .from('diaries')
      .select(`
        *,
        profiles!diaries_author_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setDiaries(data as FeedDiary[]);
      setErrorVisible(false);
    } else {
      setErrorVisible(true);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchFeed();
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

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function renderDiaryCard({ item }: { item: FeedDiary }) {
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
            userId={user?.id}
            initialCounters={{
              like_count: item.like_count || 0,
              comment_count: item.comment_count || 0,
              save_count: item.save_count || 0,
            }}
            onCommentPress={() => setSelectedDiaryId(item.id)}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>T2T</Text>
        <TouchableOpacity 
          style={styles.headerIcon} 
          onPress={() => router.push('/(app)/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {errorVisible && !refreshing && diaries.length === 0 ? (
        <ErrorView onRetry={fetchFeed} />
      ) : loading && !refreshing ? (
        <View style={styles.listContent}>
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="globe-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>{t('home.no_diaries')}</Text>
          <Text style={styles.emptySub}>
            {t('home.no_diaries_sub')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item.id}
          renderItem={renderDiaryCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
        />
      )}

      {/* Modals */}
      <CommentsModal
        visible={!!selectedDiaryId}
        diaryId={selectedDiaryId || ''}
        userId={user?.id}
        onClose={() => setSelectedDiaryId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: -0.5,
  },
  headerIcon: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Card
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

  // Author
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

  // Content
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#999',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 15,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
