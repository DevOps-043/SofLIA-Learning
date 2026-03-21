import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../../../lib/utils/logger';
import { createClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()

    // Obtener estadísticas básicas
    const { count: totalApps, error: totalError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      logger.warn('Error counting total apps:', totalError)
    }

    const { count: activeApps, error: activeError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      logger.warn('Error counting active apps:', activeError)
    }

    const { count: featuredApps, error: featuredError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)

    if (featuredError) {
      logger.warn('Error counting featured apps:', featuredError)
    }

    const { count: verifiedApps, error: verifiedError } = await supabase
      .from('ai_apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)

    if (verifiedError) {
      logger.warn('Error counting verified apps:', verifiedError)
    }

    // Obtener estadísticas agregadas
    const { data: statsData, error: statsError } = await supabase
      .from('ai_apps')
      .select('like_count, view_count, rating, rating_count')
      .eq('is_active', true)

    if (statsError) {
      logger.warn('Error fetching app stats:', statsError)
    }

    const stats = statsData || []
    const totalLikes = stats.reduce((sum: number, app: any) => sum + (app.like_count || 0), 0)
    const totalViews = stats.reduce((sum: number, app: any) => sum + (app.view_count || 0), 0)
    
    const validRatings = stats.filter((a: any) => a.rating && a.rating > 0)
    const averageRating = validRatings.length > 0 
      ? validRatings.reduce((sum: number, app: any) => sum + (app.rating || 0), 0) / validRatings.length
      : 0

    const result = {
      totalApps: totalApps || 0,
      activeApps: activeApps || 0,
      featuredApps: featuredApps || 0,
      totalLikes,
      totalViews,
      averageRating: Math.round(averageRating * 10) / 10,
      verifiedApps: verifiedApps || 0
    }

    return NextResponse.json({ stats: result })
  } catch (error: any) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
