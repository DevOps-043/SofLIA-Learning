import { NextResponse } from 'next/server'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { getBusinessUserDashboardData } from './dashboard/service'

const EMPTY_DASHBOARD_STATS = {
  total_assigned: 0,
  in_progress: 0,
  completed: 0,
  certificates: 0,
}

export async function GET() {
  try {
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      logger.error('Auth failed in business-user/dashboard:', auth.status)
      return auth
    }

    if (!auth.userId) {
      logger.error('No userId in auth object')
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    if (!auth.organizationId) {
      logger.error('No organizationId in auth object for user:', auth.userId)
      return NextResponse.json(
        { success: false, error: 'Error de contexto de organización' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const dashboardData = await getBusinessUserDashboardData(
      supabase,
      auth.userId,
      auth.organizationId
    )

    return NextResponse.json(
      { success: true, stats: dashboardData.stats, courses: dashboardData.courses },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    logger.error('💥 Error in /api/business-user/dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos del dashboard',
        stats: EMPTY_DASHBOARD_STATS,
        courses: [],
      },
      { status: 500 }
    )
  }
}
