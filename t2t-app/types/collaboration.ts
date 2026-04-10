/**
 * Types for collaborative diaries.
 * A diary can have multiple collaborators besides its owner.
 * Each collaborator can add days and their own entries.
 */

export type CollaboratorStatus = 'pending' | 'accepted' | 'declined' | 'removed';

export interface CollaboratorProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface DiaryCollaborator {
  id: string;
  diary_id: string;
  user_id: string;
  invited_by: string;
  status: CollaboratorStatus;
  invited_at: string;
  responded_at: string | null;
  profile?: CollaboratorProfile | null;
}

export type DiaryRole = 'owner' | 'collaborator' | 'viewer' | null;

export interface DiaryPermissions {
  role: DiaryRole;
  canEdit: boolean;
  canAddDays: boolean;
  canInvite: boolean;
  canDelete: boolean;
  loading: boolean;
}
