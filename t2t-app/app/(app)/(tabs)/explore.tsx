import React, { useState, useEffect, useCallback, useRef } from 'react';
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

export default function DiscoveryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [diaries, setDiaries] = useState<FeedDiary[]>([]);
  const [trendingDiaries, setTrendingDiaries] = useState<FeedDiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchBrowse = useCallback(async (pageNum: number, refresh = false) => {
    if (pageNum === 0) {
      if (refresh) setRefreshing(true);
      else setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

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
      .order('created_at', { ascending: false })
      .range(from, to);

    if (user?.id) {
      // Show public published diaries OR user's own diaries (any status)
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
  }, [t, user?.id]);

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
      .limit(10);

    if (data) setTrendingDiaries(data as FeedDiary[]);
  }, []);

  // Initial load
  useEffect(() => {
    fetchBrowse(0);
    fetchTrending();
  }, [fetchBrowse, fetchTrending]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      // Back to browse mode
      setPage(0);
      setHasMore(true);
      fetchBrowse(0);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchSearch(text);
    }, 300);
  }, [fetchSearch, fetchBrowse]);

  const onRefresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    if (searchQuery.trim()) {
      fetchSearch(searchQuery);
    } else {
      fetchBrowse(0, true);
    }
  }, [searchQuery, fetchSearch, fetchBrowse]);

  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore && !searchQuery.trim()) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBrowse(nextPage);
    }
  }, [loading, loadingMore, hasMore, searchQuery, page, fetchBrowse]);

  const renderItem = useCallback(
    ({ item }: { item: FeedDiary }) => <ExploreDiaryCard item={item} />,
    []
  );

  const ListHeader = useCallback(() => {
    if (searchQuery.trim() || trendingDiaries.length === 0) return null;
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('explore.trending')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
        >
          {trendingDiaries.map(item => (
            <View key={`trending-${item.id}`} style={styles.trendingCardWrapper}>
              <ExploreDiaryCard item={item} />
            </View>
          ))}
        </ScrollView>
        <Text style={styles.sectionTitle}>{t('explore.all_diaries')}</Text>
      </View>
    );
  }, [searchQuery, trendingDiaries, t]);

  const ListFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [loadingMore]);

  const emptyText = searchQuery.trim()
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
          data={diaries}
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
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
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
    paddingBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 10,
  },
  trendingList: {
    paddingHorizontal: 10,
    gap: 10,
  },
  trendingCardWrapper: {
    width: 160,
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
