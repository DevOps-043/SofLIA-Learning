-- Migration: organizations_full_cascade_delete
--
-- Purpose: allow the platform super-admin to permanently delete an organization
-- from the "Empresas" panel. Today `organizations` already cascades into 10
-- child tables (organization_planner_config, organization_holidays,
-- organization_course_intro_videos, organization_lp_intro_videos,
-- learning_preview_cache, organization_learning_path_assignments,
-- user_learning_path_assignments, organization_course_default_rules,
-- course_legacy_progress_claims, course_scope_consolidation_runs), but ~38
-- other tables reference organization_id with Postgres's default (NO ACTION),
-- which blocks a plain `DELETE FROM organizations`.
--
-- This migration converts every remaining organization_id FK (plus the
-- hierarchy sub-chains that would otherwise block deletion transitively) to
-- ON DELETE CASCADE, following the exact pattern already used in
-- 20260626000002_organization_structures_cascade_delete.sql.
--
-- IMPORTANT — organization_users is intentionally included here: cascading
-- this FK only removes the membership row (organization_users), it does NOT
-- touch the `users` table (users has no organization_id column — org
-- membership lives exclusively in the organization_users junction table).
-- Deleting an organization therefore orphans its members' accounts rather
-- than deleting them.
--
-- Safe/idempotent: DROP CONSTRAINT IF EXISTS guards mean this can be re-run.

-- =============================================================================
-- PART 1: Direct organization_id -> organizations(id) references
-- =============================================================================

