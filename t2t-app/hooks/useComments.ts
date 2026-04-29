import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Comment } from '@/types/social';
import { validateComment } from '@/utils/inputValidator';
import { supabase } from '@/lib/supabase';
import { getNetworkStateAsync } from 'expo-network';
import { offlineQueue } from '@/lib/offline';
import { showToast } from '@/components/Toast';

export function useComments() {
  const { t } = useTranslation();
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
    const validation = validateComment(content);
    if (!validation.valid) {
      showToast({ message: validation.reason, type: 'warning' });
      return false;
    }

    setSubmitting(true);

    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
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
        toast.show({ message: t('social.err_comment_post'), type: 'error' });
        return false;
      }
    } else {
      await offlineQueue.addAction('CREATE', 'comments', {
        diary_id: diaryId,
        user_id: userId,
        content: validation.sanitized,
        parent_id: parentId,
      });
      setSubmitting(false);
    }

    await fetchComments(diaryId);
    return true;
  }, [fetchComments, t]);

  const deleteComment = useCallback(async (commentId: string, diaryId: string) => {
    Alert.alert(t('social.delete_comment'), t('social.delete_comment_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const networkState = await getNetworkStateAsync();
          const online = networkState.isConnected ?? true;

          if (online) {
            const { error: dbError } = await supabase.from('comments').delete().eq('id', commentId);
            if (dbError) {
              toast.show({ message: t('social.err_comment_delete'), type: 'error' });
            } else {
              await fetchComments(diaryId);
            }
          } else {
            setComments(prev => prev.filter(c => c.id !== commentId));
            await offlineQueue.addAction('DELETE', 'comments', { id: commentId });
          }
        }
      }
    ]);
  }, [fetchComments, t]);

  const updateComment = useCallback(async (commentId: string, diaryId: string, content: string) => {
    const validation = validateComment(content);
    if (!validation.valid) {
      showToast({ message: validation.reason, type: 'warning' });
      return false;
    }

    setSubmitting(true);

    const networkState = await getNetworkStateAsync();
    const online = networkState.isConnected ?? true;

    if (online) {
      const { error: dbError } = await supabase
        .from('comments')
        .update({ content: validation.sanitized })
        .eq('id', commentId);

      setSubmitting(false);

      if (dbError) {
        toast.show({ message: t('social.err_comment_update'), type: 'error' });
        return false;
      }
    } else {
      await offlineQueue.addAction('UPDATE', 'comments', {
        id: commentId,
        content: validation.sanitized,
      });
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, content: validation.sanitized } : c
        )
      );
      setSubmitting(false);
    }

    await fetchComments(diaryId);
    return true;
  }, [fetchComments, t]);

  return {
    comments,
    loading,
    submitting,
    error,
    fetchComments,
    addComment,
    deleteComment,
    updateComment,
  };
}