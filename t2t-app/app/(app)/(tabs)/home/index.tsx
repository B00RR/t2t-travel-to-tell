import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Platform, Alert, Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CommentsModal } from '@/components/CommentsModal';
import { FeedDiaryCard } from '@/components/FeedDiaryCard';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import { HomeHero } from '@/components/HomeHero';
import { Spacing, Typography, Radius } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

type FeedTab = 'discover' | 'following';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
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
    if (newTab === 'discover') fetchDiscover(false);
    else fetchFollowing(false);
  }

  const diaries = tab === 'discover' ? discoverDiaries : followingDiaries;

  const handleLongPress = useCallback((diaryId: string) => {
    const diary = diaries.find(d => d.id === diaryId);
    Alert.alert(
      diary?.title || 'Diary',
      undefined,
      [
        {
          text: t('social.share') || 'Share',
          onPress: () => {
            Share.share({
              message: `Check out this travel diary: ${diary?.title}`,
              url: `t2tapp://diary/${diaryId}`,
            });
          },
        },
        {
          text: t('social.save') || 'Save',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!user?.id) return;
            const { error } = await supabase.from('saves').insert({ user_id: user.id, diary_id: diaryId });
            if (error) Alert.alert(t('common.error'), t('social.save_failed'));
          },
        },
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      ],
    );
  }, [diaries, t]);

  const renderCard = useCallback(
    ({ item }: { item: FeedDiary }) => (
      <FeedDiaryCard
        item={item}
        userId={user?.id}
        onCommentPress={setSelectedDiaryId}
        onLongPress={handleLongPress}
      />
    ),
    [user?.id, handleLongPress]
  );

  const emptyIcon = tab === 'following' ? 'people-outline' : 'compass-outline';
  const emptyTitle = tab === 'following' ? t('home.no_following') : t('home.no_diaries');
  const emptySub = tab === 'following' ? t('home.no_following_sub') : t('home.no_diaries_sub');

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerLogo, { color: theme.teal }]}>T2T</Text>
        <View style={styles.headerRight}>
          {/* Tab toggle */}
          <View style={[styles.toggle, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                tab === 'discover' && { backgroundColor: theme.teal },
              ]}
              onPress={() => handleTabChange('discover')}
            >
              <Text style={[
                styles.toggleText,
                { color: tab === 'discover' ? '#fff' : theme.textMuted },
              ]}>
                {t('home.discover') || 'Discover'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                tab === 'following' && { backgroundColor: theme.teal },
              ]}
              onPress={() => handleTabChange('following')}
            >
              <Text style={[
                styles.toggleText,
                { color: tab === 'following' ? '#fff' : theme.textMuted },
              ]}>
                {t('home.following') || 'Following'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications */}
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.red }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
        </View>
      ) : errorVisible && diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.red} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            {t('common.error_generic')}
          </Text>
          <Button 
            title={t('common.retry')} 
            onPress={() => tab === 'discover' ? fetchDiscover() : fetchFollowing()} 
            style={{ marginTop: Spacing.md }} 
          />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
            <Ionicons name={emptyIcon} size={36} color={theme.teal} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>{emptyTitle}</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>{emptySub}</Text>
          {tab === 'following' && (
            <Button 
              title={t('home.explore_people')} 
              onPress={() => router.push('/(app)/(tabs)/explore')} 
              variant="primary"
              style={{ marginTop: Spacing.lg }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <HomeHero />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.teal}
              colors={[theme.teal]}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  toggleText: {
    ...Typography.label,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: Radius.full,
  },
  exploreBtnText: {
    color: '#fff',
    ...Typography.label,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  retryBtnText: {
    color: '#fff',
    ...Typography.label,
  },
});
