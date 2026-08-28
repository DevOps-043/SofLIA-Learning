-- Containment for accounts created directly through the public Supabase Auth
-- signup endpoint during the 2026-08-24 incident window.
--
-- The application provisions users with service_role and a protected
-- app_metadata marker. Direct Auth signups must not create a public profile,
-- and email verification is derived from auth.users.email_confirmed_at rather
-- than client-controlled metadata or a hard-coded boolean.

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
  trusted_application_creation boolean;
begin
  trusted_application_creation :=
    coalesce(new.raw_app_meta_data ->> 'migration_source', '') = 'public.users';

  if not trusted_application_creation then
    raise warning
      'Skipped public.users bootstrap for untrusted auth signup %',
      new.id;
    return new;
  end if;

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

  begin
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
      new.email_confirmed_at is not null,
      new.email_confirmed_at
    )
    on conflict (id) do update
    set
      email = coalesce(public.users.email, excluded.email),
      email_verified = excluded.email_verified,
      email_verified_at = excluded.email_verified_at,
      updated_at = now();
  exception
    when others then
      raise warning
        'public.handle_auth_user_created skipped public.users bootstrap for auth user %. SQLSTATE %, message: %',
        new.id,
        sqlstate,
        sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.handle_auth_user_created() from public, anon, authenticated;

-- Correct the application badge from the canonical Auth confirmation state.
update public.users profile
set
  email_verified = auth_user.email_confirmed_at is not null,
  email_verified_at = auth_user.email_confirmed_at,
  updated_at = now()
from auth.users auth_user
where auth_user.id = profile.id;

-- Keep the incident set in a PL/pgSQL variable. Supabase's SQL Editor may
-- execute statements through separate prepared contexts, so a temporary table
-- is not a reliable bridge between the containment statements.
do $contain_incident_accounts$
declare
  incident_account_ids uuid[];
begin
  select coalesce(array_agg(auth_user.id), array[]::uuid[])
  into incident_account_ids
  from auth.users auth_user
  left join public.users profile on profile.id = auth_user.id
  where
    lower(split_part(coalesce(auth_user.email, profile.email, ''), '@', 2)) in (
      'example.com',
      'example.net',
      'example.org',
      'guerrillamail.com',
      'maildrop.cc',
      'mailinator.com',
      'tempmail.com',
      'yopmail.com'
    )
    or (
      auth_user.created_at >= timestamptz '2026-08-24 00:00:00+00'
      and coalesce(auth_user.raw_app_meta_data ->> 'migration_source', '') <> 'public.users'
    );

  -- Quarantine is reversible and preserves evidence. Do not delete accounts
  -- until the incident owner completes the forensic review.
  update public.users
  set
    is_banned = true,
    banned_at = now(),
    ban_reason = 'SECURITY_INCIDENT_UNVERIFIED_ACCOUNT',
    email_verified = false,
    email_verified_at = null,
    updated_at = now()
  where id = any(incident_account_ids);

  -- Enforce the quarantine in GoTrue as well. An application-only ban would
  -- still allow a direct password grant against the public Auth endpoint to
  -- mint a fresh JWT and reach any authenticated Data API policy.
  update auth.users
  set
    banned_until = timestamptz '9999-12-31 23:59:59+00',
    updated_at = now()
  where id = any(incident_account_ids);

  delete from public.password_reset_tokens
  where user_id = any(incident_account_ids);

  delete from public.refresh_tokens
  where user_id = any(incident_account_ids);

  delete from public.user_session
  where user_id = any(incident_account_ids);

  delete from auth.sessions
  where user_id = any(incident_account_ids);
end;
$contain_incident_accounts$;

commit;
