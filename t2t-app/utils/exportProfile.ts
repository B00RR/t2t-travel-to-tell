import { supabase } from '@/lib/supabase';
import type { Diary } from '@/types/supabase';

export type ExportFormat = 'json' | 'csv';

export interface ProfileExport {
  exported_at: string;
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    bio: string | null;
    created_at: string;
    preferred_language: string | null;
    travel_style: string | null;
  } | null;
  diaries: Diary[];
  diary_days: Array<{
    id: string;
    diary_id: string;
    day_number: number;
    date: string | null;
    title: string | null;
    summary: string | null;
    mood: string | null;
  }>;
  trip_plans: Array<{
    id: string;
    title: string;
    description: string | null;
    destinations: string[] | null;
    start_date: string | null;
    end_date: string | null;
    visibility: string;
    created_at: string;
  }>;
  follows: {
    following_count: number;
    followers_count: number;
  };
}

/** CSV cell escape — wraps in quotes and doubles internal quotes. */
function csvCell(value: unknown): string {
  if (value == null) return '';
  const str = Array.isArray(value) ? value.join('; ') : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((c) => csvCell(row[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

/** Collects all user data the owner is allowed to read via RLS. */
export async function fetchProfileExport(userId: string): Promise<ProfileExport> {
  const [profileRes, diariesRes, plansRes, followingRes, followersRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, bio, created_at, preferred_language, travel_style')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('diaries')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('trip_plans')
      .select('id, title, description, destinations, start_date, end_date, visibility, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
  ]);

  const diaries = (diariesRes.data ?? []) as Diary[];
  let days: ProfileExport['diary_days'] = [];
  if (diaries.length > 0) {
    const { data } = await supabase
      .from('diary_days')
      .select('id, diary_id, day_number, date, title, summary, mood')
      .in(
        'diary_id',
        diaries.map((d) => d.id)
      )
      .order('day_number', { ascending: true });
    days = data ?? [];
  }

  return {
    exported_at: new Date().toISOString(),
    profile: profileRes.data ?? null,
    diaries,
    diary_days: days,
    trip_plans: (plansRes.data ?? []) as ProfileExport['trip_plans'],
    follows: {
      following_count: followingRes.count ?? 0,
      followers_count: followersRes.count ?? 0,
    },
  };
}

export function formatProfileExport(data: ProfileExport, format: ExportFormat): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // CSV: emit multiple named sections separated by blank lines.
  const parts: string[] = [];

  parts.push(`# T2T Profile Export`);
  parts.push(`# exported_at,${csvCell(data.exported_at)}`);
  parts.push('');

  parts.push('## profile');
  if (data.profile) {
    const cols = ['id', 'username', 'display_name', 'bio', 'created_at', 'preferred_language', 'travel_style'];
    parts.push(rowsToCsv([data.profile as unknown as Record<string, unknown>], cols));
  } else {
    parts.push('(none)');
  }
  parts.push('');

  parts.push('## diaries');
  parts.push(
    rowsToCsv(
      data.diaries as unknown as Array<Record<string, unknown>>,
      [
        'id',
        'title',
        'description',
        'destinations',
        'start_date',
        'end_date',
        'status',
        'visibility',
        'tags',
        'like_count',
        'comment_count',
        'view_count',
        'save_count',
        'created_at',
      ]
    )
  );
  parts.push('');

  parts.push('## diary_days');
  parts.push(
    rowsToCsv(
      data.diary_days as unknown as Array<Record<string, unknown>>,
      ['id', 'diary_id', 'day_number', 'date', 'title', 'summary', 'mood']
    )
  );
  parts.push('');

  parts.push('## trip_plans');
  parts.push(
    rowsToCsv(
      data.trip_plans as unknown as Array<Record<string, unknown>>,
      ['id', 'title', 'description', 'destinations', 'start_date', 'end_date', 'visibility', 'created_at']
    )
  );
  parts.push('');

  parts.push('## follows');
  parts.push(rowsToCsv([data.follows as unknown as Record<string, unknown>], ['following_count', 'followers_count']));

  return parts.join('\n');
}
