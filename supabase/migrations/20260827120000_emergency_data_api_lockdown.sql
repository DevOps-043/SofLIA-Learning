-- Emergency Data API lockdown after the 2026-08-27 access-control audit.
--
-- Security model:
--   * anon has no table privileges unless a table is explicitly public below;
--   * authenticated access requires both a grant and an RLS policy;
--   * credential/session/payment material is service_role-only;
--   * SECURITY DEFINER functions are not executable through PUBLIC/anon by default;
--   * destructive RPCs validate the database caller, not only the HTTP handler.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_platform_administrator(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users
    where id = p_user_id
      and platform_role = 'Administrador'
      and coalesce(is_banned, false) = false
  );
$$;

create or replace function private.can_manage_organization(
  p_organization_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.is_platform_administrator(p_user_id)
    or exists (
      select 1
      from public.organization_users
      where organization_id = p_organization_id
        and user_id = p_user_id
        and status = 'active'
        and role in ('owner', 'admin')
    );
$$;

revoke all on function private.is_platform_administrator(uuid) from public, anon, authenticated;
revoke all on function private.can_manage_organization(uuid, uuid) from public, anon, authenticated;
grant execute on function private.is_platform_administrator(uuid) to authenticated, service_role;
grant execute on function private.can_manage_organization(uuid, uuid) to authenticated, service_role;

-- Every application table in the exposed public schema becomes deny-by-default.
-- Existing authenticated policies are retained and receive only their matching
-- SQL privilege. Tables without policies remain inaccessible unless an owner
-- read policy or explicit public policy is created below.
do $lockdown$
declare
  table_record record;
  policy_command record;
begin
  for table_record in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in ('spatial_ref_sys')
  loop
    execute format('alter table public.%I enable row level security', table_record.tablename);
    execute format('alter table public.%I force row level security', table_record.tablename);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_record.tablename);
    execute format('grant all on table public.%I to service_role', table_record.tablename);

    for policy_command in
      select distinct cmd
      from pg_policies
      where schemaname = 'public'
        and tablename = table_record.tablename
        and ('authenticated' = any(roles) or 'public' = any(roles))
    loop
      if policy_command.cmd = 'SELECT' then
        execute format('grant select on table public.%I to authenticated', table_record.tablename);
      elsif policy_command.cmd = 'INSERT' then
        execute format('grant insert on table public.%I to authenticated', table_record.tablename);
      elsif policy_command.cmd = 'UPDATE' then
        execute format('grant update on table public.%I to authenticated', table_record.tablename);
      elsif policy_command.cmd = 'DELETE' then
        execute format('grant delete on table public.%I to authenticated', table_record.tablename);
      elsif policy_command.cmd = 'ALL' then
        execute format(
          'grant select, insert, update, delete on table public.%I to authenticated',
          table_record.tablename
        );
      end if;
    end loop;
  end loop;
end;
$lockdown$;

-- Views are separate grant-bearing relations and do not appear in pg_tables.
-- Keep them behind authorized server routes: a legacy SECURITY DEFINER view
-- must not become an RLS bypass for browser roles.
do $view_lockdown$
declare
  view_record record;
begin
  for view_record in
    select viewname as relation_name from pg_views where schemaname = 'public'
    union
    select matviewname as relation_name from pg_matviews where schemaname = 'public'
  loop
    execute format(
      'revoke all on table public.%I from public, anon, authenticated',
      view_record.relation_name
    );
    execute format(
      'grant all on table public.%I to service_role',
      view_record.relation_name
    );
  end loop;
end;
$view_lockdown$;

-- Sensitive material never crosses the Data API for browser roles. All access
-- occurs in server-only services after authentication/authorization.
do $credentials$
declare
  sensitive_table text;
begin
  foreach sensitive_table in array array[
    'password_reset_tokens',
    'refresh_tokens',
    'user_session',
    'oauth_accounts',
    'payment_methods',
    'user_invitations',
    'bulk_invite_links',
    'bulk_invite_registrations',
    'notification_email_queue',
    'notification_push_subscriptions',
    'audit_logs',
    'planner_audit_log',
    'activity_logs'
  ]
  loop
    if to_regclass(format('public.%I', sensitive_table)) is not null then
      execute format('revoke all on table public.%I from public, anon, authenticated', sensitive_table);
      execute format('grant all on table public.%I to service_role', sensitive_table);
    end if;
  end loop;
end;
$credentials$;

-- The incident evidence includes live password-reset material. Invalidate all
-- bearer credentials that may have been copied before the ACL fix. This forces
-- a new login/reset after deployment and is intentionally not reversible.
do $invalidate_exposed_credentials$
declare
  credential_table text;
