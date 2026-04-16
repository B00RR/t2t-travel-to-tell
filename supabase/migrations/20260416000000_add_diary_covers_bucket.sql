-- Add storage bucket for diary cover images.
-- The bucket was referenced in the app (create.tsx) but never created in migrations.

insert into storage.buckets (id, name, public)
values ('diary-covers', 'diary-covers', true)
on conflict (id) do nothing;

create policy "Diary covers are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'diary-covers');

create policy "Users can upload their own diary covers"
  on storage.objects for insert
  with check (
    bucket_id = 'diary-covers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own diary covers"
  on storage.objects for update
  using (
    auth.uid() = owner
    and bucket_id = 'diary-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own diary covers"
  on storage.objects for delete
  using (
    auth.uid() = owner
    and bucket_id = 'diary-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
