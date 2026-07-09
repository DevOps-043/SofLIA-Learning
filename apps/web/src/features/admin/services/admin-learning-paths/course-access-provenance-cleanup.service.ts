import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export interface KeptCourseWithProgress {
  userId: string
  organizationId: string
  courseId: string
  courseTitle: string | null
  progressPercentage: number
}

export interface CourseAccessCleanupResult {
  revokedCount: number
  keptWithProgress: KeptCourseWithProgress[]
}

export interface CourseAccessCleanupScope {
  learningPathId: string
  userId?: string
  organizationId?: string
  courseIds?: string[]
}

interface AssignmentRow {
  id: string
  user_id: string
  organization_id: string
  course_id: string
  courses: { title: string | null } | { title: string | null }[] | null
}

interface EnrollmentProgressRow {
  user_id: string
  course_id: string
  organization_id: string | null
  overall_progress_percentage: number | null
}

function progressKey(userId: string, courseId: string, organizationId: string) {
  return `${userId}::${courseId}::${organizationId}`
}

function getCourseTitle(courses: AssignmentRow['courses']): string | null {
  if (!courses) return null
  return Array.isArray(courses) ? courses[0]?.title ?? null : courses.title
}

/**
 * Finds every organization_course_assignments row whose source_learning_path_id
 * matches the given learning path (optionally narrowed to one user/org/course
 * set), hard-deletes the ones where the user has zero recorded progress on
 * that course (same convention as the direct-unassign flow in
 * admin-companies-assignments.service.ts#removeCourseFromUser), and returns
 * the ones that were kept because the user has real progress, so the caller
 * can surface them to an admin instead of silently discarding progress.
 */
export async function revokeCourseAccessSourcedFromLearningPath(
  scope: CourseAccessCleanupScope,
): Promise<CourseAccessCleanupResult> {
  const supabase = createAdminClient()

  let query = supabase
    .from('organization_course_assignments')
    .select('id, user_id, organization_id, course_id, courses(title)')
    .eq('source_learning_path_id', scope.learningPathId)

  if (scope.userId) query = query.eq('user_id', scope.userId)
  if (scope.organizationId) query = query.eq('organization_id', scope.organizationId)
  if (scope.courseIds?.length) query = query.in('course_id', scope.courseIds)

  const { data, error } = await query

  if (error) {
    logger.error('Error loading learning-path-sourced course assignments for cleanup:', error)
    throw new Error('No se pudo revisar el acceso a cursos originado por la ruta de aprendizaje')
  }

  const rows = (data || []) as AssignmentRow[]
  if (rows.length === 0) {
    return { revokedCount: 0, keptWithProgress: [] }
  }

  const { data: enrollments, error: enrollmentError } = await supabase
    .from('user_course_enrollments')
    .select('user_id, course_id, organization_id, overall_progress_percentage')
    .in('user_id', [...new Set(rows.map((row) => row.user_id))])
    .in('course_id', [...new Set(rows.map((row) => row.course_id))])

  if (enrollmentError) {
    logger.error('Error loading enrollments for course-access cleanup:', enrollmentError)
    throw new Error('No se pudo verificar el progreso del usuario antes de revocar el acceso')
  }

  const progressByKey = new Map(
    ((enrollments || []) as EnrollmentProgressRow[]).map((enrollment) => [
      progressKey(enrollment.user_id, enrollment.course_id, enrollment.organization_id || ''),
      enrollment.overall_progress_percentage || 0,
    ]),
  )

  const idsToRevoke: string[] = []
  const keptWithProgress: KeptCourseWithProgress[] = []

  for (const row of rows) {
    const progress =
      progressByKey.get(progressKey(row.user_id, row.course_id, row.organization_id)) || 0

    if (progress <= 0) {
      idsToRevoke.push(row.id)
    } else {
      keptWithProgress.push({
        userId: row.user_id,
        organizationId: row.organization_id,
        courseId: row.course_id,
        courseTitle: getCourseTitle(row.courses),
        progressPercentage: progress,
      })
    }
  }

  if (idsToRevoke.length > 0) {
    const { error: deleteError } = await supabase
      .from('organization_course_assignments')
      .delete()
      .in('id', idsToRevoke)

    if (deleteError) {
      logger.error('Error auto-revoking zero-progress course access:', deleteError)
      throw new Error('No se pudo revocar automaticamente el acceso a cursos sin progreso')
    }
  }

  return { revokedCount: idsToRevoke.length, keptWithProgress }
}

/**
 * Explicit admin override: force-revokes course access for specific
 * user+courses regardless of progress. Used only from the follow-up UI where
 * an admin has explicitly chosen to also revoke courses that
 * revokeCourseAccessSourcedFromLearningPath kept because of real progress.
 */
export async function forceRevokeCourseAccess(
  userId: string,
  organizationId: string,
  courseIds: string[],
): Promise<{ revokedCount: number }> {
  if (courseIds.length === 0) {
    return { revokedCount: 0 }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .delete()
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .in('course_id', courseIds)
    .select('id')

  if (error) {
    logger.error('Error force-revoking course access:', error)
    throw new Error('No se pudo revocar el acceso a los cursos seleccionados')
  }

  return { revokedCount: data?.length || 0 }
}
