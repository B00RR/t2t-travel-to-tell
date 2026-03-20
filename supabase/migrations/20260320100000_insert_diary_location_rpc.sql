-- RPC to insert a diary location with lat/lng coordinates
-- Needed because Supabase REST API cannot directly insert geography(Point) values
create or replace function insert_diary_location(
  p_diary_id uuid,
  p_day_id uuid,
  p_name text,
  p_lat double precision,
  p_lng double precision
)
returns void
language sql
security definer
as $$
  insert into diary_locations (diary_id, day_id, name, coordinates)
  values (
    p_diary_id,
    p_day_id,
    p_name,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  );
$$;
