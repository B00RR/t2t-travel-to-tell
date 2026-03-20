-- RPC to retrieve a user's diary locations with lat/lng extracted from PostGIS geography column.
-- The native geography(Point,4326) type is not directly usable by the JS client,
-- so this function returns flat lat/lng doubles alongside diary metadata.

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
    and dl.coordinates is not null;
$$;
