import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import type { DayEntry, DayInfo } from '@/types/dayEntry';

/**
 * Hook that manages CRUD operations for day entries.
 * Handles fetch, add (text/tip/location/mood), edit, delete, and sort ordering.
 */
export function useDayEntries(dayId: string | string[]) {
  const { t } = useTranslation();
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
    if (error) {
      console.error('fetchDayInfo failed', error);
      return;
    }
    if (data) setDayInfo(data);
  }, [id]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('day_entries')
        .select('id, type, content, metadata, sort_order')
        .eq('day_id', id)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        // For photo entries: resolve signed URLs from storagePath
        const resolved = await Promise.all(
          data.map(async (entry: DayEntry) => {
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
      } else if (error) {
        setEntries([]);
        Alert.alert(t('common.error'), t('common.error_generic'));
        console.error('Error fetching entries:', error);
      }
    } catch (e) {
      console.error('fetchEntries failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const addEntry = useCallback(
    async (type: 'text' | 'tip' | 'location', content: string) => {
      if (!content.trim()) return false;
      setSaving(true);

      let metadata: Record<string, any> | null = null;

      if (type === 'tip') {
        metadata = { category: 'general' };
      } else if (type === 'location') {
        metadata = { place_name: content.trim() };

        // Geocode the location name to get coordinates
        try {
          const results = await Location.geocodeAsync(content.trim());
          if (results.length > 0) {
            metadata.coordinates = {
              lat: results[0].latitude,
              lng: results[0].longitude,
            };
          }
        } catch (e) {
          console.warn('Geocoding failed, saving without coordinates:', e);
        }
      }

      const { error } = await supabase.from('day_entries').insert({
        day_id: id,
        type,
        content: content.trim(),
        metadata,
        sort_order: getNextSortOrder(),
      });

      if (error) {
        setSaving(false);
        Alert.alert(t('common.error'), t('day.err_add_failed'));
        console.error('Error adding entry:', error);
        return false;
      }

      // For location entries with coordinates, also save to diary_locations
      if (type === 'location' && metadata?.coordinates) {
        try {
          // Get diary_id from the day
          const { data: dayData } = await supabase
            .from('diary_days')
            .select('diary_id')
            .eq('id', id)
            .single();

          if (dayData?.diary_id) {
            const { lat, lng } = metadata.coordinates;
            await supabase.from('diary_locations').insert({
              diary_id: dayData.diary_id,
              day_id: id,
              name: content.trim(),
              coordinates: `POINT(${lng} ${lat})`,
            });
          }
        } catch (e) {
          console.warn('Failed to save to diary_locations:', e);
        }
      }

      setSaving(false);
      await fetchEntries();
      return true;
    },
    [id, getNextSortOrder, fetchEntries, t]
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
        Alert.alert(t('common.error'), t('day.err_add_failed'));
        console.error('Error adding mood:', error);
        return false;
      }

      await fetchEntries();
      return true;
    },
    [id, getNextSortOrder, fetchEntries, t]
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
        Alert.alert(t('common.error'), t('day.err_update_failed'));
        console.error('Error updating entry:', error);
        return false;
      }

      await fetchEntries();
      return true;
    },
    [fetchEntries, t]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      return new Promise<void>((resolve) => {
        Alert.alert(t('day.delete_entry_title'), t('day.delete_entry_msg'), [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve() },
          {
            text: t('day.delete_entry_btn'),
            style: 'destructive',
            onPress: async () => {
              const entry = entries.find(e => e.id === entryId);

              const pathsToRemove: string[] = [];
              if (entry?.type === 'photo' && entry.metadata?.storagePath) {
                pathsToRemove.push(entry.metadata.storagePath);
              }
              if (entry?.type === 'video' && entry.metadata?.storagePath) {
                pathsToRemove.push(entry.metadata.storagePath);
                if (entry.metadata.thumbnailStoragePath) {
                  pathsToRemove.push(entry.metadata.thumbnailStoragePath);
                }
              }

              if (pathsToRemove.length > 0) {
                try {
                  await supabase.storage
                    .from('diary-media')
                    .remove(pathsToRemove);
                } catch (e) {
                  // Best-effort cleanup
                  console.warn('Failed to cleanup media', e);
                }
              }

              const { error } = await supabase
                .from('day_entries')
                .delete()
                .eq('id', entryId);

              if (!error) {
                await fetchEntries();
              } else {
                Alert.alert(t('common.error'), t('day.err_delete_failed'));
                console.error('Error deleting entry:', error);
              }
              resolve();
            },
          },
        ]);
      });
    },
    [entries, fetchEntries, t]
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
