import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import type { TripPlanVisibility, BudgetEstimate } from '@/types/tripPlan';

const DEFAULT_CHECKLIST = [
  { category: 'documents' as const, label: 'Passport / ID', sort_order: 1 },
  { category: 'documents' as const, label: 'Flight tickets', sort_order: 2 },
  { category: 'documents' as const, label: 'Travel insurance', sort_order: 3 },
  { category: 'accommodation' as const, label: 'Book hotel / lodging', sort_order: 4 },
  { category: 'transport' as const, label: 'Airport transfer', sort_order: 5 },
  { category: 'gear' as const, label: 'Adapter / charger', sort_order: 6 },
  { category: 'gear' as const, label: 'Camera', sort_order: 7 },
  { category: 'general' as const, label: 'Notify bank of travel', sort_order: 8 },
];

export interface CreateManualInput {
  title: string;
  description?: string;
  destinations?: string[];
  start_date?: string;
  end_date?: string;
  visibility?: TripPlanVisibility;
  budget_estimate?: BudgetEstimate;
}

export function useCreateTripPlan(userId: string | undefined) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);

  const createManual = useCallback(async (input: CreateManualInput): Promise<string | null> => {
    if (!userId) return null;
    setCreating(true);

    const { data, error } = await supabase
      .from('trip_plans')
      .insert({
        author_id: userId,
        title: input.title,
        description: input.description ?? null,
        destinations: input.destinations ?? [],
        start_date: input.start_date ?? null,
        end_date: input.end_date ?? null,
        visibility: input.visibility ?? 'private',
        budget_estimate: input.budget_estimate ?? {},
      })
      .select('id')
      .single();

    if (error) {
      setCreating(false);
      Alert.alert(t('common.error'), t('common.error_generic'));
      console.error('createManual error', error);
      return null;
    }

    const planId = data.id as string;

    // Insert default checklist
    await supabase.from('trip_plan_checklist_items').insert(
      DEFAULT_CHECKLIST.map(item => ({ ...item, trip_plan_id: planId }))
    );

    setCreating(false);
    return planId;
  }, [userId, t]);

  const createFromDiary = useCallback(async (diaryId: string): Promise<string | null> => {
    if (!userId) return null;
    setCreating(true);

    // Fetch diary details
    const { data: diary, error: diaryError } = await supabase
      .from('diaries')
      .select('id, title, description, destinations, start_date, end_date, cover_image_url')
      .eq('id', diaryId)
      .single();

    if (diaryError || !diary) {
      setCreating(false);
      Alert.alert(t('common.error'), t('common.error_generic'));
      console.error('createFromDiary: diary fetch error', diaryError);
      return null;
    }

    // Fetch diary days to build stops
    const { data: days, error: daysError } = await supabase
      .from('diary_days')
      .select('id, day_number, title, date')
      .eq('diary_id', diaryId)
      .order('day_number', { ascending: true });

    if (daysError) {
      console.warn('createFromDiary: days fetch error', daysError);
    }

    // Fetch location entries for each day to fill location_name
    const dayIds = (days ?? []).map(d => d.id);
    let locationMap: Record<string, string> = {};

    if (dayIds.length > 0) {
      const { data: locEntries } = await supabase
        .from('day_entries')
        .select('day_id, content')
        .in('day_id', dayIds)
        .eq('type', 'location')
        .order('sort_order', { ascending: true });

      if (locEntries) {
        for (const entry of locEntries) {
          // Keep the first location per day
          if (!locationMap[entry.day_id]) {
            locationMap[entry.day_id] = entry.content;
          }
        }
      }
    }

    // Create the trip plan
    const { data: plan, error: planError } = await supabase
      .from('trip_plans')
      .insert({
        author_id: userId,
        source_diary_id: diaryId,
        title: diary.title,
        description: diary.description ?? null,
        destinations: diary.destinations ?? [],
        start_date: diary.start_date ?? null,
        end_date: diary.end_date ?? null,
        cover_image_url: diary.cover_image_url ?? null,
        visibility: 'private',
        budget_estimate: {},
      })
      .select('id')
      .single();

    if (planError || !plan) {
      setCreating(false);
      Alert.alert(t('common.error'), t('common.error_generic'));
      console.error('createFromDiary: plan insert error', planError);
      return null;
    }

    const planId = plan.id as string;

    // Insert stops from diary days
    if (days && days.length > 0) {
      await supabase.from('trip_plan_stops').insert(
        days.map((day, idx) => ({
          trip_plan_id: planId,
          day_number: day.day_number,
          title: day.title ?? null,
          location_name: locationMap[day.id] ?? null,
          notes: null,
          sort_order: idx + 1,
        }))
      );
    }

    // Insert default checklist
    await supabase.from('trip_plan_checklist_items').insert(
      DEFAULT_CHECKLIST.map(item => ({ ...item, trip_plan_id: planId }))
    );

    setCreating(false);
    return planId;
  }, [userId, t]);

  const clonePlan = useCallback(async (sourcePlanId: string): Promise<string | null> => {
    if (!userId) return null;
    setCreating(true);

    const { data, error } = await supabase.rpc('clone_trip_plan', {
      source_plan_id: sourcePlanId,
      new_author_id: userId,
    });

    setCreating(false);

    if (error) {
      Alert.alert(t('common.error'), t('common.error_generic'));
      console.error('clonePlan error', error);
      return null;
    }

    return data as string;
  }, [userId, t]);

  return { creating, createManual, createFromDiary, clonePlan };
}
