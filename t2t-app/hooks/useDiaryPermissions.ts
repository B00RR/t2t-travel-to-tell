import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { DiaryPermissions, DiaryRole } from '@/types/collaboration';

/**
 * Resolves the caller's role on a diary.
 * - owner: controls everything
 * - collaborator: can add days and own entries
 * - viewer: read-only (non-owner, non-collaborator but can see the diary)
 */
export function useDiaryPermissions(diaryId?: string): DiaryPermissions {
  const { user } = useAuth();
  const [role, setRole] = useState<DiaryRole>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    if (!diaryId || !user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: diary } = await supabase
      .from('diaries')
      .select('author_id')
      .eq('id', diaryId)
      .maybeSingle();

    if (diary?.author_id === user.id) {
      setRole('owner');
      setLoading(false);
      return;
    }

    const { data: collab } = await supabase
      .from('diary_collaborators')
      .select('status')
      .eq('diary_id', diaryId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();

    if (collab) {
      setRole('collaborator');
    } else if (diary) {
      setRole('viewer');
    } else {
      setRole(null);
    }
    setLoading(false);
  }, [diaryId, user?.id]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  const isOwner = role === 'owner';
  const isCollab = role === 'collaborator';

  return {
    role,
    canEdit: isOwner || isCollab,
    canAddDays: isOwner || isCollab,
    canInvite: isOwner,
    canDelete: isOwner,
    loading,
  };
}
