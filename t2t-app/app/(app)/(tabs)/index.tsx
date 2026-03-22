import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { CommentsModal } from '@/components/CommentsModal';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { ImmersiveStoryCard } from '@/components/ImmersiveStoryCard';
import { StoryProgressBar } from '@/components/StoryProgressBar';
import { Palette, Glass, Motion } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<FeedDiary>
);

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
  const [activeIndex, setActiveIndex] = useState(0);

  // Shared value for scroll-driven animations
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

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
    setActiveIndex(0);
    if (newTab === 'discover') fetchDiscover(false);
    else fetchFollowing(false);
  }

  const diaries = tab === 'discover' ? discoverDiaries : followingDiaries;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderStoryCard = useCallback(
    ({ item, index: idx }: { item: FeedDiary; index: number }) => (
      <ImmersiveStoryCard
        item={item}
        userId={user?.id}
        scrollX={scrollX}
        index={idx}
        onCommentPress={setSelectedDiaryId}
        isActive={idx === activeIndex}
      />
    ),
    [user?.id, activeIndex]
  );

  const emptyIcon = tab === 'following' ? 'people-outline' : 'globe-outline';
  const emptyTitle = tab === 'following' ? t('home.no_following') : t('home.no_diaries');
  const emptySub = tab === 'following' ? t('home.no_following_sub') : t('home.no_diaries_sub');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Story Progress Bar */}
      {diaries.length > 1 && (
        <StoryProgressBar
          count={diaries.length}
          scrollX={scrollX}
          screenWidth={SCREEN_WIDTH}
        />
      )}

      {/* Floating header overlay */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>T2T</Text>
        <View style={styles.headerRight}>
          {/* Tab toggle */}
          <View style={styles.miniToggle}>
            <TouchableOpacity
              style={[styles.miniToggleBtn, tab === 'discover' && styles.miniToggleBtnActive]}
              onPress={() => handleTabChange('discover')}
            >
              <Ionicons
                name="globe-outline"
                size={14}
                color={tab === 'discover' ? '#fff' : 'rgba(255,255,255,0.5)'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.miniToggleBtn, tab === 'following' && styles.miniToggleBtnActive]}
              onPress={() => handleTabChange('following')}
            >
              <Ionicons
                name="people-outline"
                size={14}
                color={tab === 'following' ? '#fff' : 'rgba(255,255,255,0.5)'}
              />
            </TouchableOpacity>
          </View>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingPulse}>
            <Ionicons name="earth" size={48} color={Palette.teal} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        </View>
      ) : errorVisible && diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Palette.red} />
          <Text style={styles.emptyTitle}>{t('common.error_generic')}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => tab === 'discover' ? fetchDiscover() : fetchFollowing()}
          >
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name={emptyIcon} size={44} color={Palette.teal} />
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
        <AnimatedFlatList
          data={diaries}
          keyExtractor={(item) => item.id}
          renderItem={renderStoryCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
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
    backgroundColor: '#000',
  },

  // Floating header (over the full-screen images)
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    zIndex: 20,
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    textShadowColor: 'rgba(0,201,167,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Mini toggle for discover/following
  miniToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 2,
    gap: 2,
  },
  miniToggleBtn: {
    width: 32,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniToggleBtnActive: {
    backgroundColor: Palette.teal,
  },

  // Notification button
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Palette.red,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.bgPrimary,
  },
  loadingPulse: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Palette.bgPrimary,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Palette.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