ALTER TABLE public.certificate_templates DROP CONSTRAINT IF EXISTS certificate_templates_organization_id_fkey;
ALTER TABLE public.certificate_templates ADD CONSTRAINT certificate_templates_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.course_question_responses DROP CONSTRAINT IF EXISTS course_question_responses_organization_id_fkey;
ALTER TABLE public.course_question_responses ADD CONSTRAINT course_question_responses_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.course_questions DROP CONSTRAINT IF EXISTS course_questions_organization_id_fkey;
ALTER TABLE public.course_questions ADD CONSTRAINT course_questions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.daily_progress DROP CONSTRAINT IF EXISTS daily_progress_organization_id_fkey;
ALTER TABLE public.daily_progress ADD CONSTRAINT daily_progress_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.dashboard_layouts DROP CONSTRAINT IF EXISTS dashboard_layouts_organization_id_fkey;
ALTER TABLE public.dashboard_layouts ADD CONSTRAINT dashboard_layouts_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_feedback DROP CONSTRAINT IF EXISTS lesson_feedback_organization_id_fkey;
ALTER TABLE public.lesson_feedback ADD CONSTRAINT lesson_feedback_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_tracking DROP CONSTRAINT IF EXISTS lesson_tracking_organization_id_fkey;
ALTER TABLE public.lesson_tracking ADD CONSTRAINT lesson_tracking_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.lia_activity_completions DROP CONSTRAINT IF EXISTS lia_activity_completions_organization_id_fkey;
ALTER TABLE public.lia_activity_completions ADD CONSTRAINT lia_activity_completions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.lia_conversations DROP CONSTRAINT IF EXISTS lia_conversations_organization_id_fkey;
ALTER TABLE public.lia_conversations ADD CONSTRAINT lia_conversations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_organization_id_fkey;
ALTER TABLE public.notification_settings ADD CONSTRAINT notification_settings_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.notification_stats DROP CONSTRAINT IF EXISTS notification_stats_organization_id_fkey;
ALTER TABLE public.notification_stats ADD CONSTRAINT notification_stats_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_analytics DROP CONSTRAINT IF EXISTS organization_analytics_organization_id_fkey;
ALTER TABLE public.organization_analytics ADD CONSTRAINT organization_analytics_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_course_assignments DROP CONSTRAINT IF EXISTS organization_course_assignments_organization_id_fkey;
ALTER TABLE public.organization_course_assignments ADD CONSTRAINT organization_course_assignments_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_course_purchases DROP CONSTRAINT IF EXISTS organization_course_purchases_organization_id_fkey;
ALTER TABLE public.organization_course_purchases ADD CONSTRAINT organization_course_purchases_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_notification_preferences DROP CONSTRAINT IF EXISTS organization_notification_preferences_organization_id_fkey;
ALTER TABLE public.organization_notification_preferences ADD CONSTRAINT organization_notification_preferences_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Cascading this one only removes the membership row — see note above, `users` is untouched.
ALTER TABLE public.organization_users DROP CONSTRAINT IF EXISTS organization_users_organization_id_fkey;
ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.scorm_packages DROP CONSTRAINT IF EXISTS scorm_packages_organization_id_fkey;
ALTER TABLE public.scorm_packages ADD CONSTRAINT scorm_packages_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.study_plans DROP CONSTRAINT IF EXISTS study_plans_organization_id_fkey;
ALTER TABLE public.study_plans ADD CONSTRAINT study_plans_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_organization_id_fkey;
ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_activity_log DROP CONSTRAINT IF EXISTS user_activity_log_organization_id_fkey;
ALTER TABLE public.user_activity_log ADD CONSTRAINT user_activity_log_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_course_enrollments DROP CONSTRAINT IF EXISTS user_course_enrollments_organization_id_fkey;
ALTER TABLE public.user_course_enrollments ADD CONSTRAINT user_course_enrollments_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_organization_id_fkey;
ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_lesson_notes DROP CONSTRAINT IF EXISTS user_lesson_notes_organization_id_fkey;
ALTER TABLE public.user_lesson_notes ADD CONSTRAINT user_lesson_notes_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_lesson_progress DROP CONSTRAINT IF EXISTS user_lesson_progress_organization_id_fkey;
ALTER TABLE public.user_lesson_progress ADD CONSTRAINT user_lesson_progress_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_organization_id_fkey;
ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_quiz_submissions DROP CONSTRAINT IF EXISTS user_quiz_submissions_organization_id_fkey;
ALTER TABLE public.user_quiz_submissions ADD CONSTRAINT user_quiz_submissions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_organization_id_fkey;
ALTER TABLE public.user_streaks ADD CONSTRAINT user_streaks_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_course_certificates DROP CONSTRAINT IF EXISTS user_course_certificates_organization_id_fkey;
ALTER TABLE public.user_course_certificates ADD CONSTRAINT user_course_certificates_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.bulk_invite_links DROP CONSTRAINT IF EXISTS bulk_invite_links_organization_id_fkey;
ALTER TABLE public.bulk_invite_links ADD CONSTRAINT bulk_invite_links_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_regions DROP CONSTRAINT IF EXISTS organization_regions_organization_id_fkey;
ALTER TABLE public.organization_regions ADD CONSTRAINT organization_regions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_zones DROP CONSTRAINT IF EXISTS organization_zones_organization_id_fkey;
ALTER TABLE public.organization_zones ADD CONSTRAINT organization_zones_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_teams DROP CONSTRAINT IF EXISTS organization_teams_organization_id_fkey;
ALTER TABLE public.organization_teams ADD CONSTRAINT organization_teams_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.hierarchy_chats DROP CONSTRAINT IF EXISTS hierarchy_chats_organization_id_fkey;
ALTER TABLE public.hierarchy_chats ADD CONSTRAINT hierarchy_chats_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.hierarchy_chat_messages DROP CONSTRAINT IF EXISTS hierarchy_chat_messages_organization_id_fkey;
ALTER TABLE public.hierarchy_chat_messages ADD CONSTRAINT hierarchy_chat_messages_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.hierarchy_chat_participants DROP CONSTRAINT IF EXISTS hierarchy_chat_participants_organization_id_fkey;
ALTER TABLE public.hierarchy_chat_participants ADD CONSTRAINT hierarchy_chat_participants_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.hierarchy_course_assignments DROP CONSTRAINT IF EXISTS hierarchy_course_assignments_organization_id_fkey;
ALTER TABLE public.hierarchy_course_assignments ADD CONSTRAINT hierarchy_course_assignments_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_structures DROP CONSTRAINT IF EXISTS organization_structures_organization_id_fkey;
ALTER TABLE public.organization_structures ADD CONSTRAINT organization_structures_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_nodes DROP CONSTRAINT IF EXISTS organization_nodes_organization_id_fkey;
ALTER TABLE public.organization_nodes ADD CONSTRAINT organization_nodes_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- =============================================================================
-- PART 2: Secondary chains inside the hierarchy feature that must also cascade
-- (their parent row is itself cascade-deleted above, but their own FK to that
-- parent is a separate edge that Postgres still enforces).
-- =============================================================================

