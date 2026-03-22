import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Animated,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { CommentsModal } from '@/components/CommentsModal';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import { ErrorView } from '@/components/ErrorView';
import { FeedDiaryCard } from '@/components/FeedDiaryCard';
import { Palette, Motion } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

type FeedTab = 'discover' | 'following';

// Width of each tab pill text area — used to slide the indicator
const TAB_PILL_WIDTH = 100;

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

  // Animated sliding pill indicator
  const pillX = useRef(new Animated.Value(0)).current;

  function animatePillTo(tabIndex: number) {
    Animated.spring(pillX, {
      toValue: tabIndex * TAB_PILL_WIDTH,
      ...Motion.spring.snappy,
    }).start();
  }

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

    if (!error && data) setFollowingDiaries(data as FeedDiary[]);
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
    animatePillTo(newTab === 'discover' ? 0 : 1);
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
      <StatusBar barStyle="light-content" backgroundColor={Palette.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>T2T</Text>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/(app)/notifications')}
        >
          <Ionicons name="notifications-outline" size={21} color={Palette.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── ANIMATED SLIDING PILL TAB SELECTOR ── */}
      <View style={styles.tabRow}>
        {/* Sliding background pill */}
        <Animated.View
          style={[
            styles.tabPillBg,
            { transform: [{ translateX: pillX }], pointerEvents: 'none' },
          ]}
        />

        <TouchableOpacity
          style={[styles.tabItem, { width: TAB_PILL_WIDTH }]}
          onPress={() => handleTabChange('discover')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>
            {t('home.tab_discover')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, { width: TAB_PILL_WIDTH }]}
          onPress={() => handleTabChange('following')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
            {t('home.tab_following')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {errorVisible && !refreshing && diaries.length === 0 ? (
        <ErrorView onRetry={tab === 'discover' ? fetchDiscover : fetchFollowing} />
      ) : loading && !refreshing ? (
        <View style={styles.listContent}>
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name={emptyIcon} size={34} color={Palette.teal} />
          </View>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.teal}
              colors={[Palette.teal]}
            />
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
    backgroundColor: Palette.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerLogo: {
    fontSize: 32,
    fontWeight: '900',
    color: Palette.teal,
    letterSpacing: -2,
    // Subtle teal glow on the logo
    textShadowColor: 'rgba(0,201,167,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Palette.red,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Palette.bgPrimary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },

  // ── ANIMATED TAB SELECTOR ──
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Palette.bgSurface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    padding: 3,
    position: 'relative',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  // The sliding highlight pill
  tabPillBg: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: TAB_PILL_WIDTH,
    bottom: 3,
    backgroundColor: Palette.teal,
    borderRadius: 18,
  },
  tabItem: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textMuted,
    letterSpacing: -0.1,
  },
  tabTextActive: {
    color: Palette.bgPrimary,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120, // extra space for floating tab bar
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.bgSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: Palette.teal,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 28,
  },
  exploreBtnText: {
    color: Palette.bgPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
