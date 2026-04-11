-- ============================================================
-- Phase 2: Push notifications + Full-text search
-- ============================================================

-- ------------------------------------------------------------
-- 1. push_tokens table
--    Stores the Expo push tokens registered by a user's devices.
--    A user can have multiple tokens (one per device); we uniquify
--    on (user_id, token) so re-registrations are idempotent.
-- ------------------------------------------------------------
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- A user can only read, insert, update or delete their own tokens.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_select_own'
  ) then
    create policy push_tokens_select_own on public.push_tokens
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_insert_own'
  ) then
    create policy push_tokens_insert_own on public.push_tokens
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_update_own'
  ) then
    create policy push_tokens_update_own on public.push_tokens
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_delete_own'
  ) then
    create policy push_tokens_delete_own on public.push_tokens
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. notifications → Edge Function fan-out trigger
--    When a row is inserted into public.notifications, notify the
--    `send-push` Edge Function via pg_net so the recipient's device
--    receives a push. Falls back gracefully if pg_net is unavailable.
--
--    The Edge Function is responsible for loading the user's tokens
--    from public.push_tokens and dispatching to Expo's push API.
-- ------------------------------------------------------------
create or replace function public.notify_send_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := current_setting('app.settings.edge_function_url', true);
  v_service_key text := current_setting('app.settings.service_role_key', true);
begin
  -- If the pg_net extension + settings aren't available, skip silently;
  -- the notification row is still persisted and visible via the in-app UI.
  if v_url is null or v_url = '' or v_service_key is null or v_service_key = '' then
    return new;
  end if;

  begin
    perform net.http_post(
      url := v_url || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'notification_id', new.id,
        'user_id', new.user_id,
        'actor_id', new.actor_id,
        'type', new.type,
        'target_id', new.target_id
      )
    );
  exception when others then
    -- Never block the insert if the Edge dispatch fails.
    null;
  end;

  return new;
end;
$$;

drop trigger if exists trg_notifications_push on public.notifications;
create trigger trg_notifications_push
  after insert on public.notifications
  for each row execute function public.notify_send_push();

-- ------------------------------------------------------------
-- 3. Full-text search on diaries
--    Adds a stored, generated tsvector column and a GIN index so
--    search_diaries can use @@ / websearch_to_tsquery instead of
--    ilike — scales from O(n) to O(log n).
-- ------------------------------------------------------------
alter table public.diaries
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')),            'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(destinations, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')),      'C')
  ) stored;

create index if not exists idx_diaries_search_vector
  on public.diaries using gin (search_vector);

-- Replace the old ilike-based RPC.
-- SECURITY INVOKER so the caller's RLS policies on `diaries` apply
-- naturally (private diaries remain invisible to other users).
create or replace function public.search_diaries(search_query text)
returns setof public.diaries
language sql
security invoker
set search_path = public
as $$
  with q as (
    select
      trim(search_query) as raw,
      -- Escape LIKE wildcards so user input can't sneak % or _ into
      -- the substring fallback (e.g. "50%" should match rows that
      -- literally contain "50%" not every row).
      -- E-strings used so backslash handling is unambiguous regardless
      -- of the server's standard_conforming_strings setting.
      replace(
        replace(
          replace(trim(search_query), E'\\', E'\\\\'),
          '%', E'\\%'
        ),
        '_', E'\\_'
      ) as escaped
  )
  select d.*
  from public.diaries d, q
  where q.raw is not null
    and length(q.raw) > 0
    and (
      -- tsquery match (fast, handles multiple words & prefixes)
      d.search_vector @@ websearch_to_tsquery('simple', q.raw)
      -- Fallback for very short/partial tokens the tsquery won't match.
      -- The escaped form + ESCAPE '\' neutralises any LIKE metacharacter
      -- injected by the caller.
      or d.title ilike '%' || q.escaped || '%' escape E'\\'
    )
  order by
    ts_rank(d.search_vector, websearch_to_tsquery('simple', q.raw)) desc,
    d.created_at desc
  limit 200;
$$;

-- Allow both anon and authenticated roles to call the function.
-- RLS on diaries handles visibility.
grant execute on function public.search_diaries(text) to anon, authenticated;
