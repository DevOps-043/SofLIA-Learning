import { logger } from '@/lib/utils/logger'
import { combineDashboardAssignments } from './assignments'
import { buildAssignedCourses } from './course-transform'
import { fetchInitialDashboardData } from './initial-queries'
import {
  fetchDashboardCourseRelations,
  mapEnrollmentsByCourse,
  mapInstructorsById,
} from './relations'
import { sortCoursesByLearningPathPosition } from './sort-courses'
import { calculateDashboardStats, createCertificatesMap } from './stats'
import type { DashboardSupabaseClient } from './types'

export async function getBusinessUserDashboardData(
  supabase: DashboardSupabaseClient,
  userId: string,
  organizationId: string
) {
  logger.log('📊 Fetching dashboard data for user:', userId, 'org:', organizationId)
  const initialData = await fetchInitialDashboardData(supabase, userId, organizationId)

  const { combinedAssignments, courseIds } = combineDashboardAssignments(
    initialData.directAssignments
  )
  const relations = await fetchDashboardCourseRelations(
    supabase,
    userId,
    courseIds,
    combinedAssignments
  )
  const enrollmentsMap = mapEnrollmentsByCourse(relations.enrollments)
  const instructorMap = mapInstructorsById(relations.instructors)
  const certificatesMap = createCertificatesMap(initialData.certificates)
  const stats = calculateDashboardStats(
    combinedAssignments,
    enrollmentsMap,
    initialData.certificates
  )
  const courses = buildAssignedCourses({
    combinedAssignments,
    enrollmentsMap,
    instructorMap,
    certificatesMap,
  })

  await sortCoursesByLearningPathPosition(supabase, courses)
  logger.log('✅ Dashboard data prepared:', { stats, coursesCount: courses.length })
  return { stats, courses }
}
