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

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = notificationListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    )

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parametros de consulta invalidos',
          details: formatValidationError(parsedQuery.error),
        },
        { status: 400 },
      )
    }

    const { limit, offset, ...queryFilters } = parsedQuery.data
    const filters: NotificationFilters = {
      ...queryFilters,
      limit,
      offset,
    }

    const { notifications, total, hasMore, nextCursor } =
      await NotificationService.getUserNotifications(user.id, filters)

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: {
          notifications,
          total,
          limit,
          offset,
          hasMore,
          nextCursor,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
        },
      },
    )
  } catch (error) {
    logger.error('Error en GET /api/notifications:', error)
    return NextResponse.json({
      success: true,
      data: {
        notifications: [],
        total: 0,
        limit: 0,
        offset: 0,
        hasMore: false,
        nextCursor: null,
      },
      error:
        error instanceof Error
          ? error.message
          : 'Error al obtener notificaciones',
    })
  }
}
