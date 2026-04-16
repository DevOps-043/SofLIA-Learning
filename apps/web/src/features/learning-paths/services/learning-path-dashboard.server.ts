import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import {
  buildBusinessUserLearningPaths,
  type AssignedLearningPathDashboard,
  type LearningPathDashboardCertificateRow,
  type LearningPathDashboardEnrollmentRow,
  type LearningPathDashboardItemRow,
  type LearningPathDashboardPathRow,
} from './learning-path-dashboard.service'

interface LearningPathAssignmentIdRow {
  learning_path_id: string
}

function uniqueValues(values: string[]) {
  return [...new Set(values)]
}

async function loadAssignedLearningPathIds(userId: string, organizationId: string) {
  const supabase = await createClient()

  const [organizationAssignments, userAssignments] = await Promise.all([
    fromLoose<LearningPathAssignmentIdRow>(supabase, 'organization_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    fromLoose<LearningPathAssignmentIdRow>(supabase, 'user_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'assigned'),
  ])

  if (organizationAssignments.error) {
    logger.error(
      'Error loading organization learning path ids for dashboard:',
      organizationAssignments.error,
    )
    throw new Error('No se pudieron cargar las rutas de aprendizaje')
  }

  if (userAssignments.error) {
    logger.error('Error loading user learning path ids for dashboard:', userAssignments.error)
    throw new Error('No se pudieron cargar las rutas de aprendizaje')
  }

  return uniqueValues([
    ...(organizationAssignments.data || []).map((row) => row.learning_path_id),
    ...(userAssignments.data || []).map((row) => row.learning_path_id),
  ])
}

export async function loadBusinessUserLearningPaths(params: {
  userId: string
  organizationId: string
}): Promise<AssignedLearningPathDashboard[]> {
  const { userId, organizationId } = params
  const supabase = await createClient()
  const learningPathIds = await loadAssignedLearningPathIds(userId, organizationId)

  if (learningPathIds.length === 0) {
    return []
  }

  const [{ data: paths, error: pathsError }, { data: items, error: itemsError }] =
    await Promise.all([
      fromLoose<LearningPathDashboardPathRow>(supabase, 'learning_paths')
        .select('id, title, description, is_active')
        .in('id', learningPathIds)
        .eq('is_active', true),
      fromLoose<LearningPathDashboardItemRow>(supabase, 'learning_path_items')
        .select(`
          id,
          learning_path_id,
          course_id,
          position,
          courses (
            id,
            title,
            slug,
            thumbnail_url
          )
        `)
        .in('learning_path_id', learningPathIds)
        .order('position', { ascending: true }),
    ])

  if (pathsError) {
    logger.error('Error loading learning paths for dashboard:', pathsError)
    throw new Error('No se pudieron cargar las rutas de aprendizaje')
  }

  if (itemsError) {
    logger.error('Error loading learning path items for dashboard:', itemsError)
    throw new Error('No se pudieron cargar las rutas de aprendizaje')
  }

  const courseIds = uniqueValues((items || []).map((item) => item.course_id))
  if (courseIds.length === 0) {
    return []
  }

  const [
    { data: enrollments, error: enrollmentsError },
    { data: certificates, error: certificatesError },
  ] = await Promise.all([
    supabase
      .from('user_course_enrollments')
      .select('course_id, organization_id, overall_progress_percentage, enrollment_status, completed_at')
      .eq('user_id', userId)
      .in('course_id', courseIds)
      .returns<LearningPathDashboardEnrollmentRow[]>(),
    supabase
      .from('user_course_certificates')
      .select('course_id')
      .eq('user_id', userId)
      .in('course_id', courseIds)
      .returns<LearningPathDashboardCertificateRow[]>(),
  ])

  if (enrollmentsError) {
    logger.error('Error loading enrollments for learning path dashboard:', enrollmentsError)
  }

  if (certificatesError) {
    logger.error('Error loading certificates for learning path dashboard:', certificatesError)
  }

  return buildBusinessUserLearningPaths({
    paths: paths || [],
    items: items || [],
    enrollments: enrollmentsError ? [] : enrollments || [],
    certificates: certificatesError ? [] : certificates || [],
    organizationId,
  })
}
