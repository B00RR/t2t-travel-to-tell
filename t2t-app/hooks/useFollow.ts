import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export function useFollow(currentUserId: string | undefined, targetProfileId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFollowStatus = useCallback(async () => {
    if (!currentUserId || !targetProfileId || currentUserId === targetProfileId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetProfileId)
        .single();
      
      setIsFollowing(!!data);
    } catch (e) {
      // Typically throws if no rows found
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetProfileId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId) {
      Alert.alert('Accesso richiesto', 'Devi effettuare l\'accesso per seguire gli utenti.');
      return;
    }

    if (currentUserId === targetProfileId) return;

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Optimistic UI Update
    setIsFollowing(!isFollowing);

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetProfileId);
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetProfileId,
          });
      }
    } catch (e) {
      // Revert optimism
      setIsFollowing(isFollowing);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato del follow.');
    }
  }, [currentUserId, targetProfileId, isFollowing]);

  return { isFollowing, loading, toggleFollow };
}
