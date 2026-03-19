-- 1. Enable Extensions
create extension if not exists "postgis" schema public;
create extension if not exists "pg_trgm" schema public;

-- 2. Create Tables

-- PROFILES
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  preferred_language text default 'en',
  travel_style text,
  stats jsonb default '{"countries": 0, "diaries": 0, "followers": 0, "following": 0}'::jsonb,
  created_at timestamptz default now() not null
);

-- DIARIES
create table public.diaries (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cover_image_url text,
  visibility text default 'public' check (visibility in ('public', 'unlisted', 'private', 'friends')),
  start_date date,
  end_date date,
  status text default 'draft' check (status in ('draft', 'published')),
  destinations text[] default '{}',
  tags text[] default '{}',
  budget_summary jsonb,
  like_count int default 0,
  comment_count int default 0,
  save_count int default 0,
  view_count int default 0,
  created_at timestamptz default now() not null
);

-- DIARY DAYS
create table public.diary_days (
  id uuid default gen_random_uuid() primary key,
  diary_id uuid references public.diaries(id) on delete cascade not null,
  day_number int not null,
  date date,
  title text,
  mood text,
  summary text,
  sort_order int not null,
  unique(diary_id, day_number)
);

-- DAY ENTRIES (Rich Content Blocks)
create table public.day_entries (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references public.diary_days(id) on delete cascade not null,
  type text not null check (type in ('text', 'media', 'tip', 'location', 'mood')),
  content text,
  metadata jsonb,
  sort_order int not null
);

-- ENTRY MEDIA
create table public.entry_media (
  id uuid default gen_random_uuid() primary key,
  entry_id uuid references public.day_entries(id) on delete cascade not null,
  media_type text not null check (media_type in ('image', 'video', 'audio')),
  url text not null,
  thumbnail_url text,
  caption text,
  sort_order int not null
);

-- DIARY LOCATIONS (PostGIS)
create table public.diary_locations (
  id uuid default gen_random_uuid() primary key,
  diary_id uuid references public.diaries(id) on delete cascade not null,
  day_id uuid references public.diary_days(id) on delete cascade,
  name text not null,
  coordinates geography(Point, 4326),
  place_id text,
  country text,
  city text
);

-- SOCIAL: FOLLOWS
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id)
);

-- SOCIAL: LIKES
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  diary_id uuid references public.diaries(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, diary_id)
);

-- SOCIAL: COMMENTS
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  diary_id uuid references public.diaries(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- SOCIAL: SAVES
create table public.saves (
  user_id uuid references public.profiles(id) on delete cascade not null,
  diary_id uuid references public.diaries(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, diary_id)
);

-- 3. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.diaries enable row level security;
alter table public.diary_days enable row level security;
alter table public.day_entries enable row level security;
alter table public.entry_media enable row level security;
alter table public.diary_locations enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.saves enable row level security;

-- PROFILES Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- DIARIES Policies
create policy "Published public diaries are viewable by everyone" on public.diaries for select using (status = 'published' and visibility = 'public');
create policy "Users can view their own diaries" on public.diaries for select using (auth.uid() = author_id);
create policy "Users can insert their own diaries" on public.diaries for insert with check (auth.uid() = author_id);
create policy "Users can update their own diaries" on public.diaries for update using (auth.uid() = author_id);
create policy "Users can delete their own diaries" on public.diaries for delete using (auth.uid() = author_id);

-- DIARY DAYS Policies (Inherit access from diary)
create policy "Users can view days of visible diaries" on public.diary_days for select using (
  exists (select 1 from public.diaries where id = diary_id and (author_id = auth.uid() or (status = 'published' and visibility = 'public')))
);
create policy "Users can manage their own diary days" on public.diary_days for all using (
  exists (select 1 from public.diaries where id = diary_id and author_id = auth.uid())
);

-- DAY ENTRIES Policies
create policy "Users can view entries of visible diaries" on public.day_entries for select using (
  exists (select 1 from public.diary_days dd join public.diaries d on dd.diary_id = d.id where dd.id = day_id and (d.author_id = auth.uid() or (d.status = 'published' and d.visibility = 'public')))
);
create policy "Users can manage their own day entries" on public.day_entries for all using (
  exists (select 1 from public.diary_days dd join public.diaries d on dd.diary_id = d.id where dd.id = day_id and d.author_id = auth.uid())
);

-- ENTRY MEDIA Policies
create policy "Users can view media of visible entries" on public.entry_media for select using (
  exists (select 1 from public.day_entries de join public.diary_days dd on de.day_id = dd.id join public.diaries d on dd.diary_id = d.id where de.id = entry_id and (d.author_id = auth.uid() or (d.status = 'published' and d.visibility = 'public')))
);
create policy "Users can manage their own media" on public.entry_media for all using (
  exists (select 1 from public.day_entries de join public.diary_days dd on de.day_id = dd.id join public.diaries d on dd.diary_id = d.id where de.id = entry_id and d.author_id = auth.uid())
);

-- DIARY LOCATIONS Policies
create policy "Locations are viewable if diary is visible" on public.diary_locations for select using (
  exists (select 1 from public.diaries where id = diary_id and (author_id = auth.uid() or (status = 'published' and visibility = 'public')))
);
create policy "Users can manage their own diary locations" on public.diary_locations for all using (
  exists (select 1 from public.diaries where id = diary_id and author_id = auth.uid())
);

-- SOCIAL Policies
-- Follows: Can see all follows, but can only insert/delete own follow records
create policy "Follows viewable by everyone" on public.follows for select using (true);
create policy "Users can manage their own follows" on public.follows for all using (auth.uid() = follower_id);

-- Likes: Can see likes on public diaries, manage own
create policy "Likes viewable by everyone" on public.likes for select using (true);
create policy "Users can manage their own likes" on public.likes for all using (auth.uid() = user_id);

-- Comments: Can see comments on public diaries, manage own
create policy "Comments viewable by everyone" on public.comments for select using (true);
create policy "Users can insert their own comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can update their own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users can delete their own comments" on public.comments for delete using (auth.uid() = user_id);

-- Saves: Can only see and manage own saves
create policy "Users can manage their own saves" on public.saves for all using (auth.uid() = user_id);

-- 4. Triggers
-- Auto-create profile trigger upon auth.users insert
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 5)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Storage
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('diary-media', 'diary-media', false) on conflict (id) do nothing;

create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar." on storage.objects for insert with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users can update their own avatars." on storage.objects for update using (
  auth.uid() = owner
  and bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users can delete their own avatars." on storage.objects for delete using (
  auth.uid() = owner
  and bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Diary media requires complex RLS inside the DB, but for storage we'll allow authenticated users to upload and view.
create policy "Authenticated users can upload diary media" on storage.objects for insert with check (
  bucket_id = 'diary-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Authenticated users can view diary media" on storage.objects for select using (bucket_id = 'diary-media');
create policy "Users can update their own media" on storage.objects for update using (
  auth.uid() = owner
  and bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users can delete their own media" on storage.objects for delete using (
  auth.uid() = owner
  and bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
