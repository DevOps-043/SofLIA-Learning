-- INCIDENT REMEDIATION (2026-08-28)
--
-- courses, course_modules, course_lessons and course_skills never received
-- ENABLE ROW LEVEL SECURITY in any tracked migration. Confirmed live against
-- production (mrqnnmuckznvukjvfkly.supabase.co) on 2026-08-28 that all four
-- tables were readable in full by anyone holding the public anon key,
-- including course_lessons.transcript_content (full video transcripts).
--
-- SofLIA is B2B-only (no public course catalog, no consumer subscriptions —
-- see CLAUDE.md). There is no legitimate product reason for course content to
-- be readable by an unauthenticated caller, so access is scoped to:
--   1. Platform admins (users.platform_role = 'Administrador')
--   2. The course's instructor (courses.instructor_id)
--   3. Users enrolled in the course (user_course_enrollments)
--   4. Users whose org has assigned them the course (organization_course_assignments)
--
-- The business-panel "browse full catalog to assign a course" flow
-- (app/api/business/courses, app/api/[orgSlug]/business/courses) reads via
-- createAdminClient() (service role), which bypasses RLS entirely — this
-- migration does not affect it.
--
-- IMPORTANT — validate before/after applying:
--   * Smoke test: business-panel course assignment UI, employee course/learn
--     page, community Q&A under a course, admin course tools.
--   * If there turns out to be a legitimate pre-enrollment "preview" UX,
--     add a narrower policy exposing only non-sensitive columns via a view —
--     do not widen these policies back to USING (true).

CREATE OR REPLACE FUNCTION public.user_can_access_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.platform_role = 'Administrador'
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = p_course_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_course_enrollments e
      WHERE e.course_id = p_course_id AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.organization_course_assignments oca
      WHERE oca.course_id = p_course_id AND oca.user_id = auth.uid()
    )
$$;

REVOKE ALL ON FUNCTION public.user_can_access_course(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_course(uuid) TO authenticated, service_role;

-- courses ---------------------------------------------------------------
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_access" ON public.courses
  FOR SELECT TO authenticated
  USING (public.user_can_access_course(id));

CREATE POLICY "courses_service_role" ON public.courses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- course_modules ----------------------------------------------------------
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_modules_select_access" ON public.course_modules
  FOR SELECT TO authenticated
  USING (public.user_can_access_course(course_id));

CREATE POLICY "course_modules_service_role" ON public.course_modules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- course_lessons ----------------------------------------------------------
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_lessons_select_access" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (
    public.user_can_access_course(
      (SELECT cm.course_id FROM public.course_modules cm WHERE cm.module_id = course_lessons.module_id)
    )
  );

CREATE POLICY "course_lessons_service_role" ON public.course_lessons
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- course_skills -----------------------------------------------------------
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_skills_select_access" ON public.course_skills
  FOR SELECT TO authenticated
  USING (public.user_can_access_course(course_id));

CREATE POLICY "course_skills_service_role" ON public.course_skills
  FOR ALL TO service_role USING (true) WITH CHECK (true);
