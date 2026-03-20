import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MapLocation {
  id: string;
  diary_id: string;
  diary_title: string;
  name: string;
  country: string | null;
  city: string | null;
  lat: number;
  lng: number;
}

export function useMapLocations(userId: string | undefined) {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_map_locations', {
        p_user_id: userId,
      });
      if (error) {
        console.error('useMapLocations fetch failed', error);
      } else if (data) {
        setLocations(data as MapLocation[]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, refresh: fetchLocations };
}
