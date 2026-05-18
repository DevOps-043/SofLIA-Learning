-- Task 4.1: load-test DB connection snapshot for Supavisor validation.
-- This function is intended for service-role load-test tooling only.

create or replace function public.load_test_connection_snapshot()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select jsonb_build_object(
    'captured_at', now(),
    'database', current_database(),
    'active_connections', count(*) filter (where state = 'active'),
    'idle_connections', count(*) filter (where state = 'idle'),
    'total_connections', count(*),
    'max_connections_setting', current_setting('max_connections', true)
  )
  from pg_stat_activity
  where datname = current_database();
$$;

revoke all on function public.load_test_connection_snapshot() from public;
grant execute on function public.load_test_connection_snapshot() to service_role;
