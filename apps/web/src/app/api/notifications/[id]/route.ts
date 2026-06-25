import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'
import { resolveNotificationRequestContext } from '../_lib/request-context'

/**
 * DELETE /api/notifications/[id]
 * Elimina una notificacion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    void request

    const context = await resolveNotificationRequestContext()
    if (!context) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      )
    }

    const { id: notificationId } = await params

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de notificacion requerido',
        },
        { status: 400 },
      )
    }

    const mutation = await NotificationService.deleteNotification(
      notificationId,
      context.userId,
      context.supabase,
    )

    return NextResponse.json({
      success: true,
      data: mutation,
      message: 'Notificacion eliminada exitosamente',
    })
  } catch (error) {
    logger.error('Error en DELETE /api/notifications/[id]:', error)

    if (error instanceof Error && error.message.includes('no encontrada')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al eliminar notificacion',
      },
      { status: 500 },
    )
  }
}
