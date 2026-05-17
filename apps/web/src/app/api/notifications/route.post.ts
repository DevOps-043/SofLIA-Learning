import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'

import {
  NotificationFilters,
  NotificationService,
} from '@/features/notifications/services/notification.service'

import {
  createNotificationBodySchema,
  notificationListQuerySchema,
} from '@/features/notifications/services/notification/api.schemas'

import { logger } from '@/lib/logger'

function canCreateNotifications(cargoRol: string | null | undefined) {
  return cargoRol === 'Admin'
}

function formatValidationError(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!canCreateNotifications(user.cargo_rol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado para crear notificaciones',
        },
        { status: 403 },
      )
    }

    const parsedBody = createNotificationBodySchema.safeParse(
      await request.json(),
    )

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload de notificacion invalido',
          details: formatValidationError(parsedBody.error),
        },
        { status: 400 },
      )
    }

    const notification = await NotificationService.createNotification(parsedBody.data)

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error('Error en POST /api/notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al crear notificacion',
      },
      { status: 500 },
    )
  }
}
