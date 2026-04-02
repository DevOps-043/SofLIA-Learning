import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createNotificationsController } from '../notifications.controller'
import type { Notification } from '../notifications.types'

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    notification_id: 'notif-1',
    user_id: 'user-1',
    notification_type: 'system_login_success',
    title: 'Inicio de sesion',
    message: 'Acceso correcto',
    metadata: {},
    priority: 'medium',
    status: 'unread',
    channels_sent: [],
    channels_pending: [],
    read_at: null,
    expires_at: null,
    organization_id: null,
    group_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function createResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }

  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

describe('notifications controller', () => {
  it('returns paginated notifications', async () => {
    const service = {
      getUserNotifications: vi.fn().mockResolvedValue({
        notifications: [createNotification()],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
      getUnreadCount: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      archiveNotification: vi.fn(),
      deleteNotification: vi.fn(),
    }
    const controller = createNotificationsController(
      service as unknown as never,
    )
    const response = createResponse()
    const next = vi.fn()

    await controller.listNotifications(
      {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'member',
        },
        query: {
          limit: 50,
          offset: 0,
        },
      } as unknown as Request,
      response,
      next,
    )

    expect(service.getUserNotifications).toHaveBeenCalledWith('user-1', {
      limit: 50,
      offset: 0,
    })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 204 after deleting a notification', async () => {
    const service = {
      getUserNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      archiveNotification: vi.fn(),
      deleteNotification: vi.fn().mockResolvedValue(undefined),
    }
    const controller = createNotificationsController(
      service as unknown as never,
    )
    const response = createResponse()
    const next = vi.fn()

    await controller.deleteNotification(
      {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'member',
        },
        params: {
          notificationId: 'notif-1',
        },
      } as unknown as Request,
      response,
      next,
    )

    expect(service.deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1')
    expect(response.status).toHaveBeenCalledWith(204)
    expect(response.send).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalled()
  })

  it('forwards missing-auth errors to next', async () => {
    const service = {
      getUserNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      archiveNotification: vi.fn(),
      deleteNotification: vi.fn(),
    }
    const controller = createNotificationsController(
      service as unknown as never,
    )
    const response = createResponse()
    const next = vi.fn()

    await controller.getUnreadCount({} as Request, response, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      }),
    )
  })
})