begin
  foreach credential_table in array array[
    'password_reset_tokens',
    'refresh_tokens',
    'user_session'
  ]
  loop
    if to_regclass(format('public.%I', credential_table)) is not null then
      execute format('delete from public.%I', credential_table);
    end if;
  end loop;
end;
$invalidate_exposed_credentials$;

-- Evidence screenshots can contain the user's full screen, identifiers and
-- conversation context. Make that bucket private and remove every browser
-- policy on storage.objects. Public playback continues through buckets marked
-- public; mutations use a short-lived URL issued by an authorized server API.
update storage.buckets
set public = false,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'reportes-screenshots';

-- Certificate PDFs contain user identity and learning-history data. They are
-- downloaded through an ownership-checked API and must never be public objects.
update storage.buckets
set public = false,
    allowed_mime_types = array['application/pdf']
where id = 'certificates';

do $storage_policy_lockdown$
declare
  policy_record record;
begin
  for policy_record in
    select policyname, cmd, roles, qual, with_check
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and ('public' = any(roles) or 'anon' = any(roles) or 'authenticated' = any(roles))
  loop
    execute format('drop policy %I on storage.objects', policy_record.policyname);
  end loop;
end;
$storage_policy_lockdown$;

-- Remove all inherited policies from the user-sensitive relations found in the
-- incident. Rebuilding them explicitly prevents a permissive legacy policy from
-- being OR-combined with the hardened policy below.
do $drop_sensitive_policies$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users',
        'organizations',
        'organization_users',
        'lia_conversations',
        'lia_messages',
        'user_course_enrollments',
        'user_course_certificates'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$drop_sensitive_policies$;

-- User profiles are mutable only by their owner. Reads are limited to the owner
-- or an active organization manager for users in that manager's organization;
-- column grants below still hide credentials, roles and ban/security state.
create policy users_select_own
  on public.users for select to authenticated
  using (id = (select auth.uid()));
create policy users_select_managed_organization
  on public.users for select to authenticated
  using (
    exists (
      select 1
      from public.organization_users target_membership
      where target_membership.user_id = users.id
        and target_membership.status = 'active'
        and private.can_manage_organization(
          target_membership.organization_id,
          (select auth.uid())
        )
    )
  );
create policy users_select_public_instructor
  on public.users for select to anon
  using (
    exists (
      select 1
      from public.courses
      where courses.instructor_id = users.id
        and courses.is_active = true
        and courses.approval_status = 'approved'
    )
  );
create policy users_update_own_profile
  on public.users for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke all on table public.users from authenticated;
grant select (
  id, username, email, first_name, last_name, display_name, bio,
  country_code, date_of_birth, gender, location, phone,
  profile_picture_url, signature_name, signature_url,
  notification_community_updates, notification_course_updates,
  notification_email, notification_marketing, notification_push,
  created_at, updated_at, last_activity_at, last_login_at, platform_role
) on public.users to authenticated;
grant select (
  id, username, first_name, last_name, display_name, profile_picture_url
) on public.users to anon;
grant update (
  username, first_name, last_name, display_name, bio,
  country_code, date_of_birth, gender, location, phone,
  profile_picture_url, signature_name, signature_url,
  notification_community_updates, notification_course_updates,
  notification_email, notification_marketing, notification_push
) on public.users to authenticated;

-- Organization commercial/contact data is never anonymous. Active members may
-- read their organization; only an owner/admin may edit non-billing profile and
-- branding columns. Subscription, capacity and activation fields remain
-- server-only so they cannot be changed with a browser JWT.
create policy organizations_select_member
  on public.organizations for select to authenticated
  using (
    private.is_platform_administrator((select auth.uid()))
    or exists (
      select 1
      from public.organization_users
      where organization_users.organization_id = organizations.id
        and organization_users.user_id = (select auth.uid())
        and organization_users.status = 'active'
    )
  );
create policy organizations_update_manager
  on public.organizations for update to authenticated
  using (private.can_manage_organization(id, (select auth.uid())))
  with check (private.can_manage_organization(id, (select auth.uid())));
revoke all on table public.organizations from authenticated;
grant select on table public.organizations to authenticated;
grant update (
  name, slug, description, contact_email, contact_phone, website_url,
  logo_url, brand_banner_url, brand_color_accent, brand_color_primary,
  brand_color_secondary, brand_favicon_url, brand_font_family,
  brand_logo_url, branding_enabled, company_country, company_mission,
  company_size, company_type, google_login_enabled, industry, login_styles,
  microsoft_login_enabled, panel_styles, selected_theme, show_navbar_name,
  user_dashboard_styles, updated_at
) on public.organizations to authenticated;

-- Membership rows reveal organizational structure. Members see their own row;
-- organization administrators see rows they are explicitly allowed to manage.
create policy organization_users_select_authorized
  on public.organization_users for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.can_manage_organization(organization_id, (select auth.uid()))
  );
