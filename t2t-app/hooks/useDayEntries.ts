import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { DayEntry, DayInfo } from '@/types/dayEntry';

/**
 * Hook that manages CRUD operations for day entries.
 * Handles fetch, add (text/tip/location/mood), edit, delete, and sort ordering.
 */
export function useDayEntries(dayId: string | string[]) {
  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const id = Array.isArray(dayId) ? dayId[0] : dayId;

  const getNextSortOrder = useCallback(() => {
    return entries.length > 0
      ? Math.max(...entries.map(e => e.sort_order)) + 1
      : 1;
  }, [entries]);

  const fetchDayInfo = useCallback(async () => {
    const { data, error } = await supabase
      .from('diary_days')
      .select('id, day_number, title, date')
      .eq('id', id)
      .single();
    if (!error && data) setDayInfo(data);
  }, [id]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('day_entries')
      .select('id, type, content, metadata, sort_order')
      .eq('day_id', id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      // For photo entries: resolve signed URLs from storagePath
      const resolved = await Promise.all(
        data.map(async (entry: any) => {
          if (entry.type === 'photo' && entry.metadata?.storagePath) {
            const { data: urlData } = await supabase.storage
              .from('diary-media')
              .createSignedUrl(entry.metadata.storagePath, 60 * 60); // 1 hour
            return {
              ...entry,
              content: urlData?.signedUrl ?? entry.content,
            } as DayEntry;
          }
          if (entry.type === 'video' && entry.metadata?.storagePath) {
            const [urlData, thumbUrlData] = await Promise.all([
              supabase.storage.from('diary-media').createSignedUrl(entry.metadata.storagePath, 60 * 60),
              entry.metadata.thumbnailStoragePath
                ? supabase.storage.from('diary-media').createSignedUrl(entry.metadata.thumbnailStoragePath, 60 * 60)
                : Promise.resolve({ data: null })
            ]);
            return {
              ...entry,
              content: urlData.data?.signedUrl ?? entry.content,
              metadata: {
                 ...entry.metadata,
                 // injecting temporary signed URL into metadata for UI access
                 thumbnailUrl: thumbUrlData.data?.signedUrl 
              }
            } as DayEntry;
          }
          return entry as DayEntry;
        })
      );
      setEntries(resolved);
    }

    setLoading(false);
  }, [id]);

  const addEntry = useCallback(
    async (type: 'text' | 'tip' | 'location', content: string) => {
      if (!content.trim()) return false;
      setSaving(true);

      const metadata =
        type === 'tip'
          ? { category: 'general' }
          : type === 'location'
            ? { place_name: content.trim() }
            : null;

      const { error } = await supabase.from('day_entries').insert({
        day_id: id,
        type,
        content: content.trim(),
        metadata,
        sort_order: getNextSortOrder(),
      });

      setSaving(false);

      if (error) {
        Alert.alert('Errore', `Impossibile aggiungere.\n${error.message}`);
        return false;
      }

      await fetchEntries();
      return true;
    },
    [id, getNextSortOrder, fetchEntries]
  );

  const addMood = useCallback(
    async (emoji: string, label: string) => {
      setSaving(true);

      const { error } = await supabase.from('day_entries').insert({
        day_id: id,
        type: 'mood',
        content: emoji,
        metadata: { label },
        sort_order: getNextSortOrder(),
      });

      setSaving(false);

      if (error) {
        Alert.alert('Errore', error.message);
        return false;
      }

      await fetchEntries();
      return true;
    },
    [id, getNextSortOrder, fetchEntries]
  );

  const updateEntry = useCallback(
    async (entryId: string, newContent: string) => {
      if (!newContent.trim()) return false;
      setSaving(true);

      const { error } = await supabase
        .from('day_entries')
        .update({ content: newContent.trim() })
        .eq('id', entryId);

      setSaving(false);

      if (error) {
        Alert.alert('Errore', error.message);
        return false;
      }

      await fetchEntries();
      return true;
    },
    [fetchEntries]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      return new Promise<void>((resolve) => {
        Alert.alert('Elimina', 'Vuoi eliminare questo blocco?', [
          { text: 'Annulla', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Elimina',
            style: 'destructive',
            onPress: async () => {
              const entry = entries.find(e => e.id === entryId);

              const pathsToRemove: string[] = [];
              if (entry?.type === 'photo' && (entry.metadata as any)?.storagePath) {
                pathsToRemove.push((entry.metadata as any).storagePath);
              }
              if (entry?.type === 'video' && (entry.metadata as any)?.storagePath) {
                pathsToRemove.push((entry.metadata as any).storagePath);
                if ((entry.metadata as any).thumbnailStoragePath) {
                  pathsToRemove.push((entry.metadata as any).thumbnailStoragePath);
                }
              }

              if (pathsToRemove.length > 0) {
                try {
                  await supabase.storage
                    .from('diary-media')
                    .remove(pathsToRemove);
                } catch (_) {
                  // Best-effort cleanup
                }
              }

              const { error } = await supabase
                .from('day_entries')
                .delete()
                .eq('id', entryId);

              if (!error) {
                await fetchEntries();
              } else {
                Alert.alert('Errore', 'Impossibile eliminare.');
              }
              resolve();
            },
          },
        ]);
      });
    },
    [entries, fetchEntries]
  );

  return {
    dayInfo,
    entries,
    loading,
    saving,
    fetchDayInfo,
    fetchEntries,
    addEntry,
    addMood,
    updateEntry,
    deleteEntry,
    getNextSortOrder,
  };
}
