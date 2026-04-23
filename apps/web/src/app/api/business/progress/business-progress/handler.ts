import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessProgressAccess } from './auth'
import { buildProgressCharts } from './charts'
import { fetchCourseInfoMap } from './course-info'
import { buildCourseSummaries } from './course-summaries'
import { fetchDashboardProgressData } from './dashboard-queries'
import { createEmptyProgressResponse } from './empty-response'
import { fetchActiveOrganizationUsers } from './organization-users'
import { buildProgressStats } from './stats'
import { buildUserSummaries } from './user-summaries'

export async function handleBusinessProgressRequest() {
  try {
    const auth = await requireBusinessProgressAccess()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const orgUsers = await fetchActiveOrganizationUsers(supabase, auth.organizationId)
    if (orgUsers instanceof NextResponse) return orgUsers

    const userIds = orgUsers.map((organizationUser) => organizationUser.user_id)
    if (userIds.length === 0) return createEmptyProgressResponse()

    const progressData = await fetchDashboardProgressData(
      supabase,
      auth.organizationId,
      userIds,
    )
    const courseInfoMap = await fetchCourseInfoMap(supabase, progressData.assignments)
    const courses = buildCourseSummaries(progressData, courseInfoMap)
    const users = buildUserSummaries(orgUsers, progressData)

    return NextResponse.json({
      success: true,
      stats: buildProgressStats(userIds.length, progressData),
      courses,
      users,
      charts: buildProgressCharts(progressData, courses, users),
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas de progreso del equipo',
      },
      { status: 500 },
    )
  }
}
