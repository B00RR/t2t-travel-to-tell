export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          preferred_language: string | null
          travel_style: string | null
          stats: Json | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferred_language?: string | null
          travel_style?: string | null
          stats?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferred_language?: string | null
          travel_style?: string | null
          stats?: Json | null
          created_at?: string
        }
      }
      diaries: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string | null
          cover_image_url: string | null
          visibility: string | null
          start_date: string | null
          end_date: string | null
          status: string | null
          destinations: string[] | null
          tags: string[] | null
          budget_summary: Json | null
          like_count: number | null
          comment_count: number | null
          save_count: number | null
          view_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          visibility?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          destinations?: string[] | null
          tags?: string[] | null
          budget_summary?: Json | null
          like_count?: number | null
          comment_count?: number | null
          save_count?: number | null
          view_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          visibility?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          destinations?: string[] | null
          tags?: string[] | null
          budget_summary?: Json | null
          like_count?: number | null
          comment_count?: number | null
          save_count?: number | null
          view_count?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Diary = Database['public']['Tables']['diaries']['Row']

type ProfileShape = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export type FeedDiary = Diary & {
  profiles: ProfileShape | ProfileShape[]
}

/** Normalise profiles which may be an array when FK is not configured */
export function normalizeProfile(
  profiles: FeedDiary['profiles'] | null | undefined
): ProfileShape | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}
