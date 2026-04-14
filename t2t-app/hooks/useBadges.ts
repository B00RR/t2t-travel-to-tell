import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export function useBadges(userId: string | undefined) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const fetchBadges = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (!error && data) {
      setBadges(data);
    }
    setLoading(false);
  }, [userId]);

  const checkAndAwardBadges = useCallback(async () => {
    if (!userId) return { newBadges: [] };

    const { data, error } = await supabase.rpc('check_and_award_badges', {
      p_user_id: userId,
    });

    if (!error && data) {
      const newBadgeIds = data as string[];
      setNewBadges(newBadgeIds);
      if (newBadgeIds.length > 0) {
        await fetchBadges();
      }
      return { newBadges: newBadgeIds };
    }
    return { newBadges: [] };
  }, [userId, fetchBadges]);

  return {
    badges,
    loading,
    newBadges,
    fetchBadges,
    checkAndAwardBadges,
  };
}
