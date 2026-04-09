export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface Comment {
  id: string;
  user_id: string;
  diary_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;

  // Joined relation fields for UI convenience
  author?: Profile;
}

export interface SocialCounters {
  like_count: number;
  comment_count: number;
  save_count: number;
}
