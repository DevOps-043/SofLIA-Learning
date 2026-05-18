import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '../../../../../features/notifications/services/notification.service'
import { requireAdmin } from '../../../../../lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const notifications = await NotificationService.getRecentActivity(limit)

    return NextResponse.json({
      success: true,
      activities: notifications
    })
  } catch (error: unknown) {
    techDebtLogger.error('Error in GET /api/admin/activity/recent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener actividad reciente',
        activities: []
      },
      { status: 500 }
    )
  }
}
