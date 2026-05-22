import type { createClient as createSupabaseClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>

export interface CourseEnrollmentRecord {
  enrollment_id: string
  organization_id: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
  last_accessed_at: string | null
  enrolled_at: string | null
}

function hasRecordedProgress(enrollment: CourseEnrollmentRecord) {
  return (
    (enrollment.overall_progress_percentage ?? 0) > 0 ||
    enrollment.enrollment_status === 'completed'
  )
}

export function selectPreferredCourseEnrollment(
  enrollments: CourseEnrollmentRecord[],
  organizationId?: string | null,
) {
  if (enrollments.length === 0) {
    return null
  }

  const exactOrganizationMatches = organizationId
    ? enrollments.filter(
        (enrollment) => enrollment.organization_id === organizationId,
      )
    : []
  const legacyMatches = enrollments.filter(
    (enrollment) => enrollment.organization_id === null,
  )

  const progressedExactMatch = exactOrganizationMatches.find(hasRecordedProgress)
  if (progressedExactMatch) {
    return progressedExactMatch
  }

  const progressedLegacyMatch = legacyMatches.find(hasRecordedProgress)
  if (progressedLegacyMatch) {
    return progressedLegacyMatch
  }

  if (exactOrganizationMatches[0]) {
    return exactOrganizationMatches[0]
  }

  if (legacyMatches[0]) {
    return legacyMatches[0]
  }

  return enrollments.find(hasRecordedProgress) ?? enrollments[0]
}

export function mapPreferredCourseEnrollments<T extends CourseEnrollmentRecord & { course_id: string }>(
  enrollments: T[],
  organizationId?: string | null,
) {
  const enrollmentsByCourse = new Map<string, T[]>()

  for (const enrollment of enrollments) {
    const current = enrollmentsByCourse.get(enrollment.course_id) || []
    current.push(enrollment)
    enrollmentsByCourse.set(enrollment.course_id, current)
  }

  const preferredByCourse = new Map<string, T>()

  for (const [courseId, courseEnrollments] of enrollmentsByCourse.entries()) {
    const preferred = selectPreferredCourseEnrollment(
      courseEnrollments,
      organizationId,
    ) as T | null

    if (preferred) {
      preferredByCourse.set(courseId, preferred)
    }
  }

  return preferredByCourse
}

export async function loadCourseEnrollments(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
) {
  const { data } = await supabase
    .from('user_course_enrollments')
    .select(
      'enrollment_id, organization_id, overall_progress_percentage, enrollment_status, last_accessed_at, enrolled_at',
    )
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .order('enrolled_at', { ascending: false, nullsFirst: false })

  return (data || []) as CourseEnrollmentRecord[]
}

export async function resolveCourseEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId?: string | null,
) {
  const enrollments = await loadCourseEnrollments(supabase, userId, courseId)
  return selectPreferredCourseEnrollment(enrollments, organizationId)
}