revoke all on table public.organization_users from authenticated;
grant select on table public.organization_users to authenticated;

-- LIA transcripts and learning records are user-owned. Writes are mediated by
-- authenticated server routes; browser roles receive read-only owner access.
create policy lia_conversations_select_own
  on public.lia_conversations for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on table public.lia_conversations from authenticated;
grant select on table public.lia_conversations to authenticated;

create policy lia_messages_select_own_conversation
  on public.lia_messages for select to authenticated
  using (
    exists (
      select 1 from public.lia_conversations
      where lia_conversations.conversation_id = lia_messages.conversation_id
        and lia_conversations.user_id = (select auth.uid())
    )
  );
revoke all on table public.lia_messages from authenticated;
grant select on table public.lia_messages to authenticated;

create policy user_course_enrollments_select_own
  on public.user_course_enrollments for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on table public.user_course_enrollments from authenticated;
grant select on table public.user_course_enrollments to authenticated;

create policy user_course_certificates_select_own
  on public.user_course_certificates for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on table public.user_course_certificates from authenticated;
grant select on table public.user_course_certificates to authenticated;

-- Add a conservative owner-read policy to legacy user-owned tables that never
-- received an explicit policy. Writes remain server-mediated. Credential tables
-- above are excluded even when they contain a user_id column.
do $owner_read$
declare
  table_record record;
begin
  for table_record in
    select relation.relname as table_name
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    join pg_catalog.pg_attribute attribute
      on attribute.attrelid = relation.oid
    where namespace.nspname = 'public'
      -- CREATE POLICY is only valid for ordinary and partitioned tables.
      -- information_schema.columns also returns views, which caused the
      -- production lockdown to abort on ai_moderation_pending_review.
      and relation.relkind in ('r', 'p')
      and attribute.attname = 'user_id'
      and attribute.attnum > 0
      and not attribute.attisdropped
      and relation.relname not in (
        'password_reset_tokens',
        'refresh_tokens',
        'user_session',
        'oauth_accounts',
        'payment_methods',
        'user_invitations',
        'bulk_invite_registrations',
        'notification_email_queue',
        'notification_push_subscriptions',
        'audit_logs',
        'planner_audit_log',
        'activity_logs',
        'organization_users'
      )
      and not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = relation.relname
          and cmd in ('SELECT', 'ALL')
          and ('authenticated' = any(roles) or 'public' = any(roles))
      )
  loop
    execute format(
      'create policy security_owner_select on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      table_record.table_name
    );
    execute format('grant select on table public.%I to authenticated', table_record.table_name);
  end loop;
end;
$owner_read$;

-- Public learning catalog. Only approved/published material is readable without
-- a session; drafts, rejected content and internal organization data stay private.
-- PostgreSQL combines permissive policies with OR. Remove every legacy policy
-- on catalog relations before adding the allowlist below; merely adding a
-- restrictive policy would leave an older role-specific `using (true)` policy
-- effective for signed-in users.
do $drop_legacy_public_catalog_policies$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'courses',
        'course_modules',
        'course_lessons',
        'course_skills',
        'skills',
        'categories',
        'course_reviews'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$drop_legacy_public_catalog_policies$;

drop policy if exists courses_public_catalog_select on public.courses;
create policy courses_public_catalog_select
  on public.courses for select to anon, authenticated
  using (is_active = true and approval_status = 'approved');
revoke all on table public.courses from public, anon, authenticated;
grant select (
  id, average_rating, category, created_at, description,
  duration_total_minutes, instructor_id, is_active, learning_objectives,
  level, price, review_count, slug, student_count, thumbnail_url, title,
  updated_at, approval_status, approved_at
) on public.courses to anon, authenticated;

drop policy if exists course_modules_public_catalog_select on public.course_modules;
create policy course_modules_public_catalog_select
  on public.course_modules for select to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1 from public.courses
      where courses.id = course_modules.course_id
        and courses.is_active = true
        and courses.approval_status = 'approved'
    )
  );
revoke all on table public.course_modules from public, anon, authenticated;
grant select on table public.course_modules to anon, authenticated;

drop policy if exists course_lessons_public_catalog_select on public.course_lessons;
create policy course_lessons_public_catalog_select
  on public.course_lessons for select to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.course_modules
      join public.courses on courses.id = course_modules.course_id
      where course_modules.module_id = course_lessons.module_id
        and course_modules.is_published = true
        and courses.is_active = true
        and courses.approval_status = 'approved'
    )
  );
revoke all on table public.course_lessons from public, anon, authenticated;
grant select on table public.course_lessons to anon, authenticated;

