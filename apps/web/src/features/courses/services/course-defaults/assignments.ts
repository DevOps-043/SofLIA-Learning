import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { CourseAssignmentSource, CourseAssignResult, CreatedCourseAssignment } from './types'

interface AssignmentLookupRow extends Record<string, unknown> { user_id: string }
interface EnrollmentRow extends Record<string, unknown> { user_id: string }

/**
 * Shared insertion primitive for course assignments. Unlike learning paths, course
 * assignments have no soft-revoke state (DELETE /assign hard-deletes the row), so
 * there is no "reactivate a revoked assignment" concept here: a user either already
 * has an active-ish assignment (status null/assigned/in_progress) or gets a new one.
 */
export async function assignCourseToUsers(params: {
  organizationId: string
  courseId: string
  userIds: string[]
  assignedBy: string | null
  assignmentSource: CourseAssignmentSource
  defaultRuleId?: string | null
  dueDate?: string | null
  startDate?: string | null
  approach?: string | null
  message?: string | null
}): Promise<CourseAssignResult> {
  const uniqueUserIds = [...new Set(params.userIds)]
  if (uniqueUserIds.length === 0) return { targetUsers: 0, assigned: 0, existing: 0, createdAssignments: [] }

  const supabase = createAdminClient()

  const { data: existingAssignments, error: existingError } = await fromLoose<AssignmentLookupRow>(
    supabase,
    'organization_course_assignments',
  )
    .select('user_id')
    .eq('organization_id', params.organizationId)
    .eq('course_id', params.courseId)
    .in('user_id', uniqueUserIds)
    .or('status.is.null,status.in.(assigned,in_progress)')

  if (existingError) {
    logger.error('Error checking existing course assignments:', existingError)
    throw new Error('No se pudieron validar las asignaciones existentes')
  }

  const existingUserIds = new Set((existingAssignments || []).map((row) => row.user_id))
  const newUserIds = uniqueUserIds.filter((userId) => !existingUserIds.has(userId))

  if (newUserIds.length === 0) {
    return { targetUsers: uniqueUserIds.length, assigned: 0, existing: existingUserIds.size, createdAssignments: [] }
  }

  const now = new Date().toISOString()
  const assignmentRows = newUserIds.map((userId) => ({
    organization_id: params.organizationId,
    user_id: userId,
    course_id: params.courseId,
    assigned_by: params.assignedBy,
    assigned_at: now,
    due_date: params.dueDate ?? null,
    start_date: params.startDate ?? null,
    approach: params.approach ?? null,
    message: params.message ?? null,
    status: 'assigned',
    completion_percentage: 0,
    assignment_source: params.assignmentSource,
    default_rule_id: params.defaultRuleId ?? null,
  }))

  const { data: createdAssignments, error: assignError } = await fromLoose<CreatedCourseAssignment>(
    supabase,
    'organization_course_assignments',
  )
    .insert(assignmentRows)
    .select('id, user_id')

  if (assignError || !createdAssignments) {
    logger.error('Error creating course assignments:', assignError)
    throw new Error('No se pudo asignar el curso')
  }

  await createMissingEnrollments(supabase, params.organizationId, params.courseId, newUserIds, now)

  return {
    targetUsers: uniqueUserIds.length,
    assigned: createdAssignments.length,
    existing: existingUserIds.size,
    createdAssignments,
  }
}

async function createMissingEnrollments(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  courseId: string,
  userIds: string[],
  now: string,
) {
  const { data: existingEnrollments, error: existingEnrollmentsError } = await fromLoose<EnrollmentRow>(
    supabase,
    'user_course_enrollments',
  )
    .select('user_id')
    .eq('course_id', courseId)
    .eq('organization_id', organizationId)
    .in('user_id', userIds)

  if (existingEnrollmentsError) {
    logger.warn('Error checking existing enrollments:', existingEnrollmentsError)
  }

  const usersWithEnrollment = new Set((existingEnrollments || []).map((row) => row.user_id))
  const enrollmentsToCreate = userIds
    .filter((userId) => !usersWithEnrollment.has(userId))
    .map((userId) => ({
      user_id: userId,
      course_id: courseId,
      organization_id: organizationId,
      enrollment_status: 'active',
      overall_progress_percentage: 0,
      enrolled_at: now,
      started_at: now,
      last_accessed_at: now,
    }))

  if (enrollmentsToCreate.length === 0) return

  const { error: enrollError } = await fromLoose<EnrollmentRow>(supabase, 'user_course_enrollments').insert(
    enrollmentsToCreate,
  )
  if (enrollError) logger.warn('Error creating enrollments:', enrollError)
}
