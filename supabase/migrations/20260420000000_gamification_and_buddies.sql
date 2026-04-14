-- ============================================================
-- Phase: Gamification & Travel Buddies
-- ============================================================

-- ------------------------------------------------------------
-- 1. USER_BADGES table
--    Persists badge awards so they survive across sessions.
-- ------------------------------------------------------------
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists idx_user_badges_user on public.user_badges(user_id);

alter table public.user_badges enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_badges' and policyname = 'user_badges_select_own'
  ) then
    create policy user_badges_select_own on public.user_badges
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_badges' and policyname = 'user_badges_insert_own'
  ) then
    create policy user_badges_insert_own on public.user_badges
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. CHECK_AND_AWARD_BADGES function
--    Evaluates badge criteria and awards new badges.
--    Returns array of newly awarded badge_ids.
--
--    Badge criteria (must match BadgesSection.tsx):
--      first_journey   : diaries >= 1
--      storyteller     : diaries >= 5
--      elite_traveler  : diaries >= 20
--      globetrotter    : countries >= 5
--      explorer        : countries >= 10
--      marco_polo      : countries >= 20
--      popular         : total_likes >= 50
--      influencer      : total_likes >= 500
--      social_butterfly: followers >= 50
-- ------------------------------------------------------------
create or replace function public.check_and_award_badges(p_user_id uuid)
returns setof text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_diaries int;
  v_countries int;
  v_followers int;
  v_total_likes bigint;
  v_new_badges text[] := '{}';
  v_existing_badges text[];
begin
  -- Get user stats
  select
    count(d.id)::int,
    coalesce(array_length(array_concat_agg(distinct d.destinations), 1), 0)::int
  into v_diaries, v_countries
  from public.diaries d
  where d.author_id = p_user_id and d.status = 'published'
  group by d.author_id;

  select count(*)::int into v_followers
  from public.follows
  where following_id = p_user_id;

  select coalesce(sum(d.like_count), 0)::bigint into v_total_likes
  from public.diaries d
  where d.author_id = p_user_id;

  -- Get already-earned badges
  select array_agg(badge_id) into v_existing_badges
  from public.user_badges
  where user_id = p_user_id;

  v_existing_badges := coalesce(v_existing_badges, '{}');

  -- Check and award each badge
  if 'first_journey' = any(v_existing_badges) = false and v_diaries >= 1 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'first_journey');
    v_new_badges := array_append(v_new_badges, 'first_journey');
  end if;

  if 'storyteller' = all(v_existing_badges) = false and v_diaries >= 5 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'storyteller');
    v_new_badges := array_append(v_new_badges, 'storyteller');
  end if;

  if 'elite_traveler' = all(v_existing_badges) = false and v_diaries >= 20 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'elite_traveler');
    v_new_badges := array_append(v_new_badges, 'elite_traveler');
  end if;

  if 'globetrotter' = all(v_existing_badges) = false and v_countries >= 5 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'globetrotter');
    v_new_badges := array_append(v_new_badges, 'globetrotter');
  end if;

  if 'explorer' = all(v_existing_badges) = false and v_countries >= 10 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'explorer');
    v_new_badges := array_append(v_new_badges, 'explorer');
  end if;

  if 'marco_polo' = all(v_existing_badges) = false and v_countries >= 20 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'marco_polo');
    v_new_badges := array_append(v_new_badges, 'marco_polo');
  end if;

  if 'popular' = all(v_existing_badges) = false and v_total_likes >= 50 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'popular');
    v_new_badges := array_append(v_new_badges, 'popular');
  end if;

  if 'influencer' = all(v_existing_badges) = false and v_total_likes >= 500 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'influencer');
    v_new_badges := array_append(v_new_badges, 'influencer');
  end if;

  if 'social_butterfly' = all(v_existing_badges) = false and v_followers >= 50 then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'social_butterfly');
    v_new_badges := array_append(v_new_badges, 'social_butterfly');
  end if;

  -- Return new badges
  return query select unnest(v_new_badges);
