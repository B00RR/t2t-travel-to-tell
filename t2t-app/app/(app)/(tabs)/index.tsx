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
import { FeedDiaryCard } from '@/components/FeedDiaryCard';
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

  const renderDiaryCard = useCallback(
    ({ item }: { item: FeedDiary }) => {
      return (
        <FeedDiaryCard
          item={item}
          userId={user?.id}
          onCommentPress={setSelectedDiaryId}
        />
      );
    },
    [user?.id]
  );

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
