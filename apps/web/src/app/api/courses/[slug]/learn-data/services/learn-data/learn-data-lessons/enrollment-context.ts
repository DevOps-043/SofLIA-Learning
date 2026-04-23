import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import type { SupabaseServerClient } from './types'

export async function resolveModulesEnrollmentContext(
  supabase: SupabaseServerClient,
  userId: string | undefined,
  courseId: string,
  organizationId?: string | null,
) {
  if (!userId) return { enrollmentId: null, resolvedOrganizationId: null }

  const enrollment = await resolveCourseEnrollment(
    supabase,
    userId,
    courseId,
    organizationId,
  )

  return {
    enrollmentId: enrollment?.enrollment_id || null,
    resolvedOrganizationId: enrollment?.organization_id || organizationId || null,
  }
}
