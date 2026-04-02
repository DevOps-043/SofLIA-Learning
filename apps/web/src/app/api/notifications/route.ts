import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import {
  NotificationFilters,
  NotificationService,
} from '@/features/notifications/services/notification.service'
import { parseNotificationCursor } from '@/features/notifications/services/notification/utils'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as
      | 'unread'
      | 'read'
      | 'archived'
      | null
    const notificationType = searchParams.get('type') || undefined
    const priority = searchParams.get('priority') as
      | 'critical'
      | 'high'
      | 'medium'
      | 'low'
      | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const cursor = searchParams.get('cursor') || undefined
    const orderBy = (searchParams.get('orderBy') || 'created_at') as
      | 'created_at'
      | 'priority'
      | 'status'
    const orderDirection = (searchParams.get('orderDirection') || 'desc') as
      | 'asc'
      | 'desc'

    if (cursor && !parseNotificationCursor(cursor)) {
      return NextResponse.json(
        {
          success: false,
          error: 'cursor invalido',
        },
        { status: 400 },
      )
    }

    const filters: NotificationFilters = {
      status: status || undefined,
      notificationType,
      priority: priority || undefined,
      limit,
      offset,
      cursor,
      orderBy,
      orderDirection,
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

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      notificationType,
      title,
      message,
      metadata,
      priority,
      organizationId,
      groupId,
    } = body

    if (!userId || !notificationType || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Faltan campos requeridos: userId, notificationType, title, message',
        },
        { status: 400 },
      )
    }

    const notification = await NotificationService.createNotification({
      userId,
      notificationType,
      title,
      message,
      metadata,
      priority,
      organizationId,
      groupId,
    })

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
