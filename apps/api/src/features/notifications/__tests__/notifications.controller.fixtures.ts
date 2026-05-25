import type { Response } from 'express'
import { vi } from 'vitest'

import { createNotification } from './notifications.fixtures'

export function createResponse() {
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

export function createNotificationsServiceMock() {
  return {
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
    deleteNotification: vi.fn().mockResolvedValue(undefined),
  }
}
