import type { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  normalizeCourseOrganizationId,
  resolveCourseEnrollment,
  type CourseEnrollmentScope,
} from '@/features/courses/services/course-enrollment.server.service'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

type LessonCourseRow = {
  course_modules?: { course_id?: string | null } | { course_id?: string | null }[] | null
}

function extractCourseId(row: LessonCourseRow | null): string | null {
  const relation = row?.course_modules

  if (Array.isArray(relation)) {
    return relation[0]?.course_id ?? null
  }

  return relation?.course_id ?? null
}

export async function loadCourseIdForLesson(
  supabase: SupabaseAdminClient,
  lessonId: string,
) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('course_modules!inner(course_id)')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) {
    logger.error('[VideoTrackingScope] Error resolving lesson course:', error)
    return null
  }

  return extractCourseId(data as LessonCourseRow | null)
}

export async function resolveVideoLessonEnrollmentScope({
  enrollmentId,
  lessonId,
  organizationId,
  supabase,
  userId,
}: {
  enrollmentId?: string | null
  lessonId: string
  organizationId?: string | null
  supabase: SupabaseAdminClient
  userId: string
}): Promise<CourseEnrollmentScope | null> {
  const courseId = await loadCourseIdForLesson(supabase, lessonId)

  if (!courseId) {
    return null
  }

  const normalizedOrganizationId = normalizeCourseOrganizationId(organizationId)

  if (enrollmentId) {
    let query = supabase
      .from('user_course_enrollments')
      .select(
        'enrollment_id, user_id, course_id, organization_id, overall_progress_percentage, enrollment_status, last_accessed_at, enrolled_at',
      )
      .eq('enrollment_id', enrollmentId)
      .eq('user_id', userId)
      .eq('course_id', courseId)

    query = normalizedOrganizationId
      ? query.eq('organization_id', normalizedOrganizationId)
      : query.is('organization_id', null)

    const { data, error } = await query.maybeSingle()

    if (error) {
      logger.error('[VideoTrackingScope] Error validating enrollment scope:', error)
      return null
    }

    return (data || null) as CourseEnrollmentScope | null
  }

  return resolveCourseEnrollment(
    supabase,
    userId,
    courseId,
    normalizedOrganizationId,
  )
}
