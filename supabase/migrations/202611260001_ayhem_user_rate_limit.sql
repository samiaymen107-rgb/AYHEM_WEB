-- AYHEM per-user request limiter (DRAFT).
-- This file is intentionally NOT applied to any Supabase project.
-- Identity is derived only from auth.uid(); callers cannot choose another user's bucket.

create table if not exists public.ayhem_rate_limit_windows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.ayhem_rate_limit_windows enable row level security;
revoke all on table public.ayhem_rate_limit_windows from anon, authenticated, public;

create or replace function public.ayhem_consume_rate_limit(
  p_limit integer default 20,
  p_window_seconds integer default 60
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 120
     or p_window_seconds is null or p_window_seconds < 10 or p_window_seconds > 3600 then
    raise exception 'invalid_rate_limit_configuration' using errcode = '22023';
  end if;

  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.ayhem_rate_limit_windows as current_window
    (user_id, window_start, request_count, updated_at)
  values
    (v_user_id, v_window_start, 1, v_now)
  on conflict (user_id) do update
    set window_start = excluded.window_start,
        request_count = case
          when current_window.window_start = excluded.window_start
            then least(current_window.request_count + 1, p_limit + 1)
          else 1
        end,
        updated_at = excluded.updated_at
  returning current_window.request_count
  into v_count;

  return query
    select
      v_count <= p_limit,
      greatest(p_limit - v_count, 0),
      v_window_start + pg_catalog.make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.ayhem_consume_rate_limit(integer, integer) from public, anon;
grant execute on function public.ayhem_consume_rate_limit(integer, integer) to authenticated;

comment on table public.ayhem_rate_limit_windows is
  'AYHEM per-user fixed-window request counters; private to the security-definer RPC.';
comment on function public.ayhem_consume_rate_limit(integer, integer) is
  'Atomically consumes one request for auth.uid(); defaults to 20 requests per 60 seconds.';
