import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createNotificationsController } from '../notifications.controller'
import { createNotificationsServiceMock, createResponse } from './notifications.controller.fixtures'

describe('notifications controller', () => {
  it('returns paginated notifications', async () => {
    const service = createNotificationsServiceMock()
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
    const service = createNotificationsServiceMock()
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
    const service = createNotificationsServiceMock()
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
