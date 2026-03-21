import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDiaryCard } from '@/components/ProfileDiaryCard';
import { TripPlanCard } from '@/components/TripPlanCard';
import type { Diary } from '@/types/supabase';
import type { TripPlan } from '@/types/tripPlan';

type Tab = 'diaries' | 'plans';

export default function PublicProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(id);
  const { isFollowing, toggleFollow } = useFollow(currentUser?.id, id);

  const [activeTab, setActiveTab] = useState<Tab>('diaries');
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const fetchPublicDiaries = useCallback(async () => {
    setLoadingDiaries(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('author_id', id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (!error && data) setDiaries(data);
    setLoadingDiaries(false);
  }, [id]);

  const fetchPublicPlans = useCallback(async () => {
    setLoadingPlans(true);
    const { data, error } = await supabase
      .from('trip_plans')
      .select('*')
      .eq('author_id', id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (!error && data) setPlans(data as TripPlan[]);
    setLoadingPlans(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      Promise.all([fetchPublicDiaries(), fetchPublicPlans()]);
    }
  }, [id, fetchPublicDiaries, fetchPublicPlans]);

  const renderDiaryCard = useCallback(
    ({ item }: { item: Diary }) => <ProfileDiaryCard item={item} />,
    []
  );

  const renderPlanCard = useCallback(
    ({ item }: { item: TripPlan }) => (
      <TripPlanCard item={item} userId={currentUser?.id} />
    ),
    [currentUser?.id]
  );

  const isLoading = activeTab === 'diaries' ? loadingDiaries : loadingPlans;
  const activeData = useMemo(
    () => (activeTab === 'diaries' ? diaries : plans) as (Diary | TripPlan)[],
    [activeTab, diaries, plans]
  );

  if (profileLoading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile?.display_name || profile?.username || t('profile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'diaries'
          ? renderDiaryCard as any
          : renderPlanCard as any
        }
        ListHeaderComponent={
          <View>
            <ProfileHeader
              profile={profile}
              diaryCount={diaries.length}
              isOwnProfile={currentUser?.id === id}
              isFollowing={isFollowing}
              onFollowToggle={toggleFollow}
            />

            {/* Tab bar */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'diaries' && styles.tabBtnActive]}
                onPress={() => setActiveTab('diaries')}
              >
                <Ionicons
                  name="journal-outline"
                  size={16}
                  color={activeTab === 'diaries' ? '#007AFF' : '#999'}
                />
                <Text style={[styles.tabBtnText, activeTab === 'diaries' && styles.tabBtnTextActive]}>
                  {t('profile.my_diaries')} {diaries.length > 0 ? `(${diaries.length})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'plans' && styles.tabBtnActive]}
                onPress={() => setActiveTab('plans')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={activeTab === 'plans' ? '#007AFF' : '#999'}
                />
                <Text style={[styles.tabBtnText, activeTab === 'plans' && styles.tabBtnTextActive]}>
                  {t('planner.tab')} {plans.length > 0 ? `(${plans.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons
                name={activeTab === 'diaries' ? 'journal-outline' : 'map-outline'}
                size={48}
                color="#ccc"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'diaries'
                  ? t('profile.no_public_diaries')
                  : t('planner.empty_discover')}
              </Text>
            </View>
          ) : (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  backBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  tabBtnActive: { backgroundColor: '#e8f0fe' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#999' },
  tabBtnTextActive: { color: '#007AFF' },
  listContent: { paddingBottom: 40, paddingHorizontal: 16 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#999', fontSize: 15, textAlign: 'center' },
});
