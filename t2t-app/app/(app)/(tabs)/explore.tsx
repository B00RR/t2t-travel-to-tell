import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { ExploreDiaryCard } from '@/components/ExploreDiaryCard';
import type { FeedDiary } from '@/types/supabase';

const PAGE_SIZE = 20;

type SortMode = 'recent' | 'popular' | 'trending';
type DurationFilter = 'all' | 'short' | 'medium' | 'long';

function getDurationDays(diary: FeedDiary): number | null {
  if (!diary.start_date || !diary.end_date) return null;
  const start = new Date(diary.start_date);
  const end = new Date(diary.end_date);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff) + 1);
}

function matchesDuration(diary: FeedDiary, filter: DurationFilter): boolean {
  if (filter === 'all') return true;
  const days = getDurationDays(diary);
  if (days === null) return filter === 'all';
  if (filter === 'short') return days <= 4;
  if (filter === 'medium') return days >= 5 && days <= 14;
  if (filter === 'long') return days >= 15;
  return true;
}

export default function DiscoveryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [diaries, setDiaries] = useState<FeedDiary[]>([]);
  const [trendingDiaries, setTrendingDiaries] = useState<FeedDiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchBrowse = useCallback(async (pageNum: number, refresh = false, sort: SortMode = sortMode) => {
    if (sort === 'trending') {
      // Trending uses its own dataset, no pagination needed
      return;
    }

    if (pageNum === 0) {
      if (refresh) setRefreshing(true);
      else setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const orderColumn = sort === 'popular' ? 'like_count' : 'created_at';

    let query = supabase
      .from('diaries')
      .select(`
        *,
        profiles!diaries_author_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .order(orderColumn, { ascending: false })
      .range(from, to);

    if (user?.id) {
      query = query.or(`and(status.eq.published,visibility.eq.public),author_id.eq.${user.id}`);
    } else {
      query = query.eq('status', 'published').eq('visibility', 'public');
    }

    const { data, error } = await query;

    if (error) {
      Alert.alert(t('common.error'), t('explore.error_fetch'));
    } else if (data) {
      setDiaries(prev => pageNum === 0 ? data as FeedDiary[] : [...prev, ...data as FeedDiary[]]);
      setHasMore(data.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [t, user?.id, sortMode]);

  const fetchSearch = useCallback(async (query: string) => {
    setLoading(true);
    setHasMore(false);

    let searchQ = supabase
      .rpc('search_diaries', { search_query: query.trim() })
      .order('created_at', { ascending: false })
      .limit(50);

    if (user?.id) {
      searchQ = searchQ.or(`and(status.eq.published,visibility.eq.public),author_id.eq.${user.id}`);
    } else {
      searchQ = searchQ.eq('status', 'published').eq('visibility', 'public');
    }

    const { data: rpcData, error: rpcError } = await searchQ;

    if (rpcError || !rpcData || rpcData.length === 0) {
      if (!rpcError) setDiaries([]);
      setLoading(false);
      return;
    }

    const authorIds: string[] = [...new Set<string>(rpcData.map((d: any) => d.author_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', authorIds);

    const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
    const merged: FeedDiary[] = rpcData.map((diary: any) => ({
      ...diary,
      profiles: profileMap.get(diary.author_id) ?? { username: null, display_name: null, avatar_url: null },
    }));

    setDiaries(merged);
    setLoading(false);
  }, [user?.id]);

  const fetchTrending = useCallback(async () => {
    const { data } = await supabase
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
      .order('like_count', { ascending: false })
      .limit(20);

    if (data) setTrendingDiaries(data as FeedDiary[]);
  }, []);

  useEffect(() => {
    Promise.all([fetchBrowse(0, false, sortMode), fetchTrending()]);
  }, []);

  const handleSortChange = useCallback((mode: SortMode) => {
    setSortMode(mode);
    setPage(0);
    setDurationFilter('all');
    if (mode === 'trending') {
      setDiaries([]);
      setHasMore(false);
    } else {
      setHasMore(true);
      fetchBrowse(0, false, mode);
    }
  }, [fetchBrowse]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setPage(0);
      setHasMore(sortMode !== 'trending');
      if (sortMode !== 'trending') fetchBrowse(0);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchSearch(text);
    }, 300);
  }, [fetchSearch, fetchBrowse, sortMode]);

  const onRefresh = useCallback(() => {
    setPage(0);
    setHasMore(sortMode !== 'trending');
    if (searchQuery.trim()) {
      fetchSearch(searchQuery);
    } else if (sortMode === 'trending') {
      fetchTrending();
      setRefreshing(false);
    } else {
      fetchBrowse(0, true, sortMode);
    }
  }, [searchQuery, fetchSearch, fetchBrowse, fetchTrending, sortMode]);

  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore && !searchQuery.trim() && sortMode !== 'trending') {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBrowse(nextPage, false, sortMode);
    }
  }, [loading, loadingMore, hasMore, searchQuery, page, fetchBrowse, sortMode]);

  const renderItem = useCallback(
    ({ item }: { item: FeedDiary }) => <ExploreDiaryCard item={item} />,
    []
  );

  const displayDiaries = useMemo(() =>
    sortMode === 'trending'
      ? trendingDiaries.filter(d => matchesDuration(d, durationFilter))
      : diaries.filter(d => matchesDuration(d, durationFilter)),
    [sortMode, durationFilter, trendingDiaries, diaries]
  );

  const isSearchMode = searchQuery.trim().length > 0;

  const SortBar = useCallback(() => {
    if (isSearchMode) return null;
    const sorts: { key: SortMode; label: string; icon: string }[] = [
      { key: 'recent', label: t('explore.sort_recent'), icon: 'time-outline' },
      { key: 'popular', label: t('explore.sort_popular'), icon: 'heart-outline' },
      { key: 'trending', label: t('explore.sort_trending'), icon: 'flame-outline' },
    ];
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortBar}
        >
          {sorts.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortChip, sortMode === s.key && styles.sortChipActive]}
              onPress={() => handleSortChange(s.key)}
            >
              <Ionicons
                name={s.icon as any}
                size={15}
                color={sortMode === s.key ? '#fff' : '#555'}
              />
              <Text style={[styles.sortChipText, sortMode === s.key && styles.sortChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.durationBar}
        >
          {(['all', 'short', 'medium', 'long'] as DurationFilter[]).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.durationChip, durationFilter === d && styles.durationChipActive]}
              onPress={() => setDurationFilter(d)}
            >
              <Text style={[styles.durationChipText, durationFilter === d && styles.durationChipTextActive]}>
                {t(`explore.duration_${d}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [isSearchMode, sortMode, durationFilter, t, handleSortChange]);

  const ListHeader = useCallback(() => {
    if (isSearchMode) return null;
    return (
      <View>
        <SortBar />
        {sortMode === 'recent' && (
          <Text style={styles.sectionTitle}>{t('explore.all_diaries')}</Text>
        )}
        {sortMode === 'popular' && (
          <Text style={styles.sectionTitle}>{t('explore.sort_popular')}</Text>
        )}
        {sortMode === 'trending' && (
          <Text style={styles.sectionTitle}>{t('explore.sort_trending')}</Text>
        )}
      </View>
    );
  }, [isSearchMode, sortMode, t, SortBar]);

  const ListFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [loadingMore]);

  const emptyText = isSearchMode
    ? t('explore.no_results', { query: searchQuery })
    : t('explore.empty_browse');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('explore.title')}</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('explore.search_placeholder')}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={displayDiaries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sortBar: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  durationBar: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  durationChipActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#007AFF',
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  durationChipTextActive: {
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
  listContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
