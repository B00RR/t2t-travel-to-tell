import { supabase } from '@/lib/supabase';
import type { SocialCounters } from '@/types/social';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

interface UseDiarySocialOptions {
  diaryId: string;
  userId: string | undefined;
  initialCounters: SocialCounters;
}

export function useDiarySocial({ diaryId, userId, initialCounters }: UseDiarySocialOptions) {
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
    } finally {
      setLoadingInitialState(false);
    }
  }, [diaryId, userId]);

  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  const toggleLike = useCallback(async () => {
    if (!userId) {
      Alert.alert('Accesso richiesto', 'Devi effettuare l\'accesso per mettere mi piace.');
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Optimistic UI update
    setHasLiked(!hasLiked);
    setCounters(prev => ({ ...prev, like_count: prev.like_count + (hasLiked ? -1 : 1) }));

    try {
      if (hasLiked) {
        await supabase.from('likes').delete().eq('diary_id', diaryId).eq('user_id', userId);
        // Supabase triggers generally handle numeric sync for us, but for simplicity we rely on optimistic updates locally.
      } else {
        await supabase.from('likes').insert({ diary_id: diaryId, user_id: userId });
      }
    } catch (e) {
      // Rollback on failure
      setHasLiked(hasLiked);
      setCounters(prev => ({ ...prev, like_count: prev.like_count + (hasLiked ? 1 : -1) }));
    }
  }, [diaryId, userId, hasLiked]);

  const toggleSave = useCallback(async () => {
    if (!userId) {
      Alert.alert('Accesso richiesto', 'Devi effettuare l\'accesso per salvare i diari.');
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic UI update
    setHasSaved(!hasSaved);
    setCounters(prev => ({ ...prev, save_count: prev.save_count + (hasSaved ? -1 : 1) }));

    try {
      if (hasSaved) {
        await supabase.from('saves').delete().eq('diary_id', diaryId).eq('user_id', userId);
      } else {
        await supabase.from('saves').insert({ diary_id: diaryId, user_id: userId });
      }
    } catch (e) {
      // Rollback on failure
      setHasSaved(hasSaved);
      setCounters(prev => ({ ...prev, save_count: prev.save_count + (hasSaved ? 1 : -1) }));
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
