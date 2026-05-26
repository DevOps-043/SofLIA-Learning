import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'
import { resolveNotificationRequestContext } from '../_lib/request-context'

/**
 * POST /api/notifications/mark-all-read
 * Marca todas las notificaciones no leídas del usuario como leídas
 */
export async function POST(request: NextRequest) {
  try {
    void request

    // Obtener usuario autenticado
    const context = await resolveNotificationRequestContext()
    if (!context) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Marcar todas como leídas
    const { updated } = await NotificationService.markAllAsRead(
      context.userId,
      context.supabase,
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
