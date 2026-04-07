-- Core lookup indexes for high-traffic query paths.
-- These replace indexes that existed in deleted legacy migrations.
-- All indexes verified against active query patterns in apps/web/src.

-- Login / auth: lookup users by email (features/auth/services/session.service.ts)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users (email);

-- Course detail pages and course slug lookups (app/api/courses/[slug]/*)
CREATE INDEX IF NOT EXISTS idx_courses_slug
  ON public.courses (slug);

-- Enrollment and progress checks — most frequent join in course flows
-- (app/api/courses/*/learn-data, my-courses, business/courses)
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_course
  ON public.user_course_enrollments (user_id, course_id);

-- Active study plan window per user
-- (app/api/study-planner/*, features/study-planner/services/*)
CREATE INDEX IF NOT EXISTS idx_study_plans_user_start_date
  ON public.study_plans (user_id, start_date);

-- Business dashboard: active courses list ordered by recency
-- (app/api/business/courses/route.ts — .eq('is_active', true).order('created_at', desc))
CREATE INDEX IF NOT EXISTS idx_courses_active_created_at
  ON public.courses (is_active, created_at DESC)
  WHERE is_active = true;
