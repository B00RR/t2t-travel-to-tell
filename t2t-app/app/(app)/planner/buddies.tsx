import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { TripPlan } from '@/types/tripPlan';

interface BuddyPlan extends TripPlan {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function TravelBuddiesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [myDestinations, setMyDestinations] = useState<string[]>([]);
  const [matches, setMatches] = useState<BuddyPlan[]>([]);
  const [allPublic, setAllPublic] = useState<BuddyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchData = useCallback(async (refresh = false) => {
    if (!user) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);

    // 1. Fetch my public plans to extract my destinations
    const { data: myPlans } = await supabase
      .from('trip_plans')
      .select('destinations')
      .eq('author_id', user.id)
      .eq('visibility', 'public');

    const myDests: string[] = [];
    (myPlans || []).forEach(p => {
      (p.destinations || []).forEach((d: string) => {
        const normalized = d.trim().toLowerCase();
        if (!myDests.includes(normalized)) myDests.push(normalized);
      });
    });
    setMyDestinations(myDests);

    // 2. Fetch all public plans from other users
    const { data: publicPlans } = await supabase
      .from('trip_plans')
      .select(`
        *,
        profiles!trip_plans_author_id_fkey (
          username, display_name, avatar_url
        )
      `)
      .eq('visibility', 'public')
      .neq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const plans = (publicPlans || []) as BuddyPlan[];
    setAllPublic(plans);

    // 3. Filter matches by shared destinations
    if (myDests.length > 0) {
      const matched = plans.filter(plan =>
        (plan.destinations || []).some((d: string) =>
          myDests.includes(d.trim().toLowerCase())
        )
      );
      setMatches(matched);
    } else {
      setMatches([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayedPlans = (() => {
    const source = activeFilter
      ? allPublic.filter(p => (p.destinations || []).some((d: string) =>
          d.trim().toLowerCase() === activeFilter
        ))
      : matches.length > 0 ? matches : allPublic;
    return source;
  })();

  // Collect all unique destinations from public plans for filter chips
  const allDestinations = Array.from(
    new Set(allPublic.flatMap(p => (p.destinations || []).map((d: string) => d.trim())))
  ).slice(0, 15);

  const renderItem = ({ item }: { item: BuddyPlan }) => {
    const sharedDests = (item.destinations || []).filter((d: string) =>
      myDestinations.includes(d.trim().toLowerCase())
    );
    const hasMatch = sharedDests.length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => router.push(`/(app)/profile/${item.author_id}`)}
          >
            {item.profiles?.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            )}
            <View>
              <Text style={styles.displayName}>
                {item.profiles?.display_name || item.profiles?.username}
              </Text>
              <Text style={styles.username}>@{item.profiles?.username}</Text>
            </View>
          </TouchableOpacity>
          {hasMatch && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>🎯 Match</Text>
            </View>
          )}
        </View>

        <Text style={styles.planTitle} numberOfLines={1}>{item.title}</Text>

        <View style={styles.destRow}>
          {(item.destinations || []).map((dest: string, i: number) => (
            <View
              key={i}
              style={[styles.destPill, myDestinations.includes(dest.trim().toLowerCase()) && styles.destPillMatch]}
            >
              <Text style={[styles.destText, myDestinations.includes(dest.trim().toLowerCase()) && styles.destTextMatch]}>
                📍 {dest}
              </Text>
            </View>
          ))}
        </View>

        {(item.start_date || item.end_date) && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={styles.dateText}>
              {item.start_date || '?'}  {item.end_date ? `→ ${item.end_date}` : ''}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.viewPlanBtn}
          onPress={() => router.push(`/planner/${item.id}`)}
        >
          <Text style={styles.viewPlanText}>{t('planner.clone')}</Text>
          <Ionicons name="arrow-forward" size={15} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('buddy.title')}</Text>
          <Text style={styles.headerSub}>{t('buddy.subtitle')}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={displayedPlans}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#007AFF" />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Destination filter chips */}
            {allDestinations.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{t('buddy.your_destinations')}</Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    style={[styles.filterChip, !activeFilter && styles.filterChipActive]}
                    onPress={() => setActiveFilter(null)}
                  >
                    <Text style={[styles.filterChipText, !activeFilter && styles.filterChipTextActive]}>
                      {matches.length > 0 ? `🎯 Match (${matches.length})` : 'Tutti'}
                    </Text>
                  </TouchableOpacity>
                  {allDestinations.map(dest => (
                    <TouchableOpacity
                      key={dest}
                      style={[styles.filterChip, activeFilter === dest.trim().toLowerCase() && styles.filterChipActive]}
                      onPress={() => setActiveFilter(prev => prev === dest.trim().toLowerCase() ? null : dest.trim().toLowerCase())}
                    >
                      <Text style={[styles.filterChipText, activeFilter === dest.trim().toLowerCase() && styles.filterChipTextActive]}>
                        {dest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Text style={styles.listSectionTitle}>
              {matches.length > 0 && !activeFilter
                ? t('buddy.matches')
                : t('buddy.your_destinations')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>🌍</Text>
            <Text style={styles.emptyText}>
              {myDestinations.length === 0
                ? t('buddy.no_plans')
                : t('buddy.no_matches')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40 },
  filterSection: { marginBottom: 16 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#f2f2f7',
    borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  listSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center',
  },
  displayName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 12, color: '#999' },
  matchBadge: {
    backgroundColor: '#fff3e0', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#ffcc80',
  },
  matchBadgeText: { fontSize: 12, fontWeight: '700', color: '#e65100' },
  planTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  destRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  destPill: {
    backgroundColor: '#f0f0f0', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  destPillMatch: { backgroundColor: '#fff3e0', borderWidth: 1, borderColor: '#ffcc80' },
  destText: { fontSize: 12, color: '#555' },
  destTextMatch: { color: '#e65100', fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  dateText: { fontSize: 13, color: '#888' },
  viewPlanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#f0f7ff', borderWidth: 1, borderColor: '#cce0ff',
  },
  viewPlanText: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center', paddingHorizontal: 40 },
});
