import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type {
  MasterPanelCourseAssignment,
  MasterPanelLearningPathAssignment,
  MasterPanelMembership,
  UserMasterPanelData,
} from './types'

interface MembershipRow {
  id: string
  organization_id: string
  role: string | null
  status: string | null
  job_title: string | null
  joined_at: string | null
  organizations: { name: string | null } | null
}

interface CourseAssignmentRow {
  id: string
  organization_id: string | null
  course_id: string
  status: string | null
  completion_percentage: number | null
  source_learning_path_id: string | null
  assigned_at: string | null
  courses: { id: string; title: string | null; slug: string | null; thumbnail_url: string | null } | null
}

interface LearningPathAssignmentRow {
  id: string
  organization_id: string
  learning_path_id: string
  status: string | null
  assigned_at: string | null
  learning_paths: { id: string; title: string | null } | null
}

/**
 * Carga en una sola pasada (3 queries planas por user_id, sin N+1) todo el
 * estado gestionable de un usuario: membresías de organización, asignaciones
 * de cursos y asignaciones de rutas de aprendizaje activas.
 */
export async function getUserMasterPanelData(userId: string): Promise<UserMasterPanelData> {
  const supabase = createAdminClient()

  const [membershipsResult, courseAssignmentsResult, learningPathAssignmentsResult] = await Promise.all([
    supabase
      .from('organization_users')
      .select('id, organization_id, role, status, job_title, joined_at, organizations (name)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }),
    supabase
      .from('organization_course_assignments')
      .select(
        'id, organization_id, course_id, status, completion_percentage, source_learning_path_id, assigned_at, courses (id, title, slug, thumbnail_url)',
      )
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('user_learning_path_assignments')
      .select('id, organization_id, learning_path_id, status, assigned_at, learning_paths (id, title)')
      .eq('user_id', userId)
      .eq('status', 'assigned')
      .order('assigned_at', { ascending: false }),
  ])

  if (membershipsResult.error) {
    logger.error('Error fetching master panel memberships:', membershipsResult.error)
    throw membershipsResult.error
  }
  if (courseAssignmentsResult.error) {
    logger.error('Error fetching master panel course assignments:', courseAssignmentsResult.error)
    throw courseAssignmentsResult.error
  }
  if (learningPathAssignmentsResult.error) {
    logger.error('Error fetching master panel learning path assignments:', learningPathAssignmentsResult.error)
    throw learningPathAssignmentsResult.error
  }

  return {
    memberships: ((membershipsResult.data ?? []) as unknown as MembershipRow[]).map(mapMembership),
    courseAssignments: ((courseAssignmentsResult.data ?? []) as unknown as CourseAssignmentRow[]).map(
      mapCourseAssignment,
    ),
    learningPathAssignments: (
      (learningPathAssignmentsResult.data ?? []) as unknown as LearningPathAssignmentRow[]
    ).map(mapLearningPathAssignment),
  }
}

function mapMembership(row: MembershipRow): MasterPanelMembership {
  return {
    membershipId: row.id,
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? '',
    role: row.role,
    status: row.status,
    jobTitle: row.job_title,
    joinedAt: row.joined_at,
  }
}

function mapCourseAssignment(row: CourseAssignmentRow): MasterPanelCourseAssignment {
  return {
    id: row.id,
    organizationId: row.organization_id ?? '',
    courseId: row.course_id,
    courseTitle: row.courses?.title ?? '',
    courseSlug: row.courses?.slug ?? null,
    courseThumbnailUrl: row.courses?.thumbnail_url ?? null,
    status: row.status,
    completionPercentage: row.completion_percentage,
    sourceLearningPathId: row.source_learning_path_id,
    assignedAt: row.assigned_at,
  }
}

function mapLearningPathAssignment(row: LearningPathAssignmentRow): MasterPanelLearningPathAssignment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    learningPathId: row.learning_path_id,
    learningPathTitle: row.learning_paths?.title ?? '',
    status: row.status,
    assignedAt: row.assigned_at,
  }
}
