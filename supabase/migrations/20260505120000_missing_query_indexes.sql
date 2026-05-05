-- Missing indexes identified in technical debt audit.
-- Covers frequent filter patterns not addressed by prior migration.
-- All indexes are idempotent (IF NOT EXISTS) and non-destructive.

-- organization_users: filtered by org + user (membership lookup, invite checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_users_org_user
  ON public.organization_users (organization_id, user_id);

-- organization_course_assignments: filtered by org + course + status (assignment queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_course_assignments_org_course_status
  ON public.organization_course_assignments (organization_id, course_id, status);

-- lesson_activities: filtered by lesson + activity_type (activity fetching per lesson)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_activities_lesson_type
  ON public.lesson_activities (lesson_id, activity_type);
