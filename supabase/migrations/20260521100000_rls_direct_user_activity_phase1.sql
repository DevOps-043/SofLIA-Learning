-- =============================================================================
-- Migration: rls_direct_user_activity_phase1
-- Purpose:   Start the first RLS wave for direct user-owned activity tables
--            while preserving organization analytics reads for Business admins.
--
-- Notes:
-- - user_notifications allows authenticated users to read/update/delete only
--   their own rows. Inserts stay service_role-only because notifications are
--   created by trusted server flows.
-- - study_plans and calendar_integrations already have RLS from
--   20260404120000_rls_missing_tables.sql.
-- =============================================================================

begin;

create or replace function public.can_read_org_user_activity(
  target_user_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    target_organization_id is not null
    and exists (
      select 1
      from public.organization_users actor_membership
      join public.organization_users target_membership
        on target_membership.organization_id = actor_membership.organization_id
      where actor_membership.user_id = auth.uid()
        and actor_membership.organization_id = target_organization_id
        and actor_membership.status = 'active'
        and actor_membership.role in ('owner', 'admin')
        and target_membership.user_id = target_user_id
        and target_membership.status = 'active'
    );
$$;

revoke all on function public.can_read_org_user_activity(uuid, uuid) from public;
grant execute on function public.can_read_org_user_activity(uuid, uuid) to authenticated;
grant execute on function public.can_read_org_user_activity(uuid, uuid) to service_role;

-- user_notification_preferences: strictly personal preferences.
alter table public.user_notification_preferences enable row level security;

drop policy if exists user_notification_preferences_select_own on public.user_notification_preferences;
create policy user_notification_preferences_select_own
  on public.user_notification_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_notification_preferences_insert_own on public.user_notification_preferences;
create policy user_notification_preferences_insert_own
  on public.user_notification_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_notification_preferences_update_own on public.user_notification_preferences;
create policy user_notification_preferences_update_own
  on public.user_notification_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_notification_preferences_delete_own on public.user_notification_preferences;
create policy user_notification_preferences_delete_own
  on public.user_notification_preferences
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_notification_preferences_service_role on public.user_notification_preferences;
create policy user_notification_preferences_service_role
  on public.user_notification_preferences
  for all
  to service_role
  using (true)
  with check (true);

-- user_notifications: users manage their own inbox; trusted server flows create rows.
alter table public.user_notifications enable row level security;

revoke all on table public.user_notifications from anon;
revoke insert, update, delete on table public.user_notifications from authenticated;
grant select on table public.user_notifications to authenticated;
grant update (status, read_at, updated_at) on table public.user_notifications to authenticated;
grant delete on table public.user_notifications to authenticated;
grant all on table public.user_notifications to service_role;

drop policy if exists user_notifications_select_self_or_org_admin on public.user_notifications;
create policy user_notifications_select_self_or_org_admin
  on public.user_notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own
  on public.user_notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_notifications_delete_own on public.user_notifications;
create policy user_notifications_delete_own
  on public.user_notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_notifications_service_role on public.user_notifications;
create policy user_notifications_service_role
  on public.user_notifications
  for all
  to service_role
  using (true)
  with check (true);

-- Shared ownership pattern for direct learning/activity tables.
alter table public.user_lesson_notes enable row level security;

drop policy if exists user_lesson_notes_select_self_or_org_admin on public.user_lesson_notes;
create policy user_lesson_notes_select_self_or_org_admin
  on public.user_lesson_notes
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists user_lesson_notes_insert_own on public.user_lesson_notes;
create policy user_lesson_notes_insert_own
  on public.user_lesson_notes
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_lesson_notes_update_own on public.user_lesson_notes;
create policy user_lesson_notes_update_own
  on public.user_lesson_notes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_lesson_notes_delete_own on public.user_lesson_notes;
create policy user_lesson_notes_delete_own
  on public.user_lesson_notes
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_lesson_notes_service_role on public.user_lesson_notes;
create policy user_lesson_notes_service_role
  on public.user_lesson_notes
  for all
  to service_role
  using (true)
  with check (true);

alter table public.user_lesson_progress enable row level security;

drop policy if exists user_lesson_progress_select_self_or_org_admin on public.user_lesson_progress;
create policy user_lesson_progress_select_self_or_org_admin
  on public.user_lesson_progress
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists user_lesson_progress_insert_own on public.user_lesson_progress;
create policy user_lesson_progress_insert_own
  on public.user_lesson_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_lesson_progress_update_own on public.user_lesson_progress;
create policy user_lesson_progress_update_own
  on public.user_lesson_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_lesson_progress_delete_own on public.user_lesson_progress;
create policy user_lesson_progress_delete_own
  on public.user_lesson_progress
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_lesson_progress_service_role on public.user_lesson_progress;
create policy user_lesson_progress_service_role
  on public.user_lesson_progress
  for all
  to service_role
  using (true)
  with check (true);

alter table public.study_sessions enable row level security;

drop policy if exists study_sessions_select_self_or_org_admin on public.study_sessions;
create policy study_sessions_select_self_or_org_admin
  on public.study_sessions
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists study_sessions_insert_own on public.study_sessions;
create policy study_sessions_insert_own
  on public.study_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists study_sessions_update_own on public.study_sessions;
create policy study_sessions_update_own
  on public.study_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists study_sessions_delete_own on public.study_sessions;
create policy study_sessions_delete_own
  on public.study_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists study_sessions_service_role on public.study_sessions;
create policy study_sessions_service_role
  on public.study_sessions
  for all
  to service_role
  using (true)
  with check (true);

alter table public.lia_conversations enable row level security;

drop policy if exists lia_conversations_select_self_or_org_admin on public.lia_conversations;
create policy lia_conversations_select_self_or_org_admin
  on public.lia_conversations
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists lia_conversations_insert_own on public.lia_conversations;
create policy lia_conversations_insert_own
  on public.lia_conversations
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists lia_conversations_update_own on public.lia_conversations;
create policy lia_conversations_update_own
  on public.lia_conversations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists lia_conversations_delete_own on public.lia_conversations;
create policy lia_conversations_delete_own
  on public.lia_conversations
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists lia_conversations_service_role on public.lia_conversations;
create policy lia_conversations_service_role
  on public.lia_conversations
  for all
  to service_role
  using (true)
  with check (true);

comment on function public.can_read_org_user_activity(uuid, uuid) is
  'Returns true when auth.uid() is an active owner/admin in the target organization and the target user is an active member.';

commit;
