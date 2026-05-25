import { NextRequest, NextResponse } from 'next/server'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { fetchCourseIdentity } from './full/full-course-loader'
import { runCourseFullQueries } from './full/full-course-queries'
import { translateCourseDetails } from './full/full-course-translation'
import { buildModulesWithLessons } from './full/full-lessons.service'
import { resolveFullCourseRequest } from './full/full-request'
import { mapCourseSkills } from './full/full-skills.mapper'
import type { FullRouteContext } from './full/full.types'

export async function GET(
  request: NextRequest,
  context: FullRouteContext,
) {
  try {
    const fullRequest = await resolveFullCourseRequest(request, context.params)
    const identity = await fetchCourseIdentity(fullRequest)

    if (identity instanceof NextResponse) return identity

    const queryResults = await runCourseFullQueries(
      fullRequest,
      identity.courseData,
      identity.courseId,
    )
    const lessonData = await buildModulesWithLessons(
      fullRequest,
      queryResults.modules,
      queryResults.enrollment,
    )
    const course = await translateCourseDetails(
      fullRequest,
      identity.courseData,
    )

    return withCacheHeaders(
      NextResponse.json({
        course,
        isPurchased: queryResults.purchaseCheck,
        modules: lessonData.modules,
        overall_progress_percentage: lessonData.overallProgress,
        skills: mapCourseSkills(queryResults.skills),
        instructor: queryResults.instructor,
      }),
      cacheHeaders.semiStatic,
    )
  } catch (error) {
    logError('GET /api/courses/[slug]/full', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener datos del curso'),
      { status: 500 },
    )
  }
}
