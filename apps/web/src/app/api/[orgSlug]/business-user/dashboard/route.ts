import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'
import { resolveDashboardAuth } from './dashboard/dashboard-auth'
import { fetchDashboardBaseData } from './dashboard/dashboard-base-data'
import { mapAssignmentsToCourses } from './dashboard/dashboard-course.mapper'
import { fetchDashboardEnrichment } from './dashboard/dashboard-enrichment'
import { applyLearningPathOrder } from './dashboard/dashboard-learning-path-order'
import { errorDashboardResponse } from './dashboard/dashboard-responses'
import { buildDashboardStats } from './dashboard/dashboard-stats'
import type { RouteContext } from './dashboard/dashboard.types'

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await resolveDashboardAuth(context)
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const baseData = await fetchDashboardBaseData(supabase, auth)
    const enrichment = await fetchDashboardEnrichment(supabase, auth, baseData)
    const stats = buildDashboardStats(baseData.combinedAssignments, enrichment.enrollmentsMap, baseData.certificates)
    const courses = mapAssignmentsToCourses(baseData.combinedAssignments, {
      certificatesMap: baseData.certificatesMap,
      enrollmentsMap: enrichment.enrollmentsMap,
      instructorMap: enrichment.instructorMap,
    })

    applyLearningPathOrder(courses, enrichment.learningPaths)

    logger.log('Dashboard data prepared:', {
      stats,
      coursesCount: courses.length,
      learningPathsCount: enrichment.learningPaths.length,
      orgSlug: auth.orgSlug,
    })

    return NextResponse.json({
      success: true,
      stats,
      courses,
      learningPaths: enrichment.learningPaths,
    }, {
      headers: cacheHeaders.privateShort,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business-user/dashboard:', error)
    return errorDashboardResponse()
  }
}
