-- ============================================================
-- Fix #1a: Hardened get_user_map_locations
-- SECURITY: Added auth.uid() check inside security definer function.
--           Prevents authenticated users from reading other users' private location data.
-- ============================================================
create or replace function get_user_map_locations(p_user_id uuid)
returns table (
  id        uuid,
  diary_id  uuid,
  diary_title text,
  name      text,
  country   text,
  city      text,
  lat       double precision,
  lng       double precision
)
language sql
security definer
search_path = public
set search_path = public
as $$
  select
    dl.id,
    dl.diary_id,
    d.title     as diary_title,
    dl.name,
    dl.country,
    dl.city,
    ST_Y(dl.coordinates::geometry) as lat,
    ST_X(dl.coordinates::geometry) as lng
  from diary_locations dl
  join diaries d on d.id = dl.diary_id
  where d.author_id = p_user_id
    and p_user_id = auth.uid()   -- CRITICAL: must match the calling authenticated user
    and dl.coordinates is not null;
$$;

-- ============================================================
-- Fix #1b: Hardened insert_diary_location
-- SECURITY: Added ownership checks to prevent inserting locations
--           into diaries that don't belong to the caller.
-- ============================================================
create or replace function insert_diary_location(
  p_diary_id uuid,
  p_day_id uuid,
  p_name text,
  p_lat double precision,
  p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  -- Verify the diary exists and belongs to the caller
  select author_id into v_author_id
  from diaries
  where id = p_diary_id;

  if v_author_id is null then
    raise exception 'Diary not found';
  end if;

  if v_author_id != auth.uid() then
    raise exception 'You do not own this diary';
  end if;

  -- Insert location
  insert into diary_locations (diary_id, day_id, name, coordinates)
  values (
    p_diary_id,
    p_day_id,
    p_name,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  );
end;
$$;

-- ============================================================
-- Fix #5: Add database CHECK constraint on comments.content
-- Prevents abuse even if client-side validation is bypassed.
-- ============================================================
ALTER TABLE comments ADD CONSTRAINT comments_content_length
  CHECK (char_length(content) >= 1 AND char_length(content) <= 2000);

-- Fix #5b: Prevent self-follow to avoid gaming follower count
-- (add to follows table if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_no_self_follow'
  ) THEN
    ALTER TABLE follows ADD CONSTRAINT follows_no_self_follow
      CHECK (follower_id != following_id);
  END IF;
END $$;
