-- =============================================================================
-- Migration: supabase_auth_uuid_bridge
-- Purpose:   Prepare public.users to be an application profile table keyed by
--            auth.users.id while preserving legacy UUIDs.
--
-- Apply order:
-- 1. Run the legacy user audit/import script first in staging.
-- 2. Confirm auth.users.id = public.users.id for imported users.
-- 3. Apply this migration.
-- 4. Validate the FK in a later cutover migration once production import is done.
-- =============================================================================

begin;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_username text;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    'u_' || substring(replace(new.id::text, '-', '') from 1 for 16)
  );

  insert into public.users (
    id,
    email,
    username,
    first_name,
    last_name,
    display_name,
    profile_picture_url,
    email_verified,
    email_verified_at
  )
  values (
    new.id,
    lower(new.email),
    base_username,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'profile_picture_url', ''),
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    ),
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_fkey
      foreign key (id)
      references auth.users(id)
      on delete cascade
      not valid;
  end if;
end $$;

create index if not exists users_email_lower_idx
  on public.users (lower(email))
  where email is not null;

alter table public.users enable row level security;
alter table public.users force row level security;

drop policy if exists users_select_authenticated on public.users;
-- Transitional compatibility policy: many existing screens still resolve user
-- names/avatars across an organization. Tighten this in the next RLS wave once
-- those reads are routed through membership-aware views or RPCs.
create policy users_select_authenticated
  on public.users
  for select
  to authenticated
  using (true);

drop policy if exists users_update_own_profile on public.users;
create policy users_update_own_profile
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists users_service_role_all on public.users;
create policy users_service_role_all
  on public.users
  for all
  to service_role
  using (true)
  with check (true);

comment on constraint users_auth_user_fkey on public.users is
  'NOT VALID during migration. Validate only after every public.users.id exists in auth.users.id.';

comment on table public.users is
  'Application profile table. Authentication credentials and provider identities live in Supabase Auth.';

commit;
