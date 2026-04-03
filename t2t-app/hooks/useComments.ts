import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import type { Comment } from '@/types/social';
import { validateComment } from '@/utils/inputValidator';
import { supabase } from '@/lib/supabase';

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async (diaryId: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error: err } = await supabase
      .from('comments')
      .select(`
        id, user_id, diary_id, content, parent_id, created_at,
        profiles:user_id ( id, username, display_name, avatar_url )
      `)
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: true });
    
    if (err) {
      setError(new Error(err.message));
    } else if (data) {
      const mapped: Comment[] = data.map((item: any) => ({
        ...item,
        author: item.profiles,
      }));
      setComments(mapped);
    }
    
    setLoading(false);
  }, []);

  const addComment = useCallback(async (diaryId: string, userId: string, content: string, parentId: string | null = null) => {
    // Input validation (length, XSS sanitisation)
    const validation = validateComment(content);
    if (!validation.valid) {
      Alert.alert('Errore', validation.reason);
      return false;
    }

    setSubmitting(true);

    const { error: dbError } = await supabase
      .from('comments')
      .insert({
        diary_id: diaryId,
        user_id: userId,
        content: validation.sanitized,
        parent_id: parentId,
      });

    setSubmitting(false);

    if (dbError) {
      Alert.alert('Errore', 'Impossibile pubblicare il commento.');
      return false;
    }

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
          const { error: dbError } = await supabase.from('comments').delete().eq('id', commentId);
          if (dbError) {
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
