import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DiaryCollaborator } from '@/types/collaboration';

interface UseDiaryCollaboratorsResult {
  collaborators: DiaryCollaborator[];
  pending: DiaryCollaborator[];
  loading: boolean;
  refresh: () => Promise<void>;
  inviteCollaborator: (username: string) => Promise<{ ok: boolean; errorKey?: string }>;
  removeCollaborator: (collabId: string) => Promise<boolean>;
  leaveCollaboration: () => Promise<boolean>;
  respondInvitation: (collabId: string, accept: boolean) => Promise<boolean>;
}

/**
 * Hook managing collaborators for a single diary.
 * Owners use it to invite/remove collaborators; invited users can accept/decline/leave.
 */
export function useDiaryCollaborators(diaryId?: string): UseDiaryCollaboratorsResult {
  const [collaborators, setCollaborators] = useState<DiaryCollaborator[]>([]);
  const [pending, setPending] = useState<DiaryCollaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!diaryId) {
      setCollaborators([]);
      setPending([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('diary_collaborators')
      .select('id, diary_id, user_id, invited_by, status, invited_at, responded_at, profile:profiles!user_id(id, username, display_name, avatar_url)')
      .eq('diary_id', diaryId)
      .in('status', ['pending', 'accepted'])
      .order('invited_at', { ascending: false });

    if (!error && data) {
      const rows = data as unknown as DiaryCollaborator[];
      setCollaborators(rows.filter(r => r.status === 'accepted'));
      setPending(rows.filter(r => r.status === 'pending'));
    } else if (error) {
      console.error('fetchCollaborators failed', error);
      setCollaborators([]);
      setPending([]);
    }
    setLoading(false);
  }, [diaryId]);

  const inviteCollaborator = useCallback(
    async (username: string): Promise<{ ok: boolean; errorKey?: string }> => {
      if (!diaryId) return { ok: false, errorKey: 'common.error_generic' };
      const trimmed = username.trim().replace(/^@/, '');
      if (!trimmed) return { ok: false, errorKey: 'collab.invite_error' };

      const { error } = await supabase.rpc('invite_diary_collaborator', {
        p_diary_id: diaryId,
        p_username: trimmed,
      });

      if (error) {
        console.error('inviteCollaborator failed', error);
        const msg = error.message || '';
        if (msg.includes('User not found')) return { ok: false, errorKey: 'collab.user_not_found' };
        if (msg.includes('Cannot invite yourself')) return { ok: false, errorKey: 'collab.cannot_invite_self' };
        if (msg.includes('Not authorized')) return { ok: false, errorKey: 'collab.invite_error' };
        if (msg.includes('Max 10 collaborators')) return { ok: false, errorKey: 'collab.limit_reached' };
        return { ok: false, errorKey: 'collab.invite_error' };
      }

      await fetchAll();
      return { ok: true };
    },
    [diaryId, fetchAll]
  );

  const removeCollaborator = useCallback(
    async (collabId: string): Promise<boolean> => {
      const { error } = await supabase
        .from('diary_collaborators')
        .update({ status: 'removed', responded_at: new Date().toISOString() })
        .eq('id', collabId);

      if (error) {
        console.error('removeCollaborator failed', error);
        return false;
      }
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  const leaveCollaboration = useCallback(async (): Promise<boolean> => {
    if (!diaryId) return false;
    const { data: userResult } = await supabase.auth.getUser();
    const uid = userResult.user?.id;
    if (!uid) return false;

    const { error } = await supabase
      .from('diary_collaborators')
      .update({ status: 'removed', responded_at: new Date().toISOString() })
      .eq('diary_id', diaryId)
      .eq('user_id', uid);

    if (error) {
      console.error('leaveCollaboration failed', error);
      return false;
    }
    await fetchAll();
    return true;
  }, [diaryId, fetchAll]);

  const respondInvitation = useCallback(
    async (collabId: string, accept: boolean): Promise<boolean> => {
      const { error } = await supabase.rpc('respond_diary_invitation', {
        p_collab_id: collabId,
        p_accept: accept,
      });
      if (error) {
        console.error('respondInvitation failed', error);
        return false;
      }
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    collaborators,
    pending,
    loading,
    refresh: fetchAll,
    inviteCollaborator,
    removeCollaborator,
    leaveCollaboration,
    respondInvitation,
  };
}
