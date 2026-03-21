import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import type { TripPlan } from '@/types/tripPlan';

const PLAN_FIELDS = `
  id, author_id, source_diary_id, title, description, cover_image_url,
  destinations, start_date, end_date, visibility, budget_estimate, clone_count, created_at, updated_at,
  profiles!trip_plans_author_id_fkey (
    username,
    display_name,
    avatar_url
  )
`;

export function useTripPlans(userId: string | undefined) {
  const { t } = useTranslation();
  const [myPlans, setMyPlans] = useState<TripPlan[]>([]);
  const [publicPlans, setPublicPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyPlans = useCallback(async (isRefreshing = false) => {
    if (!userId) return;
    if (!isRefreshing) setLoading(true);

    const { data, error } = await supabase
      .from('trip_plans')
      .select(PLAN_FIELDS)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyPlans(data as TripPlan[]);
    } else if (error) {
      Alert.alert(t('common.error'), t('common.error_generic'));
      console.error('fetchMyPlans error', error);
    }

    setLoading(false);
    if (isRefreshing) setRefreshing(false);
  }, [userId, t]);

  const fetchPublicPlans = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);

    const { data, error } = await supabase
      .from('trip_plans')
      .select(PLAN_FIELDS)
      .eq('visibility', 'public')
      .order('clone_count', { ascending: false })
      .limit(30);

    if (!error && data) {
      setPublicPlans(data as TripPlan[]);
    } else if (error) {
      console.error('fetchPublicPlans error', error);
    }

    setLoading(false);
    if (isRefreshing) setRefreshing(false);
  }, [t]);

  const refresh = useCallback((tab: 'my' | 'discover') => {
    setRefreshing(true);
    if (tab === 'my') {
      fetchMyPlans(true);
    } else {
      fetchPublicPlans(true);
    }
  }, [fetchMyPlans, fetchPublicPlans]);

  return {
    myPlans,
    publicPlans,
    loading,
    refreshing,
    fetchMyPlans,
    fetchPublicPlans,
    refresh,
  };
}
