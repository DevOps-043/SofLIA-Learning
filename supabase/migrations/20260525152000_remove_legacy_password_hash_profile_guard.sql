-- =============================================================================
-- Migration: remove_legacy_password_hash_profile_guard
-- Purpose:   public.users is now an application profile table. New accounts are
--            authenticated by Supabase Auth, so legacy password_hash guards must
--            not reject inserts or updates with password_hash = null.
-- =============================================================================

begin;

alter table public.users
  alter column password_hash drop not null;

do $$
declare
  legacy_trigger record;
begin
  for legacy_trigger in
    select
      trigger_to_drop.tgname as trigger_name
    from pg_trigger trigger_to_drop
    join pg_proc trigger_function
      on trigger_function.oid = trigger_to_drop.tgfoid
    where trigger_to_drop.tgrelid = 'public.users'::regclass
      and not trigger_to_drop.tgisinternal
      and pg_get_functiondef(trigger_function.oid) ilike '%password_hash%'
      and (
        pg_get_functiondef(trigger_function.oid) ilike '%no puede ser null%'
        or pg_get_functiondef(trigger_function.oid) ilike '%raise exception%'
      )
  loop
    execute format(
      'drop trigger if exists %I on public.users',
      legacy_trigger.trigger_name
    );

    raise notice
      'Dropped legacy public.users trigger % because it enforced password_hash during profile writes.',
      legacy_trigger.trigger_name;
  end loop;
end $$;

comment on column public.users.password_hash is
  'Legacy credential hash. New accounts use Supabase Auth and must leave this column null.';

commit;
