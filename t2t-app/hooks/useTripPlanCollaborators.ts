import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';
import type { CollaboratorProfile } from '@/types/collaboration';

export interface TripPlanCollaborator {
  id: string;
  trip_plan_id: string;
  user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'removed';
  invited_at: string;
  responded_at: string | null;
  profile: CollaboratorProfile | null;
}

interface UseTripPlanCollaboratorsResult {
  collaborators: TripPlanCollaborator[];
  pending: TripPlanCollaborator[];
  loading: boolean;
  refresh: () => Promise<void>;
  inviteCollaborator: (username: string) => Promise<{ ok: boolean; errorKey?: string }>;
  removeCollaborator: (collabId: string) => Promise<boolean>;
  leaveCollaboration: () => Promise<boolean>;
  respondInvitation: (collabId: string, accept: boolean) => Promise<boolean>;
}

/**
 * Hook managing collaborators for a single trip plan.
 * Owners use it to invite/remove collaborators; invited users can accept/decline/leave.
 */
export function useTripPlanCollaborators(planId?: string): UseTripPlanCollaboratorsResult {
  const [collaborators, setCollaborators] = useState<TripPlanCollaborator[]>([]);
  const [pending, setPending] = useState<TripPlanCollaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!planId) {
      setCollaborators([]);
      setPending([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('trip_plan_collaborators')
      .select('id, trip_plan_id, user_id, invited_by, status, invited_at, responded_at, profile:profiles!user_id(id, username, display_name, avatar_url)')
      .eq('trip_plan_id', planId)
      .in('status', ['pending', 'accepted'])
      .order('invited_at', { ascending: false });

    if (!error && data) {
      const rows = data as unknown as TripPlanCollaborator[];
      setCollaborators(rows.filter(r => r.status === 'accepted'));
      setPending(rows.filter(r => r.status === 'pending'));
    } else if (error) {
      if (__DEV__) console.error('fetchTripPlanCollaborators failed', error);
      setCollaborators([]);
      setPending([]);
    }
    setLoading(false);
  }, [planId]);

  const inviteCollaborator = useCallback(
    async (username: string): Promise<{ ok: boolean; errorKey?: string }> => {
      if (!planId) return { ok: false, errorKey: 'common.error_generic' };
      const trimmed = username.trim().replace(/^@/, '');
      if (!trimmed) return { ok: false, errorKey: 'collab.invite_error' };

      const { error } = await supabase.rpc('invite_trip_plan_collaborator', {
        p_trip_plan_id: planId,
        p_username: trimmed,
      });

      if (error) {
        if (__DEV__) console.error('inviteTripPlanCollaborator failed', error);
        const msg = error.message || '';
        if (msg.includes('User not found')) return { ok: false, errorKey: 'collab.user_not_found' };
        if (msg.includes('Cannot invite yourself')) return { ok: false, errorKey: 'collab.cannot_invite_self' };
        if (msg.includes('Not authorized')) return { ok: false, errorKey: 'collab.invite_error' };
        if (msg.includes('Max 10 collaborators')) return { ok: false, errorKey: 'collab.limit_reached' };
        if (msg.includes('Already a collaborator')) return { ok: false, errorKey: 'collab.already_collaborator' };
        if (msg.includes('Re-invite cooldown')) return { ok: false, errorKey: 'collab.reinvite_cooldown' };
        return { ok: false, errorKey: 'collab.invite_error' };
      }

      await fetchAll();
      return { ok: true };
    },
    [planId, fetchAll]
  );

  const removeCollaborator = useCallback(
    async (collabId: string): Promise<boolean> => {
      const { error } = await supabase
        .from('trip_plan_collaborators')
        .update({ status: 'removed', responded_at: new Date().toISOString() })
        .eq('id', collabId);

      if (error) {
        if (__DEV__) console.error('removeTripPlanCollaborator failed', error);
        return false;
      }
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  const leaveCollaboration = useCallback(async (): Promise<boolean> => {
    if (!planId) return false;
    const { data: userResult } = await supabase.auth.getUser();
    const uid = userResult.user?.id;
    if (!uid) return false;

    const { error } = await supabase
      .from('trip_plan_collaborators')
      .update({ status: 'removed', responded_at: new Date().toISOString() })
      .eq('trip_plan_id', planId)
      .eq('user_id', uid);

    if (error) {
      if (__DEV__) console.error('leaveTripPlanCollaboration failed', error);
      return false;
    }
    await fetchAll();
    return true;
  }, [planId, fetchAll]);

  const respondInvitation = useCallback(
    async (collabId: string, accept: boolean): Promise<boolean> => {
      const { error } = await supabase.rpc('respond_trip_plan_invitation', {
        p_collab_id: collabId,
        p_accept: accept,
      });
      if (error) {
        if (__DEV__) console.error('respondTripPlanInvitation failed', error);
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
