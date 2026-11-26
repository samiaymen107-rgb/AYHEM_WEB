\set ON_ERROR_STOP on

-- Ephemeral PostgreSQL harness only. This runs in a disposable GitHub Actions service,
-- never against the user's Supabase project.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

\ir ../migrations/202611260001_ayhem_user_rate_limit.sql

INSERT INTO auth.users (id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');

-- Verify schema/function privileges and that the function accepts no caller-supplied policy.
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.ayhem_rate_limit_windows'::regclass) THEN
    RAISE EXCEPTION 'rate-limit table must have RLS enabled';
  END IF;
  IF has_table_privilege('authenticated', 'public.ayhem_rate_limit_windows', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated role must not read quota rows directly';
  END IF;
  IF has_table_privilege('anon', 'public.ayhem_rate_limit_windows', 'SELECT') THEN
    RAISE EXCEPTION 'anon role must not read quota rows directly';
  END IF;
  IF has_function_privilege('anon', 'public.ayhem_consume_rate_limit()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon role must not execute quota RPC';
  END IF;
  IF to_regprocedure('public.ayhem_consume_rate_limit(integer,integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'quota RPC must not accept caller-controlled policy parameters';
  END IF;
END;
$$;

-- The authenticated role can consume only its own fixed quota.
SET ROLE authenticated;
DO $$
DECLARE
  v_result record;
  v_i integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  FOR v_i IN 1..20 LOOP
    SELECT * INTO v_result FROM public.ayhem_consume_rate_limit();
    IF v_result.allowed IS DISTINCT FROM true OR v_result.remaining <> 20 - v_i THEN
      RAISE EXCEPTION 'request % should be allowed with % remaining', v_i, 20 - v_i;
    END IF;
  END LOOP;

  SELECT * INTO v_result FROM public.ayhem_consume_rate_limit();
  IF v_result.allowed IS DISTINCT FROM false OR v_result.remaining <> 0 THEN
    RAISE EXCEPTION 'request 21 must be denied';
  END IF;

  -- Further denied calls must not grow the stored counter beyond limit + 1.
  FOR v_i IN 1..5 LOOP
    SELECT * INTO v_result FROM public.ayhem_consume_rate_limit();
    IF v_result.allowed IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'requests after the limit must remain denied';
    END IF;
  END LOOP;

  -- A second Auth identity receives an independent allowance.
  PERFORM set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  SELECT * INTO v_result FROM public.ayhem_consume_rate_limit();
  IF v_result.allowed IS DISTINCT FROM true OR v_result.remaining <> 19 THEN
    RAISE EXCEPTION 'a second user must receive an independent quota';
  END IF;

  -- Missing identity must fail closed.
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM * FROM public.ayhem_consume_rate_limit();
    RAISE EXCEPTION 'missing Auth identity must be rejected';
  EXCEPTION WHEN SQLSTATE '28000' THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

-- Anonymous callers cannot invoke the SECURITY DEFINER RPC.
SET ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM * FROM public.ayhem_consume_rate_limit();
    RAISE EXCEPTION 'anon unexpectedly executed quota RPC';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

-- Verify the counter is bounded even after repeated denied requests.
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT request_count INTO v_count
  FROM public.ayhem_rate_limit_windows
  WHERE user_id = '11111111-1111-4111-8111-111111111111';
  IF v_count <> 21 THEN
    RAISE EXCEPTION 'counter should saturate at 21, got %', v_count;
  END IF;
END;
$$;


-- An expired fixed window resets cleanly without waiting in real time.
UPDATE public.ayhem_rate_limit_windows
SET window_start = window_start - interval '120 seconds', request_count = 21
WHERE user_id = '22222222-2222-4222-8222-222222222222';

SET ROLE authenticated;
DO $
DECLARE
  v_result record;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  SELECT * INTO v_result FROM public.ayhem_consume_rate_limit();
  IF v_result.allowed IS DISTINCT FROM true OR v_result.remaining <> 19 THEN
    RAISE EXCEPTION 'expired window must reset to a fresh allowance';
  END IF;
END;
$;
RESET ROLE;

SELECT 'AYHEM rate-limit PostgreSQL integration checks passed' AS result;
