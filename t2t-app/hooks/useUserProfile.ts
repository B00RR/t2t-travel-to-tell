import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';
import { Alert } from 'react-native';

export function useUserProfile(profileId: string | undefined) {
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
      console.error('Update profile error:', err);
      Alert.alert('Errore', 'Impossibile aggiornare il profilo. Riprova più tardi.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(uri: string) {
    setLoading(true);
    try {
      const fileName = `${profileId}/avatar_${Date.now()}.jpg`;
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
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
      console.error('Upload avatar error:', err);
      Alert.alert('Errore Upload', 'Impossibile caricare l\'avatar. Riprova più tardi.');
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