ALTER TABLE public.organization_zones DROP CONSTRAINT IF EXISTS organization_zones_region_id_fkey;
ALTER TABLE public.organization_zones ADD CONSTRAINT organization_zones_region_id_fkey
  FOREIGN KEY (region_id) REFERENCES public.organization_regions(id) ON DELETE CASCADE;

ALTER TABLE public.organization_teams DROP CONSTRAINT IF EXISTS organization_teams_zone_id_fkey;
ALTER TABLE public.organization_teams ADD CONSTRAINT organization_teams_zone_id_fkey
  FOREIGN KEY (zone_id) REFERENCES public.organization_zones(id) ON DELETE CASCADE;

ALTER TABLE public.region_course_assignments DROP CONSTRAINT IF EXISTS region_course_assignments_hierarchy_assignment_id_fkey;
ALTER TABLE public.region_course_assignments ADD CONSTRAINT region_course_assignments_hierarchy_assignment_id_fkey
  FOREIGN KEY (hierarchy_assignment_id) REFERENCES public.hierarchy_course_assignments(id) ON DELETE CASCADE;

ALTER TABLE public.region_course_assignments DROP CONSTRAINT IF EXISTS region_course_assignments_region_id_fkey;
ALTER TABLE public.region_course_assignments ADD CONSTRAINT region_course_assignments_region_id_fkey
  FOREIGN KEY (region_id) REFERENCES public.organization_regions(id) ON DELETE CASCADE;

ALTER TABLE public.zone_course_assignments DROP CONSTRAINT IF EXISTS zone_course_assignments_hierarchy_assignment_id_fkey;
ALTER TABLE public.zone_course_assignments ADD CONSTRAINT zone_course_assignments_hierarchy_assignment_id_fkey
  FOREIGN KEY (hierarchy_assignment_id) REFERENCES public.hierarchy_course_assignments(id) ON DELETE CASCADE;

ALTER TABLE public.zone_course_assignments DROP CONSTRAINT IF EXISTS zone_course_assignments_zone_id_fkey;
ALTER TABLE public.zone_course_assignments ADD CONSTRAINT zone_course_assignments_zone_id_fkey
  FOREIGN KEY (zone_id) REFERENCES public.organization_zones(id) ON DELETE CASCADE;

ALTER TABLE public.team_course_assignments DROP CONSTRAINT IF EXISTS team_course_assignments_hierarchy_assignment_id_fkey;
ALTER TABLE public.team_course_assignments ADD CONSTRAINT team_course_assignments_hierarchy_assignment_id_fkey
  FOREIGN KEY (hierarchy_assignment_id) REFERENCES public.hierarchy_course_assignments(id) ON DELETE CASCADE;

ALTER TABLE public.team_course_assignments DROP CONSTRAINT IF EXISTS team_course_assignments_team_id_fkey;
ALTER TABLE public.team_course_assignments ADD CONSTRAINT team_course_assignments_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.organization_teams(id) ON DELETE CASCADE;
