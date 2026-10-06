import { NextRequest, NextResponse } from 'next/server'
import { loadBusinessUserLearningPaths } from '@/features/learning-paths/services/learning-path-dashboard.server'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'
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

    // Finish default assignments before reading the dashboard snapshot.
    await LearningPathDefaultsService.applyDefaultRulesForUser({
      userId: auth.userId,
      organizationId: auth.organizationId,
    }).catch((err: unknown) => {
      logger.error('Error applying default learning paths for dashboard:', err)
    })

    await CourseDefaultsService.applyDefaultRulesForUser({
      userId: auth.userId,
      organizationId: auth.organizationId,
    }).catch((err: unknown) => {
      logger.error('Error applying default courses for dashboard:', err)
    })

    const [baseData, learningPaths, orgResult] = await Promise.all([
      fetchDashboardBaseData(supabase, auth),
      loadBusinessUserLearningPaths({
        userId: auth.userId,
        organizationId: auth.organizationId,
      }),
      supabase
        .from('organizations')
        .select('id, name, slug, logo_url, brand_logo_url, brand_favicon_url, show_navbar_name')
        .eq('id', auth.organizationId)
        .eq('is_active', true)
        .single(),
    ])

    // Phase 2: enrichment queries need courseIds/instructorIds from Phase 1.
    const enrichment = await fetchDashboardEnrichment(supabase, auth, baseData, learningPaths)

    const stats = buildDashboardStats(baseData.combinedAssignments, enrichment.enrollmentsMap, baseData.certificates)
    const courses = mapAssignmentsToCourses(baseData.combinedAssignments, {
      certificatesMap: baseData.certificatesMap,
      enrollmentsMap: enrichment.enrollmentsMap,
      instructorMap: enrichment.instructorMap,
    })

    applyLearningPathOrder(courses, enrichment.learningPaths)

    const org = orgResult.data
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
      organization: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo_url: org.logo_url,
            brand_logo_url: org.brand_logo_url,
            favicon_url: org.brand_favicon_url,
            show_navbar_name: org.show_navbar_name,
          }
        : null,
    }, {
      // Assignment data is personalized and changes when admins assign/revoke LPs or courses.
      // Never serve stale data from the browser cache — freshness is critical here.
      headers: cacheHeaders.private,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business-user/dashboard:', error)
    return errorDashboardResponse()
  }
}
