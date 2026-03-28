import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/social';
import { Alert } from 'react-native';

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async (diaryId: string) => {
    setLoading(true);
    setError(null);
    
    // We join the profiles table to get the author's avatar and name
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, user_id, diary_id, content, parent_id, created_at,
        profiles:user_id ( id, username, display_name, avatar_url )
      `)
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: true }); // older first

    if (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
    } else if (data) {
      // Map Supabase join format to our TypeScript definition
      const mapped: Comment[] = data.map((item: any) => ({
        ...item,
        author: item.profiles,
      }));
      setComments(mapped);
    }
    
    setLoading(false);
  }, []);

  const addComment = useCallback(async (diaryId: string, userId: string, content: string, parentId: string | null = null) => {
    if (!content.trim()) return false;
    setSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      diary_id: diaryId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId,
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Errore', 'Impossibile pubblicare il commento.');
      return false;
    }

    // Refresh comments to get the newly created one with profile joined
    await fetchComments(diaryId);
    return true;
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: string, diaryId: string) => {
    Alert.alert('Elimina', 'Vuoi eliminare questo commento?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('comments').delete().eq('id', commentId);
          if (error) {
            Alert.alert('Errore', 'Impossibile eliminare il commento.');
          } else {
            await fetchComments(diaryId);
          }
        }
      }
    ]);
  }, [fetchComments]);

  return {
    comments,
    loading,
    submitting,
    error,
    fetchComments,
    addComment,
    deleteComment,
  };
}
