\set ON_ERROR_STOP on

-- Disposable Storage-compatible schema for the private file-library migration.
-- This is a CI-only harness, not the production Supabase database.
CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean NOT NULL DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  name text NOT NULL
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT ON storage.objects TO authenticated;
CREATE FUNCTION storage.foldername(object_name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$ SELECT string_to_array(object_name, '/') $$;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO authenticated;

\ir ../migrations/202611260002_ayhem_private_file_library.sql

DO $$
DECLARE
  bucket storage.buckets%ROWTYPE;
  policy_count integer;
BEGIN
  SELECT * INTO bucket FROM storage.buckets WHERE id = 'ayhem-private-library';
  IF NOT FOUND THEN RAISE EXCEPTION 'private AYHEM bucket was not created'; END IF;
  IF bucket.public IS DISTINCT FROM false THEN RAISE EXCEPTION 'AYHEM file bucket must be private'; END IF;
  IF bucket.file_size_limit <> 10485760 THEN RAISE EXCEPTION 'AYHEM file bucket must enforce 10 MiB limit'; END IF;
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname IN ('ayhem_private_library_owner_read','ayhem_private_library_owner_insert');
  IF policy_count <> 2 THEN RAISE EXCEPTION 'expected exactly two owner-scoped Storage policies, got %', policy_count; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'ayhem_private_library_%'
      AND cmd IN ('DELETE','UPDATE','ALL')
  ) THEN RAISE EXCEPTION 'file library must not enable delete or overwrite'; END IF;
END;
$$;

-- User A can create and read an object only in their own UUID folder.
SET ROLE authenticated;
DO $$
DECLARE
  own_id uuid := '11111111-1111-4111-8111-111111111111';
  foreign_id uuid := '22222222-2222-4222-8222-222222222222';
  visible_count integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', own_id::text, true);
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('ayhem-private-library', own_id::text || '/own-file.pdf');
  SELECT count(*) INTO visible_count FROM storage.objects;
  IF visible_count <> 1 THEN RAISE EXCEPTION 'owner must see own file'; END IF;

  BEGIN
    INSERT INTO storage.objects (bucket_id, name)
    VALUES ('ayhem-private-library', foreign_id::text || '/foreign-file.pdf');
    RAISE EXCEPTION 'cross-user upload unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub', foreign_id::text, true);
  SELECT count(*) INTO visible_count FROM storage.objects;
  IF visible_count <> 0 THEN RAISE EXCEPTION 'foreign user must not see owner file'; END IF;
END;
$$;
RESET ROLE;

SELECT 'AYHEM private file-library PostgreSQL integration checks passed' AS result;
