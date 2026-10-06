begin;

-- Server-only counters: the private schema is not exposed by the Data API.
create schema if not exists private;
create table private.distributed_rate_limits (
  bucket_key text primary key check (length(bucket_key) between 1 and 160),
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null
);
create index distributed_rate_limits_reset_at_idx
  on private.distributed_rate_limits (reset_at);
alter table private.distributed_rate_limits enable row level security;
revoke all on private.distributed_rate_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.distributed_rate_limits to service_role;

-- INVOKER + service_role-only EXECUTE; browser clients cannot consume or reset
-- counters. The ON CONFLICT row lock makes increments atomic across instances.
create function public.check_distributed_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns table (request_count integer, reset_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
begin
  if p_key is null or length(p_key) not between 1 and 160
    or p_limit is null or p_limit not between 1 and 10000
    or p_window_ms is null or p_window_ms not between 1 and 86400000 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;

  return query
  insert into private.distributed_rate_limits as bucket (bucket_key, request_count, reset_at)
  values (p_key, 1, v_now + p_window_ms * interval '1 millisecond')
  on conflict (bucket_key) do update
  set request_count = case when bucket.reset_at <= v_now then 1
    else least(bucket.request_count + 1, p_limit + 1) end,
    reset_at = case when bucket.reset_at <= v_now
      then v_now + p_window_ms * interval '1 millisecond' else bucket.reset_at end
  returning bucket.request_count, bucket.reset_at;

  -- Bound cleanup work and retention without requiring pg_cron. SKIP LOCKED
  -- prevents cleanup from waiting on a counter being used by another request.
  if random() < 0.01 then
    delete from private.distributed_rate_limits
    where bucket_key in (
      select expired.bucket_key from private.distributed_rate_limits as expired
      where expired.reset_at < v_now - interval '1 day'
      order by expired.reset_at limit 1000 for update skip locked
    );
  end if;
end;
$$;
revoke all on function public.check_distributed_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_distributed_rate_limit(text, integer, integer)
  to service_role;

commit;
