import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import type { SocialCounters } from '@/types/social';

interface UseDiarySocialOptions {
  diaryId: string;
  userId: string | undefined;
  initialCounters: SocialCounters;
}

export function useDiarySocial({ diaryId, userId, initialCounters }: UseDiarySocialOptions) {
  const { t } = useTranslation();
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [counters, setCounters] = useState<SocialCounters>(initialCounters);
  const [loadingInitialState, setLoadingInitialState] = useState(true);

  const fetchInitialState = useCallback(async () => {
    if (!userId) {
      setLoadingInitialState(false);
      return;
    }

    try {
      // Check like status
      const { data: likeData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('diary_id', diaryId)
        .eq('user_id', userId)
        .single();
      
      if (likeData) setHasLiked(true);

      // Check save status
      const { data: saveData } = await supabase
        .from('saves')
        .select('user_id')
        .eq('diary_id', diaryId)
        .eq('user_id', userId)
        .single();
      
      if (saveData) setHasSaved(true);
    } catch (e) {
      // Ignored: mostly means 0 rows returned
      console.debug('Failed to fetch initial social state', e);
    } finally {
      setLoadingInitialState(false);
    }
  }, [diaryId, userId]);

  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  const toggleLike = useCallback(async () => {
    if (!userId) {
      Alert.alert(t('social.login_required'), t('social.login_to_like'));
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Optimistic UI update — capture previous value before flipping
    const prevLiked = hasLiked;
    setHasLiked(!prevLiked);
    setCounters(prev => ({ ...prev, like_count: prev.like_count + (prevLiked ? -1 : 1) }));

    try {
      if (prevLiked) {
        await supabase.from('likes').delete().eq('diary_id', diaryId).eq('user_id', userId);
      } else {
        await supabase.from('likes').insert({ diary_id: diaryId, user_id: userId });
      }
    } catch (e) {
      // Rollback on failure
      setHasLiked(prevLiked);
      setCounters(prev => ({ ...prev, like_count: prev.like_count + (prevLiked ? 1 : -1) }));
      console.warn('Failed to toggle like', e);
    }
  }, [diaryId, userId, hasLiked]);

  const toggleSave = useCallback(async () => {
    if (!userId) {
      Alert.alert(t('social.login_required'), t('social.login_to_save'));
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic UI update — capture previous value before flipping
    const prevSaved = hasSaved;
    setHasSaved(!prevSaved);
    setCounters(prev => ({ ...prev, save_count: prev.save_count + (prevSaved ? -1 : 1) }));

    try {
      if (prevSaved) {
        await supabase.from('saves').delete().eq('diary_id', diaryId).eq('user_id', userId);
      } else {
        await supabase.from('saves').insert({ diary_id: diaryId, user_id: userId });
      }
    } catch (e) {
      // Rollback on failure
      setHasSaved(prevSaved);
      setCounters(prev => ({ ...prev, save_count: prev.save_count + (prevSaved ? 1 : -1) }));
      console.warn('Failed to toggle save', e);
    }
  }, [diaryId, userId, hasSaved]);

  return {
    hasLiked,
    hasSaved,
    counters,
    loadingInitialState,
    toggleLike,
    toggleSave,
  };
}