end;
$$;

grant execute on function public.check_and_award_badges(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. MATCH_TRAVEL_BUDDIES function
--    Finds users with similar travel interests.
--    Matches based on:
--      - Overlapping destinations
--      - Similar travel style
--      - Active publishing schedule
--
--    Returns top 10 matching users with match score.
-- ------------------------------------------------------------
create or replace function public.match_travel_buddies(
  p_user_id uuid,
  p_limit int default 10,
  p_min_score float default 0.1
)
returns setof record (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  travel_style text,
  match_score float,
  common_destinations text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with user_data as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.travel_style,
      coalesce(p.stats->>'countries', '0')::int as country_count,
      array_agg(distinct d.destinations) filter (where d.destinations is not null) as user_destinations
    from public.profiles p
    left join public.diaries d on d.author_id = p.id and d.status = 'published'
    where p.id = p_user_id
    group by p.id, p.username, p.display_name, p.avatar_url, p.travel_style
  ),
  candidate_profiles as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.travel_style,
      coalesce(p.stats->>'countries', '0')::int as country_count,
      array_agg(distinct d.destinations) filter (where d.destinations is not null) as user_destinations
    from public.profiles p
    inner join public.diaries d on d.author_id = p.id and d.status = 'published'
    where p.id != p_user_id
      and not exists (
        select 1 from public.follows f
        where f.follower_id = p_user_id and f.following_id = p.id
      )
    group by p.id, p.username, p.display_name, p.avatar_url, p.travel_style
  ),
  scored_matches as (
    select
      c.id as user_id,
      c.username,
      c.display_name,
      c.avatar_url,
      c.travel_style,
      (
        -- Destination overlap score (0-0.5)
        case
          when u.user_destinations is null or c.user_destinations is null then 0
          else
            (array_length(array_intersect(u.user_destinations, c.user_destinations), 1)::float /
             greatest(array_length(u.user_destinations, 1), 1)) * 0.5
        end +
        -- Travel style match (0-0.3)
        case
          when u.travel_style is not null and c.travel_style is not null
               and u.travel_style = c.travel_style then 0.3
          else 0
        end +
        -- Activity score based on country count (0-0.2)
        case
          when c.country_count >= 20 then 0.2
          when c.country_count >= 10 then 0.15
          when c.country_count >= 5 then 0.1
          when c.country_count >= 1 then 0.05
          else 0
        end
      ) as match_score,
      array_intersect(u.user_destinations, c.user_destinations) as common_destinations
    from candidate_profiles c, user_data u
  )
  select
    sm.user_id,
    sm.username,
    sm.display_name,
    sm.avatar_url,
    sm.travel_style,
    sm.match_score,
    sm.common_destinations
  from scored_matches sm
  where sm.match_score >= p_min_score
  order by sm.match_score desc
  limit p_limit;
end;
$$;

grant execute on function public.match_travel_buddies(uuid, int, float) to authenticated;

-- ------------------------------------------------------------
-- 4. Trigger to auto-award badges after diary publish
-- ------------------------------------------------------------
create or replace function public.trg_award_badges_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and old.status != 'published' then
    perform public.check_and_award_badges(new.author_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_badges_on_publish on public.diaries;
create trigger trg_award_badges_on_publish
  after update on public.diaries
  for each row execute function public.trg_award_badges_on_publish();

-- ------------------------------------------------------------
-- 5. Notifications for new badges
-- ------------------------------------------------------------
create or replace function public.notify_badge_awarded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create notification for badge award
  insert into public.notifications (user_id, type, target_id, actor_id)
  values (
    new.user_id,
    'badge',
    new.badge_id,
    new.user_id  -- self-awarded, but actor_id tracks who earned it
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_badge on public.user_badges;
create trigger trg_notify_badge
  after insert on public.user_badges
  for each row execute function public.notify_badge_awarded();
