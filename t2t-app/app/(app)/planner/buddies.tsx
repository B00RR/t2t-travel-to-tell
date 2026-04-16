import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';
import type { TripPlan } from '@/types/tripPlan';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
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

    const { data: myPlans } = await supabase
      .from('trip_plans')
      .select('destinations')
      .eq('author_id', user.id)
      .eq('visibility', 'public');

    const myDestsSet = new Set<string>();
    (myPlans || []).forEach(p => {
      (p.destinations || []).forEach((d: string | null) => {
        const normalized = (d ?? '').trim().toLowerCase();
        if (normalized) myDestsSet.add(normalized);
      });
    });
    const myDests = Array.from(myDestsSet);
    setMyDestinations(myDests);

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

    if (myDests.length > 0) {
      const matched = plans.filter(plan =>
        (plan.destinations || []).some((d: string | null) =>
          myDests.includes((d ?? '').trim().toLowerCase())
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

  const myDestinationsSet = useMemo(() => new Set(myDestinations), [myDestinations]);

  const displayedPlans = useMemo(() => {
    if (activeFilter) {
      return allPublic.filter(p => (p.destinations || []).some((d: string | null) =>
        (d ?? '').trim().toLowerCase() === activeFilter
      ));
    }
    return matches.length > 0 ? matches : allPublic;
  }, [activeFilter, allPublic, matches]);

  const allDestinations = useMemo(() =>
    Array.from(new Set(allPublic.flatMap(p =>
      (p.destinations || []).map((d: string | null) => (d ?? '').trim()).filter(Boolean)
    ))).slice(0, 15),
    [allPublic]
  );

  const renderItem = ({ item }: { item: BuddyPlan }) => {
    const hasMatch = (item.destinations || []).some((d: string) =>
      myDestinationsSet.has(d.trim().toLowerCase())
    );

    return (
      <View style={[styles.card, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
        <View style={styles.cardTop}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => router.push(`/(app)/profile/${item.author_id}`)}
          >
            {item.profiles?.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.teal }]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            )}
            <View>
              <Text style={[styles.displayName, { color: theme.textPrimary }]}>
                {item.profiles?.display_name || item.profiles?.username}
              </Text>
              <Text style={[styles.username, { color: theme.textMuted }]}>@{item.profiles?.username}</Text>
            </View>
          </TouchableOpacity>
          {hasMatch && (
            <View style={[styles.matchBadge, { backgroundColor: theme.orangeAlpha10, borderColor: theme.orange }]}>
              <Text style={[styles.matchBadgeText, { color: theme.orange }]}>{t('buddy.match_badge')}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.planTitle, { color: theme.textPrimary }]} numberOfLines={1}>{item.title}</Text>

        <View style={styles.destRow}>
          {(item.destinations || []).map((dest: string, i: number) => {
            const isMatch = myDestinationsSet.has(dest.trim().toLowerCase());
            return (
              <View
                key={i}
                style={[styles.destPill, { backgroundColor: theme.bgSurface }, isMatch && { backgroundColor: theme.orangeAlpha10, borderColor: theme.orange }]}
              >
                <Text style={[styles.destText, { color: theme.textMuted }, isMatch && { color: theme.orange, fontWeight: '600' }]}>
                  📍 {dest}
                </Text>
              </View>
            );
          })}
        </View>

        {(item.start_date || item.end_date) && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              {item.start_date || '?'}  {item.end_date ? `→ ${item.end_date}` : ''}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.viewPlanBtn, { backgroundColor: theme.tealAlpha10, borderColor: theme.teal }]}
          onPress={() => router.push(`/planner/${item.id}`)}
        >
          <Text style={[styles.viewPlanText, { color: theme.teal }]}>{t('planner.clone')}</Text>
          <Ionicons name="arrow-forward" size={15} color={theme.teal} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.teal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('buddy.title')}</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>{t('buddy.subtitle')}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={displayedPlans}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.teal} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {allDestinations.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.textMuted }]}>{t('buddy.your_destinations')}</Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: activeFilter ? theme.bgElevated : theme.teal, borderColor: activeFilter ? theme.border : theme.teal }]}
                    onPress={() => setActiveFilter(null)}
                  >
                    <Text style={[styles.filterChipText, { color: activeFilter ? theme.textPrimary : '#fff' }]}>
                      {matches.length > 0 ? t('buddy.filter_match', { count: matches.length }) : t('buddy.filter_all')}
                    </Text>
                  </TouchableOpacity>
                  {allDestinations.map(dest => (
                    <TouchableOpacity
                      key={dest}
                      style={[styles.filterChip, { backgroundColor: activeFilter === dest.trim().toLowerCase() ? theme.teal : theme.bgElevated, borderColor: activeFilter === dest.trim().toLowerCase() ? theme.teal : theme.border }]}
                      onPress={() => setActiveFilter(prev => prev === dest.trim().toLowerCase() ? null : dest.trim().toLowerCase())}
                    >
                      <Text style={[styles.filterChipText, { color: activeFilter === dest.trim().toLowerCase() ? '#fff' : theme.textPrimary }]}>
                        {dest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Text style={[styles.listSectionTitle, { color: theme.textPrimary }]}>
              {matches.length > 0 && !activeFilter
                ? t('buddy.matches')
                : t('buddy.all_plans')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>🌍</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40 },
  filterSection: { marginBottom: 16 },
  filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  listSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  card: {
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  displayName: { fontSize: 14, fontWeight: '700' },
  username: { fontSize: 12 },
  matchBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  matchBadgeText: { fontSize: 12, fontWeight: '700' },
  planTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  destRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  destPill: {
    paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: Radius.sm,
  },
  destText: { fontSize: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  dateText: { fontSize: 13 },
  viewPlanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: Radius.sm,
    borderWidth: 1,
  },
  viewPlanText: { fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
});
