import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, Share,
  Modal, TextInput, FlatList, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import { useDiaryCollaborators } from '@/hooks/useDiaryCollaborators';
import { useDiaryPermissions } from '@/hooks/useDiaryPermissions';
import { SocialActionBar } from '@/components/SocialActionBar';
import { CommentsModal } from '@/components/CommentsModal';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { DayChapter } from '@/components/DayChapter';
import { DoubleTapLike } from '@/components/DoubleTapLike';
import { JourneyProgressBar } from '@/components/JourneyProgressBar';
import { CollaboratorAvatarStack } from '@/components/CollaboratorAvatarStack';
import { Diary } from '@/types/supabase';
import { Palette, Glass } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DiaryDay = {
  id: string;
  day_number: number;
  sort_order: number;
  title: string | null;
  date: string | null;
};

/**
 * Cinematic Journey Player — diary detail as chapter-by-chapter experience.
 * Horizontal swipe between days, progress bar at top, full-screen hero images.
 */
export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [days, setDays] = useState<DiaryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const { t } = useTranslation();
  const { user } = useAuth();

  // Social UI state
  const [showComments, setShowComments] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(user?.id, diary?.author_id);

  // Collaborative diary data + permissions
  const permissions = useDiaryPermissions(typeof id === 'string' ? id : undefined);
  const { collaborators, leaveCollaboration } = useDiaryCollaborators(
    typeof id === 'string' ? id : undefined,
  );
  const hasCollaborators = collaborators.length > 0;
  const isOwner = permissions.role === 'owner';
  const isCollaborator = permissions.role === 'collaborator';
  const canAddDay = permissions.canAddDays;

  const flatListRef = useRef<FlatList>(null);

  // Increment view count once per mount (ref guards against React strict-mode double effect)
  // NOTE: To eliminate cross-user race conditions entirely, create a Supabase RPC:
  //   create or replace function increment_view_count(diary_id uuid)
  //   returns void as $$ update diaries set view_count = coalesce(view_count,0) + 1 where id = diary_id; $$ language sql;
  const viewCountedRef = useRef(false);
  useEffect(() => {
    if (diary && !viewCountedRef.current && user?.id !== diary.author_id) {
      viewCountedRef.current = true;
      (async () => {
        const { error } = await supabase.rpc('increment_view_count', { diary_id: diary.id });
        if (error) {
          // Fallback if RPC doesn't exist yet — best-effort increment
          await supabase
            .from('diaries')
            .update({ view_count: (diary.view_count || 0) + 1 })
            .eq('id', diary.id);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diary?.id, user?.id]);

  const fetchDiaryDetails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) setDiary(data);
  }, [id]);

  const fetchDiaryDays = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diary_days')
      .select('id, day_number, title, date, sort_order')
      .eq('diary_id', id)
      .order('sort_order', { ascending: true });
    if (!error && data) setDays(data);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) Promise.all([fetchDiaryDetails(), fetchDiaryDays()]);
    }, [id, fetchDiaryDetails, fetchDiaryDays])
  );

  async function handleShare() {
    if (!diary) return;
    const deepLink = Linking.createURL(`diary/${diary.id}`);
    const destinations = diary.destinations?.join(', ') || '';
    const message = [
      `📖 ${diary.title}`,
      destinations ? `📍 ${destinations}` : null,
      diary.description ? `\n${diary.description}` : null,
      `\n🔗 ${deepLink}`,
      `\n🌍 T2T — Travel to Tell`,
    ].filter(Boolean).join('\n');
    try { await Share.share({ message, title: diary.title }); } catch {}
  }

  function handleOptions() {
    const buttons: Parameters<typeof Alert.alert>[2] = [
      { text: t('common.cancel'), style: 'cancel' },
    ];

    if (isOwner) {
      buttons.push({
        text: t('diary.edit_diary'),
        onPress: () =>
          router.push({ pathname: '/diary/edit/[id]' as any, params: { id: id as string } }),
      });
      buttons.push({
        text: t('collab.manage'),
        onPress: () =>
          router.push({ pathname: '/diary/collaborators' as any, params: { id: id as string } }),
      });
      buttons.push({
        text: t('diary.delete_diary'),
        style: 'destructive',
        onPress: confirmDelete,
      });
    } else if (isCollaborator) {
      buttons.push({
        text: t('collab.leave'),
        style: 'destructive',
        onPress: confirmLeave,
      });
    }

    Alert.alert(t('diary.options'), t('diary.what_to_do'), buttons);
  }

  function confirmLeave() {
    Alert.alert(
      t('collab.leave_confirm_title'),
      t('collab.leave_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('collab.leave'),
          style: 'destructive',
          onPress: async () => {
            const ok = await leaveCollaboration();
            if (ok) router.replace('/(app)/(tabs)/home' as never);
            else toast.show({ message: t('collab.invite_error'), type: 'error' });
          },
        },
      ],
    );
  }

  function confirmDelete() {
    Alert.alert(
      t('diary.confirm_delete_title'),
      t('diary.confirm_delete_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('diary.delete_permanently'), style: 'destructive', onPress: deleteDiary },
      ]
    );
  }

  async function deleteDiary() {
    const { error } = await supabase.from('diaries').delete().eq('id', id);
    if (error) toast.show({ message: t('diary.err_delete_failed'), type: 'error' });
    else router.replace('/(app)/(tabs)/home' as never);
  }

  const handleDayJump = useCallback((index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: SCREEN_WIDTH * index,
      animated: true,
    });
    setCurrentDayIndex(index);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentDayIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // Header opacity animation (fades in on scroll/stop)
  const headerOpacity = useSharedValue(1);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Cinematic entrance
  const contentScale = useSharedValue(0.96);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentScale.value = withSpring(1, { damping: 20, stiffness: 90 });
    contentOpacity.value = withTiming(1, { duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentEntranceStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.teal} />
      </View>
    );
  }

  if (!diary) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('diary.not_found')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('diary.go_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If diary has no days yet, show add-day prompt
  if (days.length === 0) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.floatingHeader, headerStyle, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.floatingTitleWrap}>
            <Text style={styles.floatingTitle} numberOfLines={1}>{diary.title}</Text>
            {hasCollaborators && (
              <View style={styles.floatingAvatarStack}>
                <CollaboratorAvatarStack
                  collaborators={collaborators}
                  size={20}
                  onPress={
                    isOwner
                      ? () => router.push({ pathname: '/diary/collaborators' as any, params: { id: id as string } })
                      : undefined
                  }
                />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={handleOptions}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.emptyDaysContainer}>
          <Ionicons name="book-outline" size={56} color={Palette.tealDim} />
          <Text style={styles.emptyDaysTitle}>{diary.title}</Text>
          {diary.description && (
            <Text style={styles.emptyDaysDesc}>{diary.description}</Text>
          )}
          <Text style={styles.emptyDaysHint}>{t('diary.no_days')}</Text>

          {canAddDay && (
            <TouchableOpacity
              style={styles.addDayBtn}
              onPress={() => router.push({ pathname: '/diary/add-day', params: { diary_id: id } })}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addDayBtnText}>{t('diary.add')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <SocialActionBar
          diaryId={id as string}
          userId={user?.id}
          initialCounters={{
            like_count: diary.like_count || 0,
            comment_count: diary.comment_count || 0,
            save_count: diary.save_count || 0,
          }}
          onCommentPress={() => setShowComments(true)}
          onSharePress={handleShare}
        />

        <CommentsModal
          visible={showComments}
          diaryId={id as string}
          userId={user?.id}
          onClose={() => setShowComments(false)}
        />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, contentEntranceStyle]}>
      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, headerStyle]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.floatingTitleWrap}>
          <Text style={styles.floatingTitle} numberOfLines={1}>{diary.title}</Text>
          {hasCollaborators && (
            <View style={styles.floatingAvatarStack}>
              <CollaboratorAvatarStack
                collaborators={collaborators}
                size={20}
                onPress={
                  isOwner
                    ? () => router.push({ pathname: '/diary/collaborators' as any, params: { id: id as string } })
                    : undefined
                }
              />
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {user?.id !== diary.author_id && !isCollaborator && (
            <TouchableOpacity
              style={[styles.miniFollowBtn, isFollowing && styles.miniFollowBtnActive]}
              onPress={toggleFollow}
              disabled={followLoading}
            >
              <Text style={styles.miniFollowText}>
                {isFollowing ? t('profile.following_button') : t('profile.follow')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerBtn} onPress={handleOptions}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Journey progress bar */}
      <View style={styles.progressBarWrap}>
        <JourneyProgressBar
          totalDays={days.length}
          currentDay={currentDayIndex}
          onDayPress={handleDayJump}
        />
      </View>

      {/* Horizontal day chapters */}
      <DoubleTapLike onDoubleTap={() => {
        // Double-tap triggers like via SocialActionBar hook
      }}>
      <FlatList
        ref={flatListRef}
        data={days}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <DayChapter
            dayId={item.id}
            dayNumber={item.day_number}
            dayTitle={item.title}
            dayDate={item.date}
            diaryId={id as string}
            isActive={index === currentDayIndex}
            showAuthor={hasCollaborators}
          />
        )}
      />
      </DoubleTapLike>

      {/* Floating social bar */}
      <View style={styles.floatingSocial}>
        <SocialActionBar
          diaryId={id as string}
          userId={user?.id}
          initialCounters={{
            like_count: diary.like_count || 0,
            comment_count: diary.comment_count || 0,
            save_count: diary.save_count || 0,
          }}
          onCommentPress={() => setShowComments(true)}
          onSharePress={handleShare}
        />
      </View>

      {/* Add day button for owner or accepted collaborator */}
      {canAddDay && (
        <TouchableOpacity
          style={styles.floatingAddDay}
          onPress={() => router.push({ pathname: '/diary/add-day', params: { diary_id: id } })}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      <CommentsModal
        visible={showComments}
        diaryId={id as string}
        userId={user?.id}
        onClose={() => setShowComments(false)}
      />

      <CoverImagePicker
        visible={showCoverPicker}
        itemId={id as string}
        userId={user?.id}
        destinations={diary.destinations || []}
        onCoverSet={(url) => setDiary(prev => prev ? { ...prev, cover_image_url: url } : prev)}
        onClose={() => setShowCoverPicker(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.bgPrimary,
  },
  errorText: {
    fontSize: 18,
    color: Palette.textPrimary,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Palette.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Floating header (over content) — glassmorphism
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Glass.storyBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Glass.storyBorder,
    zIndex: 20,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  floatingTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  floatingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  floatingAvatarStack: {
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniFollowBtn: {
    backgroundColor: Palette.teal,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  miniFollowBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  miniFollowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress bar wrap
  progressBarWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 96 : 80,
    left: 0,
    right: 0,
    zIndex: 15,
  },

  // Floating social bar — glassmorphism
  floatingSocial: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    backgroundColor: Glass.storyBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.storyBorder,
    zIndex: 10,
  },

  // Floating add day button
  floatingAddDay: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },

  // Empty days
  emptyDaysContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Palette.bgPrimary,
    gap: 12,
  },
  emptyDaysTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  emptyDaysDesc: {
    fontSize: 15,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyDaysHint: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.teal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 6,
  },
  addDayBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