do $optional_public_catalog$
begin
  if to_regclass('public.course_skills') is not null then
    drop policy if exists course_skills_public_catalog_select on public.course_skills;
    create policy course_skills_public_catalog_select
      on public.course_skills for select to anon, authenticated
      using (
        exists (
          select 1 from public.courses
          where courses.id = course_skills.course_id
            and courses.is_active = true
            and courses.approval_status = 'approved'
        )
      );
    revoke all on table public.course_skills from public, anon, authenticated;
    grant select on table public.course_skills to anon, authenticated;
  end if;

  if to_regclass('public.skills') is not null then
    drop policy if exists skills_public_catalog_select on public.skills;
    create policy skills_public_catalog_select
      on public.skills for select to anon, authenticated using (is_active = true);
    revoke all on table public.skills from public, anon, authenticated;
    grant select on table public.skills to anon, authenticated;
  end if;

  if to_regclass('public.categories') is not null then
    drop policy if exists categories_public_catalog_select on public.categories;
    create policy categories_public_catalog_select
      on public.categories for select to anon, authenticated using (true);
    revoke all on table public.categories from public, anon, authenticated;
    grant select on table public.categories to anon, authenticated;
  end if;
end;
$optional_public_catalog$;

drop policy if exists course_reviews_public_select on public.course_reviews;
create policy course_reviews_public_select
  on public.course_reviews for select to anon, authenticated
  using (is_public = true);
revoke all on table public.course_reviews from public, anon, authenticated;
grant select (
  review_id, course_id, rating, review_title, review_content,
  is_public, is_verified, created_at, updated_at
) on public.course_reviews to anon, authenticated;

-- The claim audit table was the only migration-created table without RLS.
alter table public.course_legacy_progress_claims enable row level security;
alter table public.course_legacy_progress_claims force row level security;
drop policy if exists course_legacy_progress_claims_select_own
  on public.course_legacy_progress_claims;
create policy course_legacy_progress_claims_select_own
  on public.course_legacy_progress_claims for select to authenticated
  using (user_id = (select auth.uid()));
grant select on table public.course_legacy_progress_claims to authenticated;

-- No RPC may inherit PostgreSQL's default EXECUTE grant to PUBLIC. Explicit
-- authenticated grants already stored in the ACL remain intact; anonymous and
-- implicit PUBLIC execution are removed from every ordinary/window function.
do $function_privileges$
declare
  function_record record;
begin
  for function_record in
    select namespace.nspname, procedure.proname, pg_get_function_identity_arguments(procedure.oid) arguments
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prokind in ('f', 'w')
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon',
      function_record.nspname,
      function_record.proname,
      function_record.arguments
    );
  end loop;
end;
$function_privileges$;

do $procedure_privileges$
declare
  procedure_record record;
begin
  for procedure_record in
    select namespace.nspname, procedure.proname, pg_get_function_identity_arguments(procedure.oid) arguments
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prokind = 'p'
  loop
    execute format(
      'revoke execute on procedure %I.%I(%s) from public, anon',
      procedure_record.nspname,
      procedure_record.proname,
      procedure_record.arguments
    );
  end loop;
end;
$procedure_privileges$;

revoke execute on function public.delete_user_cascade(uuid) from public, anon, authenticated;
alter function public.delete_user_cascade(uuid) set schema private;
alter function private.delete_user_cascade(uuid) set search_path = public, pg_temp;
revoke all on function private.delete_user_cascade(uuid) from public, anon, authenticated;
grant execute on function private.delete_user_cascade(uuid) to service_role;

create function public.delete_user_cascade(target_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'delete_user_cascade requires service_role'
      using errcode = '42501';
  end if;

  return private.delete_user_cascade(target_user_id);
end;
$$;
revoke all on function public.delete_user_cascade(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_cascade(uuid) to service_role;

revoke execute on function public.claim_legacy_course_progress(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
alter function public.claim_legacy_course_progress(uuid, uuid, uuid, uuid) set schema private;
alter function private.claim_legacy_course_progress(uuid, uuid, uuid, uuid)
  set search_path = public, pg_temp;
revoke all on function private.claim_legacy_course_progress(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.claim_legacy_course_progress(uuid, uuid, uuid, uuid)
  to service_role;

create function public.claim_legacy_course_progress(
  p_user_id uuid,
  p_course_id uuid,
  p_target_organization_id uuid,
  p_claimed_by uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'claim_legacy_course_progress requires service_role'
      using errcode = '42501';
  end if;

  return private.claim_legacy_course_progress(
    p_user_id,
    p_course_id,
    p_target_organization_id,
    p_claimed_by
  );
end;
$$;
revoke all on function public.claim_legacy_course_progress(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_legacy_course_progress(uuid, uuid, uuid, uuid)
  to service_role;

-- Future objects are private until a migration opts them in explicitly.
alter default privileges in schema public revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke usage, select on sequences from anon, authenticated;

commit;
