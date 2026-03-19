-- Function to securely search diaries without PostgREST injection risk
create or replace function public.search_diaries(search_query text)
returns setof public.diaries
language sql
security definer
as $$
  select *
  from public.diaries
  where title ilike '%' || search_query || '%'
     or description ilike '%' || search_query || '%'
     or search_query = any(destinations);
$$;
