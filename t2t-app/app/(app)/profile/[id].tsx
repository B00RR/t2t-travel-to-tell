import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDiaryCard } from '@/components/ProfileDiaryCard';
import type { Diary } from '@/types/supabase';

export default function PublicProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(id);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(currentUser?.id, id);
  
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPublicDiaries();
    }
  }, [id]);

  async function fetchPublicDiaries() {
    setLoadingDiaries(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('author_id', id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDiaries(data);
    }
    setLoadingDiaries(false);
  }

  const renderDiaryCard = useCallback(
    ({ item }: { item: Diary }) => <ProfileDiaryCard item={item} />,
    []
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
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={diaries}
        keyExtractor={(item) => item.id}
        renderItem={renderDiaryCard}
        ListHeaderComponent={
          <ProfileHeader
            profile={profile}
            diaryCount={diaries.length}
            isOwnProfile={currentUser?.id === id}
            isFollowing={isFollowing}
            onFollowToggle={toggleFollow}
          />
        }
        ListEmptyComponent={
          !loadingDiaries ? (
            <View style={styles.empty}>
              <Ionicons name="journal-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>{t('profile.no_public_diaries')}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  backBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#999',
    fontSize: 15,
  },
});
