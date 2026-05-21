import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { NotificationService } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/notifications/unread-count
 * Obtiene el conteo de notificaciones no leídas del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener conteo de no leídas
    const supabase = createAdminClient()
    const counts = await NotificationService.getUnreadCount(user.id, supabase)

    return NextResponse.json({
      success: true,
      data: counts
    })
  } catch (error) {
    // Si algo falla (por ejemplo RPC no creada), devolvemos conteo 0 para no romper el header
    logger.error('Error en GET /api/notifications/unread-count:', error)
    return NextResponse.json({
      success: true,
      data: {
        total: 0,
        critical: 0,
        high: 0
      },
      error: error instanceof Error ? error.message : 'Error al obtener conteo de notificaciones'
    })
  }
}
