import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { LessonProgressError } from '../lesson-progress.shared'
import type { SupabaseServerClient } from './types'

export async function ensureEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId?: string | null,
) {
  const enrollment = await resolveCourseEnrollment(supabase, userId, courseId, organizationId)
  if (enrollment) return enrollment

  const now = new Date().toISOString()
  const { data: createdEnrollment, error: createError } = await supabase
    .from('user_course_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      organization_id: organizationId ?? null,
      enrollment_status: 'active',
      overall_progress_percentage: 0,
      enrolled_at: now,
      started_at: now,
      last_accessed_at: now,
    })
    .select('enrollment_id, overall_progress_percentage, enrollment_status')
    .single()

  if (createError || !createdEnrollment) {
    throw new LessonProgressError('ENROLLMENT_CREATE_FAILED', 500, 'Error al crear inscripcion')
  }

  return createdEnrollment
}
