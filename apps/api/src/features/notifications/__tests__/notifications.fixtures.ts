import { vi } from 'vitest'

import type { NotificationRepository } from '../notifications.repository'
import type { Notification } from '../notifications.types'

export function createNotification(
  overrides: Partial<Notification> = {},
): Notification {
  const now = new Date().toISOString()

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
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function createRepositoryMock(): NotificationRepository {
  return {
    create: vi.fn(),
    findRecentDuplicate: vi.fn(),
    findForUser: vi.fn(),
    findByIdForUser: vi.fn(),
    updateForUser: vi.fn(),
    deleteForUser: vi.fn(),
    getUnreadCount: vi.fn(),
    markAllAsRead: vi.fn(),
  }
}
