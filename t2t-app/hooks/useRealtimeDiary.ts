import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export interface PresenceUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  day_id: string | null;
  status: 'viewing' | 'editing';
  last_seen: string;
}

export interface RealtimeEntryChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  entry: Database['public']['Tables']['day_entries']['Row'];
}

export interface RealtimeDayChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  day: Database['public']['Tables']['diary_days']['Row'];
}

interface UseRealtimeDiaryOptions {
  diaryId: string;
  dayId?: string;
  userId: string | undefined;
  onEntryChange?: (change: RealtimeEntryChange) => void;
  onDayChange?: (change: RealtimeDayChange) => void;
  onPresenceChange?: (users: PresenceUser[]) => void;
}

export function useRealtimeDiary({
  diaryId,
  dayId,
  userId,
  onEntryChange,
  onDayChange,
  onPresenceChange,
}: UseRealtimeDiaryOptions) {
  const [activeCollaborators, setActiveCollaborators] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const entriesChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePresence = useCallback(async (status: 'viewing' | 'editing' = 'viewing') => {
    if (!userId) return;

    await supabase
      .from('diary_presence')
      .upsert({
        diary_id: diaryId,
        user_id: userId,
        day_id: dayId ?? null,
        status,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'diary_id,user_id',
      });
  }, [diaryId, dayId, userId]);

  const removePresence = useCallback(async () => {
    if (!userId) return;

    await supabase
      .from('diary_presence')
      .delete()
      .eq('diary_id', diaryId)
      .eq('user_id', userId);
  }, [diaryId, userId]);

  useEffect(() => {
    if (!diaryId || !userId) return;

    entriesChannelRef.current = supabase
      .channel(`diary-entries-${diaryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'day_entries',
          filter: dayId ? `day_id=eq.${dayId}` : undefined,
        },
        (payload) => {
          if (onEntryChange) {
            onEntryChange({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              entry: payload.new as Database['public']['Tables']['day_entries']['Row'],
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    presenceChannelRef.current = supabase
      .channel(`diary-presence-${diaryId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'diary_presence',
        filter: `diary_id=eq.${diaryId}`,
      }, async () => {
        if (onPresenceChange) {
          const { data } = await supabase.rpc('get_diary_presence', {
            p_diary_id: diaryId,
          });
          if (data) {
            setActiveCollaborators(data as PresenceUser[]);
            onPresenceChange(data as PresenceUser[]);
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updatePresence('viewing');
        }
      });

    heartbeatRef.current = setInterval(() => {
      updatePresence('viewing');
    }, 60000);

    return () => {
      if (entriesChannelRef.current) {
        supabase.removeChannel(entriesChannelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      removePresence();
    };
  }, [diaryId, dayId, userId, onEntryChange, onDayChange, onPresenceChange, updatePresence, removePresence]);

  const setEditingStatus = useCallback(async (editing: boolean) => {
    await updatePresence(editing ? 'editing' : 'viewing');
  }, [updatePresence]);

  return {
    activeCollaborators,
    isConnected,
    setEditingStatus,
  };
}
