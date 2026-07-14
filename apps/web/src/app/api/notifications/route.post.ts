import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { NotificationService } from '@/features/notifications/services/notification.service'
import {
  createNotificationBodySchema,
  type CreateNotificationBodyInput,
} from '@/features/notifications/services/notification/api.schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/logger'

function canCreateNotifications(cargoRol: string | null | undefined) {
  return cargoRol === 'Admin'
}

async function handlePost(
  _request: NextRequest,
  body: CreateNotificationBodyInput,
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    if (!canCreateNotifications(user.platform_role)) {
      return apiError(
        'NOTIFICATION_CREATE_FORBIDDEN',
        'No autorizado para crear notificaciones',
        403,
      )
    }

    const notification = await NotificationService.createNotification(body)

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error('Error en POST /api/notifications:', error)
    return apiError(
      'NOTIFICATION_CREATE_FAILED',
      error instanceof Error ? error.message : 'Error al crear notificacion',
      500,
    )
  }
}

export const POST = withZodBody(createNotificationBodySchema, handlePost)
