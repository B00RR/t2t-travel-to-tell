-- ============================================================
-- Collaborative Diaries
-- Allows a diary owner to invite other users as collaborators.
-- Collaborators can add days and their own entries; owner keeps
-- administrative control.
-- ============================================================

-- 1. Ensure notifications table exists (defensive — table is
--    already referenced by the app and present in the generated
--    TypeScript types, but not in migrations).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  target_id uuid not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) then
    create policy "notifications_select_own" on public.notifications
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_update_own'
  ) then
    create policy "notifications_update_own" on public.notifications
      for update using (auth.uid() = user_id);
  end if;
end $$;

-- 2. diary_collaborators table
create table public.diary_collaborators (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diaries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'removed')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (diary_id, user_id)
);

create index idx_diary_collaborators_user on public.diary_collaborators(user_id, status);
create index idx_diary_collaborators_diary on public.diary_collaborators(diary_id, status);

-- 3. Add author_id to day_entries (backfill with diary owner for existing rows)
alter table public.day_entries
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

update public.day_entries de
set author_id = d.author_id
from public.diary_days dd
join public.diaries d on d.id = dd.diary_id
where de.day_id = dd.id and de.author_id is null;

create index if not exists idx_day_entries_author on public.day_entries(author_id);

-- 4. Max 10 accepted collaborators per diary
create or replace function public.check_collaborator_limit()
returns trigger
language plpgsql
security invoker
as $$
begin
  if NEW.status = 'accepted' and (
    select count(*) from public.diary_collaborators
    where diary_id = NEW.diary_id
      and status = 'accepted'
      and id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 10 then
    raise exception 'Max 10 collaborators per diary';
  end if;
  return NEW;
end;
$$;

create trigger trg_collab_limit
  before insert or update on public.diary_collaborators
  for each row execute function public.check_collaborator_limit();

-- 5. RLS on diary_collaborators
alter table public.diary_collaborators enable row level security;

-- Visible to: diary owner + invited user
create policy "collab_select" on public.diary_collaborators
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.diaries
      where id = diary_collaborators.diary_id and author_id = auth.uid()
    )
  );

-- Only owner can create invitations
create policy "collab_insert" on public.diary_collaborators
  for insert with check (
    auth.uid() = invited_by
    and exists (
      select 1 from public.diaries
      where id = diary_collaborators.diary_id and author_id = auth.uid()
    )
  );

-- Owner can remove; invited user can accept/decline/leave
create policy "collab_update" on public.diary_collaborators
  for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.diaries
      where id = diary_collaborators.diary_id and author_id = auth.uid()
    )
  );

create policy "collab_delete" on public.diary_collaborators
  for delete using (
    exists (
      select 1 from public.diaries
      where id = diary_collaborators.diary_id and author_id = auth.uid()
    )
  );

-- 6. Allow collaborators to view diaries they were invited to (accepted)
create policy "Collaborators can view invited diaries" on public.diaries
  for select using (
    exists (
      select 1 from public.diary_collaborators
      where diary_id = diaries.id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

-- 7. Replace day_entries "manage own" policy with role-aware ones
drop policy if exists "Users can manage their own day entries" on public.day_entries;

create policy "entries_insert" on public.day_entries
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.diary_days dd
      join public.diaries d on d.id = dd.diary_id
      where dd.id = day_entries.day_id
        and (
          d.author_id = auth.uid()
          or exists (
            select 1 from public.diary_collaborators dc
            where dc.diary_id = d.id
              and dc.user_id = auth.uid()
              and dc.status = 'accepted'
          )
        )
    )
  );

-- Update/delete: the entry's own author, or the diary owner
create policy "entries_update" on public.day_entries
  for update using (
    auth.uid() = author_id
    or exists (
      select 1 from public.diary_days dd
      join public.diaries d on d.id = dd.diary_id
      where dd.id = day_entries.day_id and d.author_id = auth.uid()
    )
  );

create policy "entries_delete" on public.day_entries
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.diary_days dd
      join public.diaries d on d.id = dd.diary_id
      where dd.id = day_entries.day_id and d.author_id = auth.uid()
    )
  );

-- Collaborators can view entries of diaries they are part of
create policy "entries_select_collab" on public.day_entries
  for select using (
    exists (
      select 1 from public.diary_days dd
      join public.diary_collaborators dc on dc.diary_id = dd.diary_id
      where dd.id = day_entries.day_id
        and dc.user_id = auth.uid()
        and dc.status = 'accepted'
    )
  );

-- 8. Replace diary_days "manage own" policy with role-aware ones
drop policy if exists "Users can manage their own diary days" on public.diary_days;

create policy "days_insert" on public.diary_days
  for insert with check (
    exists (
      select 1 from public.diaries
      where id = diary_days.diary_id and author_id = auth.uid()
    )
    or exists (
      select 1 from public.diary_collaborators
      where diary_id = diary_days.diary_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

create policy "days_update" on public.diary_days
  for update using (
    exists (
      select 1 from public.diaries
      where id = diary_days.diary_id and author_id = auth.uid()
    )
    or exists (
      select 1 from public.diary_collaborators
      where diary_id = diary_days.diary_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

create policy "days_delete" on public.diary_days
  for delete using (
    exists (
      select 1 from public.diaries
      where id = diary_days.diary_id and author_id = auth.uid()
    )
  );

-- Collaborators can view days of diaries they are part of
create policy "days_select_collab" on public.diary_days
  for select using (
    exists (
      select 1 from public.diary_collaborators
      where diary_id = diary_days.diary_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

-- 9. RPC: invite a collaborator (owner only)
create or replace function public.invite_diary_collaborator(
  p_diary_id uuid,
  p_username text
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_user_id uuid;
  v_collab_id uuid;
begin
  -- Authorize: caller must be the diary owner
  if not exists (
    select 1 from public.diaries
    where id = p_diary_id and author_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  -- Resolve username → profile id
  select id into v_user_id
  from public.profiles
  where username = p_username;

  if v_user_id is null then
    raise exception 'User not found';
  end if;

  if v_user_id = auth.uid() then
    raise exception 'Cannot invite yourself';
  end if;

  -- Insert or reset invitation
  insert into public.diary_collaborators (diary_id, user_id, invited_by, status)
  values (p_diary_id, v_user_id, auth.uid(), 'pending')
  on conflict (diary_id, user_id) do update
    set status = 'pending',
        invited_at = now(),
        responded_at = null,
        invited_by = excluded.invited_by
  returning id into v_collab_id;

  -- Notify the invited user
  insert into public.notifications (user_id, actor_id, type, target_id)
  values (v_user_id, auth.uid(), 'diary_invitation', p_diary_id);

  return v_collab_id;
end;
$$;

-- 10. RPC: respond to invitation (accept or decline)
create or replace function public.respond_diary_invitation(
  p_collab_id uuid,
  p_accept boolean
) returns void
language plpgsql
security invoker
as $$
begin
  update public.diary_collaborators
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = p_collab_id
    and user_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'Invitation not found';
  end if;
end;
$$;

grant execute on function public.invite_diary_collaborator(uuid, text) to authenticated;
grant execute on function public.respond_diary_invitation(uuid, boolean) to authenticated;
