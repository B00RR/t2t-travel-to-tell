import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { CommentsModal } from '@/components/CommentsModal';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import { ErrorView } from '@/components/ErrorView';
import { FeedDiaryCard } from '@/components/FeedDiaryCard';
import type { FeedDiary } from '@/types/supabase';

type FeedTab = 'discover' | 'following';

export default function HomeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<FeedTab>('discover');
  const [discoverDiaries, setDiscoverDiaries] = useState<FeedDiary[]>([]);
  const [followingDiaries, setFollowingDiaries] = useState<FeedDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);

  const fetchDiscover = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
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
      setDiscoverDiaries(data as FeedDiary[]);
      setErrorVisible(false);
    } else {
      setErrorVisible(true);
    }
    setLoading(false);
    if (isRefreshing) setRefreshing(false);
  }, []);

  const fetchFollowing = useCallback(async (isRefreshing = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefreshing) setLoading(true);

    // Fetch followed user ids
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (!follows || follows.length === 0) {
      setFollowingDiaries([]);
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
      return;
    }

    const followedIds = follows.map(f => f.following_id as string);

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
      .in('author_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setFollowingDiaries(data as FeedDiary[]);
    }
    setLoading(false);
    if (isRefreshing) setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (tab === 'discover') fetchDiscover(false);
      else fetchFollowing(false);
    }, [tab, fetchDiscover, fetchFollowing])
  );

  function onRefresh() {
    setRefreshing(true);
    if (tab === 'discover') fetchDiscover(true);
    else fetchFollowing(true);
  }

  function handleTabChange(newTab: FeedTab) {
    setTab(newTab);
    setErrorVisible(false);
    if (newTab === 'discover') fetchDiscover(false);
    else fetchFollowing(false);
  }

  const diaries = tab === 'discover' ? discoverDiaries : followingDiaries;

  const renderDiaryCard = useCallback(
    ({ item }: { item: FeedDiary }) => (
      <FeedDiaryCard
        item={item}
        userId={user?.id}
        onCommentPress={setSelectedDiaryId}
      />
    ),
    [user?.id]
  );

  const emptyIcon = tab === 'following' ? 'people-outline' : 'globe-outline';
  const emptyTitle = tab === 'following' ? t('home.no_following') : t('home.no_diaries');
  const emptySub = tab === 'following' ? t('home.no_following_sub') : t('home.no_diaries_sub');

  return (
    <View style={styles.container}>
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

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'discover' && styles.tabBtnActive]}
          onPress={() => handleTabChange('discover')}
        >
          <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>
            {t('home.tab_discover')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'following' && styles.tabBtnActive]}
          onPress={() => handleTabChange('following')}
        >
          <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
            {t('home.tab_following')}
          </Text>
        </TouchableOpacity>
      </View>

      {errorVisible && !refreshing && diaries.length === 0 ? (
        <ErrorView onRetry={tab === 'discover' ? fetchDiscover : fetchFollowing} />
      ) : loading && !refreshing ? (
        <View style={styles.listContent}>
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name={emptyIcon} size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySub}>{emptySub}</Text>
          {tab === 'following' && (
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(app)/(tabs)/explore')}
            >
              <Text style={styles.exploreBtnText}>{t('home.explore_people')}</Text>
            </TouchableOpacity>
          )}
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
    paddingBottom: 12,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  tabBtnActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
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
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 15,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
