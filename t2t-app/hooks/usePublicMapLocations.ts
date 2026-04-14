import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { MapLocation } from './useMapLocations';

export interface PublicMapLocation extends MapLocation {
  author_username: string | null;
  author_display_name: string | null;
}

interface DiaryRow {
  id: string;
  title: string;
  author_id: string;
  profiles: { username: string | null; display_name: string | null } | null;
}

interface LocationMetadata {
  lat: number;
  lng: number;
  name?: string;
  city?: string;
  country?: string;
}

interface UsePublicMapLocationsResult {
  locations: PublicMapLocation[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function usePublicMapLocations(
  enabled: boolean,
  pageSize = 200
): UsePublicMapLocationsResult {
  const [locations, setLocations] = useState<PublicMapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const mountedRef = useRef(true);
  const offsetRef = useRef(0);

  const fetchLocations = useCallback(async (offset = 0, isLoadMore = false) => {
    if (!enabled) return;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const diariesResult = await supabase
        .from('diaries')
        .select('id, title, author_id, profiles!diaries_author_id_fkey(username, display_name)', { count: 'exact' })
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (!mountedRef.current) return;
      if (diariesResult.error) { setError(diariesResult.error.message); setLocations([]); return; }
      
      const diaries = diariesResult.data as unknown as DiaryRow[];
      const diariesCount = diariesResult.count ?? 0;
      
      if (offset === 0) {
        setTotalCount(diariesCount);
      }
      
      if (!diaries || diaries.length === 0) { 
        setLocations([]);
        setHasMore(false);
        return; 
      }

      const diaryMap = new Map(diaries.map(d => [d.id, d]));
      const diaryIds = diaries.map(d => d.id);

      const daysResult = await supabase
        .from('diary_days')
        .select('id, diary_id')
        .in('diary_id', diaryIds)
        .limit(1000);

      if (!mountedRef.current) return;
      if (daysResult.error) { setError(daysResult.error.message); setLocations([]); return; }
      if (!daysResult.data || daysResult.data.length === 0) { setLocations([]); return; }

      const dayMap = new Map(daysResult.data.map(d => [d.id, d.diary_id as string]));
      const dayIds = daysResult.data.map(d => d.id);

      const entriesResult = await supabase
        .from('day_entries')
        .select('id, day_id, metadata')
        .eq('type', 'location')
        .in('day_id', dayIds)
        .limit(2000);

      if (!mountedRef.current) return;
      if (entriesResult.error) { setError(entriesResult.error.message); setLocations([]); return; }
      if (!entriesResult.data) { setLocations([]); return; }

      const result: PublicMapLocation[] = [];
      for (const entry of entriesResult.data) {
        const meta = entry.metadata as LocationMetadata | null;
        if (meta?.lat == null || meta?.lng == null) continue;

        const diaryId = dayMap.get(entry.day_id);
        if (!diaryId) continue;

        const diary = diaryMap.get(diaryId);
        if (!diary) continue;

        result.push({
          id: entry.id,
          diary_id: diaryId,
          diary_title: diary.title,
          name: meta.name || '',
          country: meta.country || null,
          city: meta.city || null,
          lat: meta.lat,
          lng: meta.lng,
          author_username: diary.profiles?.username || null,
          author_display_name: diary.profiles?.display_name || null,
        });
      }

      if (mountedRef.current) {
        if (isLoadMore) {
          setLocations(prev => [...prev, ...result]);
          setCurrentOffset(prev => prev + diaries.length);
          offsetRef.current = offsetRef.current + diaries.length;
        } else {
          setLocations(result);
          setCurrentOffset(diaries.length);
          offsetRef.current = diaries.length;
        }
        setHasMore(diaries.length === pageSize && result.length > 0);
      }
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLocations([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [enabled, pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const nextOffset = offsetRef.current;
    await fetchLocations(nextOffset, true);
  }, [hasMore, loadingMore, fetchLocations]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      offsetRef.current = 0;
      setCurrentOffset(0);
      fetchLocations(0, false);
    }
    return () => { mountedRef.current = false; };
  }, [enabled, fetchLocations]);

  const refresh = useCallback(async () => {
    offsetRef.current = 0;
    setCurrentOffset(0);
    await fetchLocations(0, false);
  }, [fetchLocations]);

  return { locations, loading, loadingMore, error, hasMore, totalCount, refresh, loadMore };
}
