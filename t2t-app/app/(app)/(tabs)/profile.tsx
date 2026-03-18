import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Profile, Diary } from '@/types/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchProfile();
        fetchDiaries();
      }
    }, [user])
  );

  async function fetchProfile() {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) setProfile(data);
  }

  async function fetchDiaries() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setDiaries(data);
    setLoading(false);
  }

  function getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function handleLogout() {
    Alert.alert(
      'Logout',
      'Vuoi davvero uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Esci', style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    );
  }

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Utente';
  const username = profile?.username || user?.email?.split('@')[0] || '';
  const stats = profile?.stats as { countries?: number; diaries?: number; followers?: number; following?: number } | null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilo</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{getInitials(displayName)}</Text>
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.username}>@{username}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            {profile?.travel_style ? (
              <View style={styles.travelStylePill}>
                <Text style={styles.travelStyleText}>✈️ {profile.travel_style}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{diaries.length}</Text>
              <Text style={styles.statLabel}>Diari</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.countries || 0}</Text>
              <Text style={styles.statLabel}>Paesi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.following || 0}</Text>
              <Text style={styles.statLabel}>Seguiti</Text>
            </View>
          </View>
        </View>

        {/* Section: My Diaries */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>I tuoi Diari</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/create')}>
            <Ionicons name="add-circle" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
        ) : diaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="journal-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Non hai ancora creato nessun diario.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/(tabs)/create')}>
              <Text style={styles.createBtnText}>Crea il tuo primo Diario</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.diariesList}>
            {diaries.map((diary) => (
              <TouchableOpacity
                key={diary.id}
                style={styles.diaryCard}
                onPress={() => router.push(`/diary/${diary.id}`)}
              >
                <View style={styles.diaryCardContent}>
                  <Text style={styles.diaryTitle} numberOfLines={1}>{diary.title}</Text>
                  {diary.destinations && diary.destinations.length > 0 && (
                    <Text style={styles.diaryDest} numberOfLines={1}>
                      📍 {diary.destinations.join(', ')}
                    </Text>
                  )}
                  <View style={styles.diaryMeta}>
                    <View style={[styles.statusBadge, diary.status === 'published' && styles.statusPublished]}>
                      <Text style={[styles.statusText, diary.status === 'published' && styles.statusTextPublished]}>
                        {diary.status === 'draft' ? '📝 Bozza' : '🌍 Pubblicato'}
                      </Text>
                    </View>
                    <View style={styles.diaryStats}>
                      <Ionicons name="heart" size={14} color="#ccc" />
                      <Text style={styles.diaryStatNum}>{diary.like_count || 0}</Text>
                      <Ionicons name="eye" size={14} color="#ccc" style={{ marginLeft: 8 }} />
                      <Text style={styles.diaryStatNum}>{diary.view_count || 0}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  headerIcon: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    color: '#999',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  travelStylePill: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  travelStyleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e65100',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f0f0f0',
  },

  // My Diaries
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  diariesList: {
    marginHorizontal: 16,
  },
  diaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  diaryCardContent: {
    flex: 1,
    marginRight: 12,
  },
  diaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  diaryDest: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  diaryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPublished: {
    backgroundColor: '#e8faf0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusTextPublished: {
    color: '#34C759',
  },
  diaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  diaryStatNum: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '600',
  },
});
