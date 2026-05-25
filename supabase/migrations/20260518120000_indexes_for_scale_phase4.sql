-- Phase 4 scale indexes for hot paths not fully covered by earlier load-test indexes.
-- These indexes are non-destructive and intentionally avoid new UNIQUE constraints
-- until duplicate audits are available in production data.

-- lesson_tracking: user analytics timelines filter by user and sort by recent starts.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_tracking_user_started_at_desc
  ON public.lesson_tracking (user_id, started_at DESC)
  WHERE started_at IS NOT NULL;

-- organization_users: business-panel member lists filter by organization, role/status,
-- and show newest memberships first.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_users_org_role_status_joined
  ON public.organization_users (organization_id, role, status, joined_at DESC)
  INCLUDE (user_id, job_title);

-- user_notifications: unread notification feeds query unread rows by user and recency.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_unread_created_at
  ON public.user_notifications (user_id, read_at, created_at DESC)
  WHERE read_at IS NULL;

-- user_course_certificates: certificate lookups and duplicate checks are user/course scoped.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_certificates_user_course
  ON public.user_course_certificates (user_id, course_id);
