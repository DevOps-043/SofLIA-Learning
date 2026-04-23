import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { DEFAULT_PERIOD } from './constants'
import { getCommunityStats } from './community-stats'
import { getCourseStats } from './course-stats'
import { getDateRange } from './date-range'
import { getHrStats } from './hr-stats'
import { getInstructorAssetIds } from './instructor-assets'
import { getNewsStats } from './news-stats'
import { getReelsStats } from './reels-stats'

export async function handleDetailedInstructorStatsRequest(request: NextRequest) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const period = new URL(request.url).searchParams.get('period') || DEFAULT_PERIOD
    const { startDate, endDate } = getDateRange(period)

    logger.log('Obteniendo estadisticas detalladas del instructor:', auth.userId, 'periodo:', period)
    const { courseIds, communityIds } = await getInstructorAssetIds(supabase, auth.userId)
    const [hr, courses, communities, news, reels] = await Promise.all([
      getHrStats(supabase, courseIds, communityIds, startDate, endDate),
      getCourseStats(supabase, auth.userId, courseIds, startDate, endDate),
      getCommunityStats(supabase, auth.userId, communityIds, startDate, endDate),
      getNewsStats(supabase, auth.userId, startDate, endDate),
      getReelsStats(supabase, auth.userId, startDate, endDate),
    ])

    logger.log('Estadisticas detalladas obtenidas exitosamente')
    return NextResponse.json(
      {
        period,
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        hr,
        courses,
        communities,
        news,
        reels,
      },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } },
    )
  } catch (error) {
    logger.error('Error obteniendo estadisticas detalladas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
