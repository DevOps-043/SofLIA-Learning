import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { NotificationService } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/notifications/mark-all-read
 * Marca todas las notificaciones no leídas del usuario como leídas
 */
export async function POST(request: NextRequest) {
  try {
    void request

    // Obtener usuario autenticado
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Marcar todas como leídas
    const supabase = createAdminClient()
    const { updated } = await NotificationService.markAllAsRead(
      user.id,
      supabase,
    )

    return NextResponse.json({
      success: true,
      data: {
        updated
      }
    })
  } catch (error) {
    logger.error('Error en POST /api/notifications/mark-all-read:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar todas como leídas'
      },
      { status: 500 }
    )
  }
}
