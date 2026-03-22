import { useState, useCallback, useEffect } from 'react';
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

export function usePublicMapLocations(enabled: boolean) {
  const [locations, setLocations] = useState<PublicMapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: diaries, error: dErr } = await supabase
        .from('diaries')
        .select('id, title, author_id, profiles!diaries_author_id_fkey(username, display_name)')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(200);

      if (dErr) { setError(dErr.message); setLocations([]); return; }
      if (!diaries || diaries.length === 0) { setLocations([]); return; }

      const diaryMap = new Map((diaries as unknown as DiaryRow[]).map(d => [d.id, d]));
      const diaryIds = diaries.map(d => d.id);

      const { data: days, error: dayErr } = await supabase
        .from('diary_days')
        .select('id, diary_id')
        .in('diary_id', diaryIds)
        .limit(1000);

      if (dayErr) { setError(dayErr.message); setLocations([]); return; }
      if (!days || days.length === 0) { setLocations([]); return; }

      const dayMap = new Map(days.map(d => [d.id, d.diary_id as string]));
      const dayIds = days.map(d => d.id);

      const { data: entries, error: eErr } = await supabase
        .from('day_entries')
        .select('id, day_id, metadata')
        .eq('type', 'location')
        .in('day_id', dayIds)
        .limit(2000);

      if (eErr) { setError(eErr.message); setLocations([]); return; }
      if (!entries) { setLocations([]); return; }

      const result: PublicMapLocation[] = [];
      for (const entry of entries) {
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

      setLocations(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchLocations();
  }, [enabled, fetchLocations]);

  return { locations, loading, error, refresh: fetchLocations };
}
