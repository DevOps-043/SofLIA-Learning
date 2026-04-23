import { NextResponse } from 'next/server'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { buildCombinedAssignments } from './combined-assignments'
import { buildCertificatesMap } from './certificates-map'
import { getCourseMetadata } from './course-metadata'
import { buildAssignedCourses } from './courses'
import { getInitialDashboardData } from './initial-data'
import { sortCoursesByLearningPathPosition } from './learning-path-sort'
import {
  createDashboardContextErrorResponse,
  createDashboardFailureResponse,
} from './responses'
import { buildDashboardStats } from './stats'
import { getTeamCourseAssignments } from './team-assignments'

export async function handleBusinessUserDashboardRequest() {
  try {
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      logger.error('Auth failed in business-user/dashboard:', auth.status)
      return auth
    }

    if (!auth.userId) {
      logger.error('No userId in auth object')
      return createDashboardContextErrorResponse(401, 'Usuario no autenticado')
    }

    if (!auth.organizationId) {
      logger.error('No organizationId in auth object for user:', auth.userId)
      return createDashboardContextErrorResponse(400, 'Error de contexto de organizacion')
    }

    const supabase = await createClient()
    logger.log('Fetching dashboard data for user:', auth.userId, 'org:', auth.organizationId)
    const initialData = await getInitialDashboardData(supabase, auth.userId, auth.organizationId)
    logger.debug('Teams found for org:', auth.organizationId, 'teams:', initialData.userTeamIds)

    const teamAssignments = await getTeamCourseAssignments(supabase, initialData.userTeamIds)
    const { combinedAssignments, courseIds } = buildCombinedAssignments(initialData.directAssignments, teamAssignments)
    const { enrollmentsMap, instructorMap } = await getCourseMetadata(supabase, auth.userId, courseIds, combinedAssignments)
    const certificatesMap = buildCertificatesMap(initialData.certificates)
    const stats = buildDashboardStats(combinedAssignments, enrollmentsMap, initialData.certificates.length)
    const courses = buildAssignedCourses(combinedAssignments, enrollmentsMap, instructorMap, certificatesMap)
    await sortCoursesByLearningPathPosition(supabase, courses)

    logger.log('Dashboard data prepared:', { stats, coursesCount: courses.length })
    return NextResponse.json(
      { success: true, stats, courses },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
    )
  } catch (error) {
    logger.error('Error in /api/business-user/dashboard:', error)
    return createDashboardFailureResponse()
  }
}
