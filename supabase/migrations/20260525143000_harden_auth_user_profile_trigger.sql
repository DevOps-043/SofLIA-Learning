-- =============================================================================
-- Migration: harden_auth_user_profile_trigger
-- Purpose:   Keep auth.users creation independent from profile uniqueness
--            conflicts. The application provisioning service owns the full
--            public.users profile write and rollback flow.
-- =============================================================================

begin;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  fallback_username text;
  candidate_username text;
  suffix integer := 0;
  safe_email text := null;
begin
  fallback_username := 'u_' || substring(replace(new.id::text, '-', '') from 1 for 16);
  candidate_username := fallback_username;

  while exists (
    select 1
    from public.users
    where username = candidate_username
      and id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate_username :=
      substring(fallback_username from 1 for greatest(1, 20 - length('_' || suffix::text))) ||
      '_' ||
      suffix::text;
  end loop;

  if new.email is not null
    and lower(new.email) ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
    and not exists (
      select 1
      from public.users
      where lower(email) = lower(new.email)
        and id <> new.id
    ) then
    safe_email := lower(new.email);
  end if;

  insert into public.users (
    id,
    email,
    username,
    email_verified,
    email_verified_at
  )
  values (
    new.id,
    safe_email,
    candidate_username,
    true,
    now()
  )
  on conflict (id) do update
  set
    email = coalesce(public.users.email, excluded.email),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_auth_user_created();

comment on function public.handle_auth_user_created() is
  'Creates only a minimal conflict-safe public.users profile. Full profile provisioning is handled server-side after auth.users creation.';

commit;
