import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

export function useFollow(currentUserId: string | undefined, targetProfileId: string | undefined) {
  const { t } = useTranslation();
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
      if (__DEV__) console.debug('Failed to check follow status', e);
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
      Alert.alert(t('social.login_required'), t('social.login_to_follow'));
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
      if (__DEV__) console.warn('Failed to toggle follow', e);
      Alert.alert(t('common.error'), t('social.err_follow_toggle'));
    }
  }, [currentUserId, targetProfileId, isFollowing]);

  return { isFollowing, loading, toggleFollow };
}
