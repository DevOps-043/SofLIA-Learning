import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../../../lib/utils/logger'
import { requireAdmin } from '../../../../../lib/auth/requireAdmin'
import { createClient } from '../../../../../lib/supabase/server'
import { fromLoose } from '../../../../../lib/supabase/looseQuery'

export const dynamic = 'force-dynamic'

interface AdminAppStatsRow {
  like_count: number | null
  rating: number | null
  rating_count: number | null
  view_count: number | null
}

function appsTable(client: unknown) {
  return fromLoose<AdminAppStatsRow, Record<string, unknown>>(client, 'ai_apps')
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const [
      { count: totalApps, error: totalError },
      { count: activeApps, error: activeError },
      { count: featuredApps, error: featuredError },
      { count: verifiedApps, error: verifiedError },
      { data: statsData, error: statsError },
    ] = await Promise.all([
      appsTable(supabase).select('view_count', { count: 'exact', head: true }),
      appsTable(supabase)
        .select('view_count', { count: 'exact', head: true })
        .eq('is_active', true),
      appsTable(supabase)
        .select('view_count', { count: 'exact', head: true })
        .eq('is_featured', true),
      appsTable(supabase)
        .select('view_count', { count: 'exact', head: true })
        .eq('is_verified', true),
      appsTable(supabase)
        .select('like_count, view_count, rating, rating_count')
        .eq('is_active', true),
    ])

    if (totalError) logger.warn('Error counting total apps:', totalError)
    if (activeError) logger.warn('Error counting active apps:', activeError)
    if (featuredError) logger.warn('Error counting featured apps:', featuredError)
    if (verifiedError) logger.warn('Error counting verified apps:', verifiedError)
    if (statsError) logger.warn('Error fetching app stats:', statsError)

    const stats = statsData ?? []
    const totalLikes = stats.reduce((sum, app) => sum + (app.like_count ?? 0), 0)
    const totalViews = stats.reduce((sum, app) => sum + (app.view_count ?? 0), 0)
    const validRatings = stats.filter((app) => (app.rating ?? 0) > 0)
    const averageRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, app) => sum + (app.rating ?? 0), 0) /
          validRatings.length
        : 0

    return NextResponse.json({
      stats: {
        totalApps: totalApps ?? 0,
        activeApps: activeApps ?? 0,
        featuredApps: featuredApps ?? 0,
        totalLikes,
        totalViews,
        averageRating: Math.round(averageRating * 10) / 10,
        verifiedApps: verifiedApps ?? 0,
      },
    })
  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
