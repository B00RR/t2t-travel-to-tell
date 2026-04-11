import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SuggestedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  stats: { diaries?: number; followers?: number } | null;
}

interface Props {
  currentUserId: string;
}

export function PeopleToFollow({ currentUserId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    // 1. Fetch who I already follow
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    const followingIds = new Set((followingData || []).map(f => f.following_id as string));
    followingIds.add(currentUserId); // exclude self

    // 2. Fetch top profiles excluding those already followed
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, stats')
      .not('id', 'in', `(${Array.from(followingIds).join(',')})`)
      .not('username', 'is', null)
      .order('created_at', { ascending: false })
      .limit(15);

    if (data) setSuggestions(data as SuggestedUser[]);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const handleFollow = useCallback(async (userId: string) => {
    setFollowed(prev => new Set([...prev, userId]));
    const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
    if (error) setFollowed(prev => { const s = new Set(prev); s.delete(userId); return s; });
  }, [currentUserId]);

  const handleUnfollow = useCallback(async (userId: string) => {
    setFollowed(prev => { const s = new Set(prev); s.delete(userId); return s; });
    const { error } = await supabase.from('follows').delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId);
    if (error) setFollowed(prev => new Set([...prev, userId]));
  }, [currentUserId]);

  if (loading || suggestions.length === 0) return null;

  const renderItem = ({ item }: { item: SuggestedUser }) => {
    const name = item.display_name || item.username || '?';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const diaryCount = item.stats?.diaries ?? 0;
    const isFollowed = followed.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
        onPress={() => router.push(`/(app)/profile/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={[styles.avatar, { backgroundColor: theme.tealDim }]}>
          {item.avatar_url ? null : (
            <Text style={[styles.initials, { color: theme.bg }]}>{initials}</Text>
          )}
        </View>
        <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>{name}</Text>
        {diaryCount > 0 && (
          <Text style={[styles.sub, { color: theme.textMuted }]}>{diaryCount} {t('explore.suggestions_diaries')}</Text>
        )}
        <TouchableOpacity
          style={[styles.followBtn, { backgroundColor: theme.teal }, isFollowed && [styles.followingBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]]}
          onPress={() => isFollowed ? handleUnfollow(item.id) : handleFollow(item.id)}
        >
          <Text style={[styles.followBtnText, { color: theme.bg }, isFollowed && { color: theme.textSecondary }]}>
            {isFollowed ? t('profile.following_button') : t('profile.follow')}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('explore.suggestions_title')}</Text>
      <FlatList
        data={suggestions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: 110,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  initials: {
    fontSize: 18,
    fontWeight: '800',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
  followBtn: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  followingBtn: {
    borderWidth: 1,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  followingBtnText: {
  },
});
