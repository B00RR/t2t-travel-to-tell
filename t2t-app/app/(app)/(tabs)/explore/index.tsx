import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ExploreDiaryCard } from '@/components/ExploreDiaryCard';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import { WanderlustMap } from '@/components/WanderlustMap';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';
import type { SortMode, DurationFilter } from '@/components/explore/SortBar';
import { ListHeader } from '@/components/explore/ListHeader';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
import { AdvancedFiltersModal, FilterBadge, matchesAdvancedFilters, type AdvancedFilters } from '@/components/explore/AdvancedFilters';

type ExploreMode = 'browse' | 'map';

const PAGE_SIZE = 20;

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
  if (days === null) return false;
  if (filter === 'short') return days <= 4;
  if (filter === 'medium') return days >= 5 && days <= 14;
  if (filter === 'long') return days >= 15;
  return true;
}

export default function DiscoveryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useAppTheme();
  const [exploreMode, setExploreMode] = useState<ExploreMode>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({ budget: 'all', tripType: 'all', season: 'all' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
    if (sort === 'trending') return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSortChange = useCallback((mode: SortMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    ({ item, index }: { item: FeedDiary; index: number }) => (
      <ExploreDiaryCard item={item} index={index} />
    ),
    []
  );

  const displayDiaries = useMemo(() => {
    const filtered = (sortMode === 'trending'
      ? trendingDiaries.filter(d => matchesDuration(d, durationFilter))
      : diaries.filter(d => matchesDuration(d, durationFilter))
    ).filter(d => matchesAdvancedFilters(d, advancedFilters));
    return filtered;
  }, [sortMode, durationFilter, trendingDiaries, diaries, advancedFilters]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const isSearchMode = searchQuery.trim().length > 0;

  const handleDurationChange = useCallback((filter: DurationFilter) => {
    setDurationFilter(filter);
  }, []);

  const ListFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.teal} />
      </View>
    );
  }, [loadingMore, theme]);

  const emptyText = isSearchMode
    ? t('explore.no_results', { query: searchQuery })
    : t('explore.empty_browse');

  if (exploreMode === 'map') {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.mapHeader, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('explore.wanderlust_map')}</Text>
          <TouchableOpacity
            style={[styles.modeToggleBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
            onPress={() => setExploreMode('browse')}
          >
            <Ionicons name="grid-outline" size={18} color={theme.teal} />
          </TouchableOpacity>
        </View>
        <WanderlustMap />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('explore.title')}</Text>
          <TouchableOpacity
            style={[styles.modeToggleBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
            onPress={() => setExploreMode('map')}
          >
            <Ionicons name="globe-outline" size={18} color={theme.teal} />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchContainer, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={t('explore.search_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowAdvancedFilters(true)}
          >
            <Ionicons name="options-outline" size={20} color={theme.textMuted} />
            <FilterBadge
              count={[
                advancedFilters.budget !== 'all',
                advancedFilters.tripType !== 'all',
                advancedFilters.season !== 'all',
              ].filter(Boolean).length}
              theme={theme}
              onPress={() => setShowAdvancedFilters(true)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <AdvancedFiltersModal
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
      />

      {loading && !refreshing ? (
        <View style={styles.listContent}>
          <View style={styles.columnWrapper}>
            <View style={{ width: '48%' }}><DiaryCardSkeleton /></View>
            <View style={{ width: '48%' }}><DiaryCardSkeleton /></View>
          </View>
          <View style={styles.columnWrapper}>
            <View style={{ width: '48%' }}><DiaryCardSkeleton /></View>
            <View style={{ width: '48%' }}><DiaryCardSkeleton /></View>
          </View>
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
          ListHeaderComponent={
            <ListHeader
              isSearchMode={isSearchMode}
              sortMode={sortMode}
              durationFilter={durationFilter}
              userId={user?.id}
              onSortChange={handleSortChange}
              onDurationChange={handleDurationChange}
            />
          }
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.teal} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyContainer}>
                <EmptyStateIllustration
                  type="no-results"
                  title={emptyText}
                  accent={t('explore.no_results_accent', 'Keep exploring...')}
                />
              </View>
            )
          }
        />
      )}
    </View>
  );
}

function createStyles(t: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 56 : 40,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    mapHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 56 : 40,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      zIndex: 2,
    },
    modeToggleBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    headerTitle: {
      ...Typography.h1,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.sm,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
    },
    searchIcon: {
      marginRight: 8,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
      borderLeftWidth: 1,
      borderLeftColor: t.border,
      marginLeft: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    listContent: {
      padding: 10,
      paddingBottom: 100,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      marginTop: 16,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });
}
