-- ============================================================
-- Phase: Real-time Collaboration
-- Enables real-time sync for diary editing and presence tracking.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enable Realtime on existing tables
-- ------------------------------------------------------------
-- Enable realtime for day_entries (real-time entry updates)
alter publication supabase_realtime add table public.day_entries;

-- Enable realtime for diary_days (real-time day updates)
alter publication supabase_realtime add table public.diary_days;

-- ------------------------------------------------------------
-- 2. diary_presence table
--    Tracks which users are currently viewing/editing a diary.
--    Used for presence indicators (who's online).
-- ------------------------------------------------------------
create table if not exists public.diary_presence (
  diary_id uuid not null references public.diaries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_id uuid references public.diary_days(id) on delete set null,
  status text not null default 'viewing'
    check (status in ('viewing', 'editing')),
  last_seen timestamptz not null default now(),
  primary key (diary_id, user_id)
);

create index idx_diary_presence_diary on public.diary_presence(diary_id);
create index idx_diary_presence_day on public.diary_presence(day_id) where day_id is not null;

alter table public.diary_presence enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'diary_presence' and policyname = 'diary_presence_select'
  ) then
    create policy diary_presence_select on public.diary_presence
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'diary_presence' and policyname = 'diary_presence_insert'
  ) then
    create policy diary_presence_insert on public.diary_presence
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'diary_presence' and policyname = 'diary_presence_update'
  ) then
    create policy diary_presence_update on public.diary_presence
      for update using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'diary_presence' and policyname = 'diary_presence_delete'
  ) then
    create policy diary_presence_delete on public.diary_presence
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Auto-cleanup stale presence (no activity for 5 minutes)
create or replace function public.cleanup_stale_presence()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.diary_presence
  where last_seen < now() - interval '5 minutes';
end;
$$;

-- Run cleanup every 5 minutes via pg_cron (if available)
-- Note: pg_cron extension must be enabled on Supabase
-- uncomment if pg_cron is available:
-- select cron.schedule('cleanup-presence', '*/5 * * * *', 'select cleanup_stale_presence()');

-- ------------------------------------------------------------
-- 3. Helper function to get active collaborators for a diary
-- ------------------------------------------------------------
create or replace function public.get_diary_presence(p_diary_id uuid)
returns setof record (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  day_id uuid,
  status text,
  last_seen timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.user_id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    p.day_id,
    p.status,
    p.last_seen
  from public.diary_presence p
  join public.profiles pr on pr.id = p.user_id
  where p.diary_id = p_diary_id
    and p.last_seen > now() - interval '5 minutes'
  order by p.last_seen desc;
$$;

grant execute on function public.get_diary_presence(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Trigger to update entry metadata with editor info
--    When a day_entry is inserted/updated, record who edited it
-- ------------------------------------------------------------
create or replace function public.set_entry_editor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If author_id is not set, set it to the current user
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_entry_editor on public.day_entries;
create trigger trg_set_entry_editor
  before insert or update on public.day_entries
  for each row execute function public.set_entry_editor();

-- ------------------------------------------------------------
-- 5. RLS policies for day_entries collaboration
--    Allow collaborators to insert/update/delete entries
-- ------------------------------------------------------------
do $$
declare
  v_policy_exists boolean;
begin
  -- Check if the collaborative entries policy already exists
  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'day_entries'
      and policyname = 'collaborative_entries_all'
  ) into v_policy_exists;

  if not v_policy_exists then
    -- Create policy that allows:
    -- 1. Diary owner full access
    -- 2. Accepted collaborators can insert/update their own entries
    -- 3. Everyone can read (via existing policy)
    create policy collaborative_entries_all on public.day_entries
      for all
      using (
        -- Owner has full access
        exists (
          select 1 from public.diaries d
          where d.id = (
            select dd.diary_id from public.diary_days dd where dd.id = day_entries.day_id
          )
          and d.author_id = auth.uid()
        )
        or
        -- Accepted collaborators can manage their own entries
        (
          exists (
            select 1 from public.diary_collaborators dc
            join public.diary_days dd on dd.diary_id = dc.diary_id
            where dc.diary_id = (
              select dd2.diary_id from public.diary_days dd2 where dd2.id = day_entries.day_id
            )
            and dc.user_id = auth.uid()
            and dc.status = 'accepted'
          )
          and day_entries.author_id = auth.uid()
        )
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 6. RLS policies for diary_days collaboration
--    Allow collaborators to update days (but not delete)
-- ------------------------------------------------------------
do $$
declare
  v_policy_exists boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'diary_days'
      and policyname = 'collaborative_days_update'
  ) into v_policy_exists;

  if not v_policy_exists then
    create policy collaborative_days_update on public.diary_days
      for update
      using (
        -- Owner has full access
        exists (
          select 1 from public.diaries d
          where d.id = diary_days.diary_id
          and d.author_id = auth.uid()
        )
        or
        -- Accepted collaborators can update days
        exists (
          select 1 from public.diary_collaborators dc
          where dc.diary_id = diary_days.diary_id
          and dc.user_id = auth.uid()
          and dc.status = 'accepted'
        )
      );
  end if;
end $$;

-- Note: Delete still restricted to owner only via existing policy
