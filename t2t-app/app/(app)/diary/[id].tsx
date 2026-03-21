import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import { SocialActionBar } from '@/components/SocialActionBar';
import { CommentsModal } from '@/components/CommentsModal';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { Diary } from '@/types/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

type DiaryDay = {
  id: string;
  day_number: number;
  sort_order: number;
  title: string | null;
  date: string | null;
};

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [days, setDays] = useState<DiaryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { user } = useAuth();

  // Social UI state
  const [showComments, setShowComments] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [reorderDaysMode, setReorderDaysMode] = useState(false);

  // Follow logic (Mocking target profile ID as diary.author_id)
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(user?.id, diary?.author_id);

  const fetchDiaryDetails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setDiary(data);
    }
  }, [id]);

  const fetchDiaryDays = useCallback(async () => {
    setLoading(true); // Se vogliamo mostrare il loader anche durante il reload dei giorni
    const { data, error } = await supabase
      .from('diary_days')
      .select('id, day_number, title, date, sort_order')
      .eq('diary_id', id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setDays(data);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchDiaryDetails();
        fetchDiaryDays();
      }
    }, [id, fetchDiaryDetails, fetchDiaryDays])
  );

  async function moveDay(dayId: string, direction: 'up' | 'down') {
    const idx = days.findIndex(d => d.id === dayId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= days.length) return;
    const current = days[idx];
    const target = days[swapIdx];
    const updated = [...days];
    updated[idx] = { ...current, sort_order: target.sort_order };
    updated[swapIdx] = { ...target, sort_order: current.sort_order };
    setDays(updated.sort((a, b) => a.sort_order - b.sort_order));
    await Promise.all([
      supabase.from('diary_days').update({ sort_order: target.sort_order }).eq('id', current.id),
      supabase.from('diary_days').update({ sort_order: current.sort_order }).eq('id', target.id),
    ]);
  }

  function handleOptions() {
    Alert.alert(
      t('diary.options'),
      t('diary.what_to_do'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('diary.delete_diary'), style: 'destructive', onPress: confirmDelete },
      ]
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
    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id);

    if (error) {
      Alert.alert(t('common.error'), t('diary.err_delete_failed'));
    } else {
      router.replace('/');
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editIcon} onPress={handleOptions}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover Image */}
        <TouchableOpacity
          style={styles.coverContainer}
          onPress={() => user?.id === diary.author_id && setShowCoverPicker(true)}
          activeOpacity={user?.id === diary.author_id ? 0.8 : 1}
        >
          {diary.cover_image_url ? (
            <Image source={{ uri: diary.cover_image_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
              {user?.id === diary.author_id && (
                <Text style={styles.coverPlaceholderText}>{t('cover.add_cover')}</Text>
              )}
            </View>
          )}
          {user?.id === diary.author_id && diary.cover_image_url && (
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.titleRow, styles.contentPadding]}>
          <Text style={styles.title}>{diary.title}</Text>
          {user?.id !== diary.author_id && (
            <TouchableOpacity 
              style={[styles.followBtn, isFollowing && styles.followingBtn]} 
              onPress={toggleFollow}
              disabled={followLoading}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? t('profile.following_button') : t('profile.follow')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {diary.destinations && diary.destinations.length > 0 && (
          <View style={[styles.pillContainer, styles.contentPadding]}>
            {diary.destinations.map((dest, idx) => (
              <View key={idx} style={styles.pill}>
                <Text style={styles.pillText}>📍 {dest}</Text>
              </View>
            ))}
          </View>
        )}

        {diary.description ? (
          <Text style={[styles.description, styles.contentPadding]}>{diary.description}</Text>
        ) : null}

        <View style={[styles.divider, styles.contentPadding]} />

        <View style={[styles.daysHeader, styles.contentPadding]}>
          <Text style={styles.sectionTitle}>{t('diary.days')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {user?.id === diary.author_id && days.length > 1 && (
              <TouchableOpacity
                style={[styles.reorderToggleBtn, reorderDaysMode && styles.reorderToggleBtnActive]}
                onPress={() => setReorderDaysMode(r => !r)}
              >
                <Ionicons
                  name={reorderDaysMode ? 'checkmark' : 'reorder-three-outline'}
                  size={18}
                  color={reorderDaysMode ? '#fff' : '#007AFF'}
                />
              </TouchableOpacity>
            )}
            {!reorderDaysMode && (
              <TouchableOpacity
                style={styles.addDayButton}
                onPress={() => router.push({ pathname: '/diary/add-day', params: { diary_id: id } })}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addDayText}>{t('diary.add')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {days.length === 0 ? (
          <View style={[styles.emptyDays, styles.contentPadding]}>
            <Text style={styles.emptyDaysText}>{t('diary.no_days')}</Text>
            <Text style={styles.emptyDaysSub}>{t('diary.start_adding')}</Text>
          </View>
        ) : (
          <View style={[styles.daysList, styles.contentPadding]}>
            {days.map((day, idx) => (
              <View key={day.id} style={styles.dayRow}>
                <TouchableOpacity
                  style={[styles.dayCard, { flex: 1 }]}
                  onPress={() => !reorderDaysMode && router.push({ pathname: '/diary/day/[day_id]', params: { day_id: day.id, diary_id: id } })}
                  activeOpacity={reorderDaysMode ? 1 : 0.7}
                >
                  <View style={styles.dayIconBox}>
                    <Text style={styles.dayIconText}>{day.day_number}</Text>
                  </View>
                  <View style={styles.dayContent}>
                    <Text style={styles.dayTitle}>{t('diary.day_label', { number: day.day_number })}{day.title ? `: ${day.title}` : ''}</Text>
                    {day.date && <Text style={styles.dayDate}>{day.date}</Text>}
                  </View>
                  {!reorderDaysMode && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
                </TouchableOpacity>
                {reorderDaysMode && (
                  <View style={styles.reorderBtns}>
                    <TouchableOpacity
                      style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
                      onPress={() => idx > 0 && moveDay(day.id, 'up')}
                      disabled={idx === 0}
                    >
                      <Ionicons name="chevron-up" size={20} color={idx === 0 ? '#ccc' : '#007AFF'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reorderBtn, idx === days.length - 1 && styles.reorderBtnDisabled]}
                      onPress={() => idx < days.length - 1 && moveDay(day.id, 'down')}
                      disabled={idx === days.length - 1}
                    >
                      <Ionicons name="chevron-down" size={20} color={idx === days.length - 1 ? '#ccc' : '#007AFF'} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Sticky Social Actions */}
      <SocialActionBar
        diaryId={id as string}
        userId={user?.id}
        initialCounters={{
          like_count: diary.like_count || 0,
          comment_count: diary.comment_count || 0,
          save_count: diary.save_count || 0,
        }}
        onCommentPress={() => setShowComments(true)}
      />

      <CommentsModal
        visible={showComments}
        diaryId={id as string}
        userId={user?.id}
        onClose={() => setShowComments(false)}
      />

      <CoverImagePicker
        visible={showCoverPicker}
        diaryId={id as string}
        userId={user?.id}
        destinations={diary.destinations || []}
        onCoverSet={(url) => setDiary(prev => prev ? { ...prev, cover_image_url: url } : prev)}
        onClose={() => setShowCoverPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backIcon: {
    padding: 8,
  },
  editIcon: {
    padding: 8,
  },
  content: {
    paddingBottom: 24,
  },
  coverContainer: {
    width: SCREEN_WIDTH,
    height: 200,
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  contentPadding: {
    paddingHorizontal: 24,
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginRight: 10,
  },
  followBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  followingBtnText: {
    color: '#666',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDayText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyDays: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyDaysText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDaysSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  daysList: {
    marginTop: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
  },
  reorderToggleBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
  },
  reorderToggleBtnActive: {
    backgroundColor: '#34C759', borderColor: '#34C759',
  },
  reorderBtns: { gap: 4 },
  reorderBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center',
  },
  reorderBtnDisabled: { backgroundColor: '#f9f9f9' },
  dayIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  dayContent: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
  },
});
