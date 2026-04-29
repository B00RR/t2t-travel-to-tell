import { useState, useCallback, useEffect, useRef } from 'react';
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
  const mountedRef = useRef(true);

  const fetchLocations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_map_locations', {
        p_user_id: userId,
      });
      if (!mountedRef.current) return;
      if (error) {
        if (__DEV__) console.error('useMapLocations fetch failed', error);
      } else if (data) {
        setLocations(data as MapLocation[]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchLocations();
    return () => { mountedRef.current = false; };
  }, [fetchLocations]);

  return { locations, loading, refresh: fetchLocations };
}
