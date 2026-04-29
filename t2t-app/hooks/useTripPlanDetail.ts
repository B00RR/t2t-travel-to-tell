import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { getNetworkStateAsync } from 'expo-network';
import { offlineQueue } from '@/lib/offline';
import type { TripPlan, TripPlanStop, ChecklistItem } from '@/types/tripPlan';

export function useTripPlanDetail(planId: string | string[]) {
  const { t } = useTranslation();
  const id = Array.isArray(planId) ? planId[0] : planId;

  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [stops, setStops] = useState<TripPlanStop[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);

    const [planRes, stopsRes, checklistRes] = await Promise.all([
      supabase
        .from('trip_plans')
        .select(`
          id, author_id, source_diary_id, title, description, cover_image_url,
          destinations, start_date, end_date, visibility, budget_estimate, clone_count, created_at, updated_at,
          profiles!trip_plans_author_id_fkey (
            username, display_name, avatar_url
          )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('trip_plan_stops')
        .select('*')
        .eq('trip_plan_id', id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('trip_plan_checklist_items')
        .select('*')
        .eq('trip_plan_id', id)
        .order('sort_order', { ascending: true }),
    ]);

    if (planRes.error) {
      if (__DEV__) console.error('fetchPlan error', planRes.error);
    } else if (planRes.data) {
      setPlan(planRes.data as unknown as TripPlan);
    }

    if (!stopsRes.error && stopsRes.data) setStops(stopsRes.data as TripPlanStop[]);
    if (!checklistRes.error && checklistRes.data) setChecklist(checklistRes.data as ChecklistItem[]);

    setLoading(false);
  }, [id]);

  const updatePlan = useCallback(async (updates: Partial<Pick<TripPlan, 'title' | 'description' | 'visibility' | 'destinations' | 'start_date' | 'end_date' | 'budget_estimate' | 'cover_image_url'>>) => {
    setSaving(true);
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error } = await supabase
        .from('trip_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      setSaving(false);

      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        if (__DEV__) console.error('updatePlan error', error);
        return false;
      }
      setPlan(prev => prev ? { ...prev, ...updates } : prev);
    } else {
      await offlineQueue.addAction('UPDATE', 'trip_plans', { id, ...updates });
      setPlan(prev => prev ? { ...prev, ...updates } : prev);
      setSaving(false);
    }
    return true;
  }, [id, t]);

  const deletePlan = useCallback(async () => {
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error } = await supabase.from('trip_plans').delete().eq('id', id);
      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        if (__DEV__) console.error('deletePlan error', error);
        return false;
      }
    } else {
      await offlineQueue.addAction('DELETE', 'trip_plans', { id });
    }
    return true;
  }, [id, t]);

  // Stops
  const addStop = useCallback(async (stop: Omit<TripPlanStop, 'id' | 'trip_plan_id' | 'created_at'>) => {
    setSaving(true);
    const nextOrder = stops.length > 0 ? Math.max(...stops.map(s => s.sort_order)) + 1 : 1;
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { data, error } = await supabase
        .from('trip_plan_stops')
        .insert({ ...stop, trip_plan_id: id, sort_order: nextOrder })
        .select()
        .single();
      setSaving(false);

      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        if (__DEV__) console.error('addStop error', error);
        return false;
      }
      setStops(prev => [...prev, data as TripPlanStop]);
    } else {
      const tempId = `temp_stop_${Date.now()}`;
      const tempStop = { ...stop, id: tempId, trip_plan_id: id, sort_order: nextOrder } as TripPlanStop;
      await offlineQueue.addAction('CREATE', 'trip_plan_stops', { ...stop, trip_plan_id: id, sort_order: nextOrder });
      setStops(prev => [...prev, tempStop]);
      setSaving(false);
    }
    return true;
  }, [id, stops, t]);

  const updateStop = useCallback(async (stopId: string, updates: Partial<Pick<TripPlanStop, 'title' | 'location_name' | 'notes'>>) => {
    setSaving(true);
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error } = await supabase
        .from('trip_plan_stops')
        .update(updates)
        .eq('id', stopId);
      setSaving(false);

      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        return false;
      }
      setStops(prev => prev.map(s => s.id === stopId ? { ...s, ...updates } : s));
    } else {
      await offlineQueue.addAction('UPDATE', 'trip_plan_stops', { id: stopId, ...updates });
      setStops(prev => prev.map(s => s.id === stopId ? { ...s, ...updates } : s));
      setSaving(false);
    }
    return true;
  }, [t]);

  const deleteStop = useCallback(async (stopId: string) => {
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error } = await supabase.from('trip_plan_stops').delete().eq('id', stopId);
      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        return false;
      }
    } else {
      await offlineQueue.addAction('DELETE', 'trip_plan_stops', { id: stopId });
    }
    setStops(prev => prev.filter(s => s.id !== stopId));
    return true;
  }, [t]);

  // Checklist
  const toggleChecklistItem = useCallback(async (itemId: string) => {
    const item = checklist.find(i => i.id === itemId);
    if (!item) return;

    const newChecked = !item.is_checked;
    setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, is_checked: newChecked } : i));

    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error } = await supabase
        .from('trip_plan_checklist_items')
        .update({ is_checked: newChecked })
        .eq('id', itemId);

      if (error) {
        setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, is_checked: item.is_checked } : i));
        if (__DEV__) console.error('toggleChecklistItem error', error);
      }
    } else {
      await offlineQueue.addAction('UPDATE', 'trip_plan_checklist_items', { id: itemId, is_checked: newChecked });
    }
  }, [checklist]);

  const addChecklistItem = useCallback(async (label: string, category: ChecklistItem['category']) => {
    setSaving(true);
    const nextOrder = checklist.length > 0 ? Math.max(...checklist.map(i => i.sort_order)) + 1 : 1;
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { data, error } = await supabase
        .from('trip_plan_checklist_items')
        .insert({ trip_plan_id: id, label, category, is_checked: false, sort_order: nextOrder })
        .select()
        .single();
      setSaving(false);

      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        return false;
      }
      setChecklist(prev => [...prev, data as ChecklistItem]);
    } else {
      const tempId = `temp_checklist_${Date.now()}`;
      const tempItem = { id: tempId, trip_plan_id: id, label, category, is_checked: false, sort_order: nextOrder } as ChecklistItem;
      await offlineQueue.addAction('CREATE', 'trip_plan_checklist_items', { trip_plan_id: id, label, category, is_checked: false, sort_order: nextOrder });
      setChecklist(prev => [...prev, tempItem]);
      setSaving(false);
    }
    return true;
  }, [id, checklist, t]);

  const deleteChecklistItem = useCallback(async (itemId: string) => {
    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error } = await supabase
        .from('trip_plan_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        Alert.alert(t('common.error'), t('common.error_generic'));
        return false;
      }
    } else {
      await offlineQueue.addAction('DELETE', 'trip_plan_checklist_items', { id: itemId });
    }
    setChecklist(prev => prev.filter(i => i.id !== itemId));
    return true;
  }, [t]);

  return {
    plan,
    stops,
    checklist,
    loading,
    saving,
    fetchPlan,
    updatePlan,
    deletePlan,
    addStop,
    updateStop,
    deleteStop,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
  };
}
