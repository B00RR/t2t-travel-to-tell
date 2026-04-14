import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TravelBuddy {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  travel_style: string | null;
  match_score: number;
  common_destinations: string[] | null;
}

interface MatchTravelBuddiesResult {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  travel_style: string | null;
  match_score: number;
  common_destinations: string[] | null;
}

export function useTravelBuddies(userId: string | undefined) {
  const [buddies, setBuddies] = useState<TravelBuddy[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBuddies = useCallback(async (limit = 10, minScore = 0.1) => {
    if (!userId) return;

    setLoading(true);

    const { data, error } = await supabase.rpc('match_travel_buddies', {
      p_user_id: userId,
      p_limit: limit,
      p_min_score: minScore,
    });

    if (!error && data) {
      setBuddies(data as MatchTravelBuddiesResult[]);
    }
    setLoading(false);
  }, [userId]);

  return {
    buddies,
    loading,
    fetchBuddies,
  };
}
