import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
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

interface LearningPathCourseJoinRow {
  id: string
  title: string | null
  slug: string | null
  thumbnail_url: string | null
}

function uniqueValues(values: string[]) {
  return [...new Set(values)]
}

/**
 * Load the learning path IDs assigned to a user via organization-level
 * assignments and user-level assignments.
 *
 * Uses direct `supabase.from(...)` calls with `.returns<>()` to avoid RLS
 * issues that occurred with fromLoose + nested joins.
 */
async function loadAssignedLearningPathIds(userId: string, organizationId: string) {
  // Use admin client to bypass RLS — business users cannot read these tables directly.
  // Auth is already validated by the calling route handler (requireBusinessUser).
  const supabase = createAdminClient()

  const [organizationAssignments, userAssignments] = await Promise.all([
    supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .returns<LearningPathAssignmentIdRow[]>(),
    supabase
      .from('user_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'assigned')
      .returns<LearningPathAssignmentIdRow[]>(),
  ])

  if (organizationAssignments.error) {
    logger.error(
      '❌ Error loading org learning path assignments for dashboard:',
      organizationAssignments.error,
    )
    // Don't throw — return empty so the dashboard still loads
    return []
  }

  if (userAssignments.error) {
    logger.error(
      '❌ Error loading user learning path assignments for dashboard:',
      userAssignments.error,
    )
    // Don't throw — return empty so the dashboard still loads
    return []
  }

  const ids = uniqueValues([
    ...(organizationAssignments.data || []).map((row) => row.learning_path_id),
    ...(userAssignments.data || []).map((row) => row.learning_path_id),
  ])

  logger.log(
    `📚 Learning path IDs for user ${userId} in org ${organizationId}:`,
    ids.length,
    ids,
  )

  return ids
}

export async function loadBusinessUserLearningPaths(params: {
  userId: string
  organizationId: string
}): Promise<AssignedLearningPathDashboard[]> {
  const { userId, organizationId } = params
  // Admin client bypasses RLS for all queries in this function.
  // Auth is validated upstream by requireBusinessUser.
  const supabase = createAdminClient()
  const learningPathIds = await loadAssignedLearningPathIds(userId, organizationId)

  if (learningPathIds.length === 0) {
    logger.log('📚 No learning paths assigned — skipping')
    return []
  }

  // =====================================================
  // STEP 1: Load paths and items in parallel.
  //
  // We split the items query into two parts:
  //   a) load path items (flat columns only — no nested join)
  //   b) load course info separately
  //
  // This avoids RLS-based silent failures when the authenticated
  // user cannot see the parent `learning_paths` row (RLS requires
  // a valid assignment, but the nested `courses` join via
  // `fromLoose` was short-circuited by the `learning_path_items`
  // visibility policy that depends on the parent `learning_paths`
  // row being visible first).
  // =====================================================
  const [{ data: paths, error: pathsError }, { data: rawItems, error: itemsError }] =
    await Promise.all([
      supabase
        .from('learning_paths')
        .select('id, title, description, is_active')
        .in('id', learningPathIds)
        .eq('is_active', true)
        .returns<LearningPathDashboardPathRow[]>(),
      supabase
        .from('learning_path_items')
        .select('id, learning_path_id, course_id, position')
        .in('learning_path_id', learningPathIds)
        .order('position', { ascending: true })
        .returns<Omit<LearningPathDashboardItemRow, 'courses'>[]>(),
    ])

  if (pathsError) {
    logger.error('❌ Error loading learning paths for dashboard:', pathsError)
    return []
  }

  if (itemsError) {
    logger.error('❌ Error loading learning path items for dashboard:', itemsError)
    return []
  }

  logger.log(
    `📚 Loaded ${(paths || []).length} paths, ${(rawItems || []).length} items`,
  )

  if (!paths || paths.length === 0 || !rawItems || rawItems.length === 0) {
    return []
  }

  // =====================================================
  // STEP 2: Load course info separately (bypasses nested-join RLS issues)
  // =====================================================
  const courseIds = uniqueValues(rawItems.map((item) => item.course_id))
  if (courseIds.length === 0) {
    return []
  }

  const [
    { data: courses, error: coursesError },
    { data: enrollments, error: enrollmentsError },
    { data: certificates, error: certificatesError },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url')
      .in('id', courseIds)
      .returns<LearningPathCourseJoinRow[]>(),
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

  if (coursesError) {
    logger.error('❌ Error loading courses for learning path dashboard:', coursesError)
    return []
  }

  if (enrollmentsError) {
    logger.error('❌ Error loading enrollments for learning path dashboard:', enrollmentsError)
  }

  if (certificatesError) {
    logger.error('❌ Error loading certificates for learning path dashboard:', certificatesError)
  }

  // Build a map { courseId -> course } for quick lookup
  const courseMap = new Map<string, LearningPathCourseJoinRow>()
  for (const course of courses || []) {
    courseMap.set(course.id, course)
  }

  // Re-assemble items with their course data so the shape matches
  // the existing `LearningPathDashboardItemRow` interface.
  const items: LearningPathDashboardItemRow[] = rawItems.map((item) => {
    const course = courseMap.get(item.course_id)
    return {
      ...item,
      courses: course
        ? {
            id: course.id,
            title: course.title,
            slug: course.slug,
            thumbnail_url: course.thumbnail_url,
          }
        : null,
    }
  })

  return buildBusinessUserLearningPaths({
    paths,
    items,
    enrollments: enrollmentsError ? [] : enrollments || [],
    certificates: certificatesError ? [] : certificates || [],
    organizationId,
  })
}
