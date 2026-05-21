-- =============================================================================
-- Migration: auth_session_management_helpers
-- Purpose:   Provide server-only helpers for the Supabase Auth migration.
-- =============================================================================

begin;

create or replace function public.revoke_auth_sessions(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = auth, public, pg_temp
as $$
declare
  deleted_count integer := 0;
begin
  if target_user_id is null then
    return 0;
  end if;

  if to_regclass('auth.sessions') is null then
    return 0;
  end if;

  delete from auth.sessions
  where user_id = target_user_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.revoke_auth_sessions(uuid) from public;
grant execute on function public.revoke_auth_sessions(uuid) to service_role;

comment on function public.revoke_auth_sessions(uuid) is
  'Server-only helper used during Supabase Auth migration to revoke native Auth sessions by user id.';

commit;
