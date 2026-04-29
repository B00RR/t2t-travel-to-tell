import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';
import { showToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';

export function useUserProfile(profileId: string | undefined) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId, fetchProfile]);

  async function updateProfile(updates: Partial<Profile>) {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (updateError) throw updateError;
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (err: any) {
      if (__DEV__) console.error('Update profile error:', err);
      showToast({ message: t('profile.err_update_failed'), type: 'error' });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(uri: string) {
    setLoading(true);
    try {
      const fileName = `${profileId}/avatar_${Date.now()}.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      return { success: true, url: publicUrl };
    } catch (err: any) {
      if (__DEV__) console.error('Upload avatar error:', err);
      showToast({ message: t('profile.err_avatar_failed'), type: 'error' });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }

  async function checkUsernameUnique(username: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('profiles')
      .select('username', { count: 'exact', head: true })
      .eq('username', username)
      .not('id', 'eq', profileId);

    if (error) return false;
    return count === 0;
  }

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    updateProfile,
    uploadAvatar,
    checkUsernameUnique,
  };
}
