import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '../../../../../features/notifications/services/notification.service'
import { requireAdmin } from '../../../../../lib/auth/requireAdmin'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { cacheHeaders } from '../../../../../lib/utils/cache-headers'

export const dynamic = 'force-dynamic'

const DEFAULT_RECENT_ACTIVITY_LIMIT = 10
const MAX_RECENT_ACTIVITY_LIMIT = 50

function parseRecentActivityLimit(value: string | null) {
  const parsedLimit = Number.parseInt(value ?? String(DEFAULT_RECENT_ACTIVITY_LIMIT), 10)

  if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_RECENT_ACTIVITY_LIMIT
  }

  return Math.min(parsedLimit, MAX_RECENT_ACTIVITY_LIMIT)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const limit = parseRecentActivityLimit(searchParams.get('limit'))
    const supabase = createAdminClient()

    const notifications = await NotificationService.getRecentActivity(limit, supabase)

    return NextResponse.json(
      {
        success: true,
        activities: notifications,
      },
      { headers: cacheHeaders.privateShort },
    )
  } catch (error: unknown) {
    techDebtLogger.error('Error in GET /api/admin/activity/recent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener actividad reciente',
        activities: [],
      },
      { status: 500 },
    )
  }
}
