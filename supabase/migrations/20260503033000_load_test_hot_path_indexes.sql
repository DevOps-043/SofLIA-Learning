-- Hot-path indexes for QA load/stress validation.
-- Scope: read/session paths exercised by tools/load-testing.
-- All indexes are idempotent and non-destructive.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_session_active_jwt
  ON public.user_session (jwt_id)
  WHERE revoked = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_users_active_user_joined
  ON public.organization_users (user_id, status, joined_at DESC)
  INCLUDE (organization_id, job_title);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_enrollments_user_status_enrolled
  ON public.user_course_enrollments (user_id, enrollment_status, enrolled_at DESC)
  INCLUDE (course_id, overall_progress_percentage, last_accessed_at, started_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_plans_user_created
  ON public.study_plans (user_id, created_at DESC)
  INCLUDE (id, name, start_date, end_date, timezone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_sessions_user_range
  ON public.study_sessions (user_id, start_time, end_time)
  INCLUDE (plan_id, status, course_id, lesson_id, duration_minutes);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_sessions_plan_start
  ON public.study_sessions (plan_id, start_time)
  INCLUDE (status, course_id, lesson_id, duration_minutes);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_tracking_user_lesson_session
  ON public.lesson_tracking (user_id, lesson_id, session_id)
  INCLUDE (status, video_checkpoint_seconds, video_playback_rate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_tracking_active_user_lesson_session
  ON public.lesson_tracking (user_id, lesson_id, session_id)
  WHERE status = 'in_progress';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_integrations_user_updated
  ON public.calendar_integrations (user_id, updated_at DESC)
  INCLUDE (provider);
