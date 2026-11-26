-- AYHEM private file library: private per-user storage for images and documents.
-- Additive only: creates a dedicated bucket and policies; does not alter or delete existing data.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ayhem-private-library',
  'ayhem-private-library',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ]::text[]
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ayhem_private_library_owner_read'
  ) then
    create policy ayhem_private_library_owner_read
      on storage.objects for select to authenticated
      using (
        bucket_id = 'ayhem-private-library'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ayhem_private_library_owner_insert'
  ) then
    create policy ayhem_private_library_owner_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'ayhem-private-library'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;
end
$$;
