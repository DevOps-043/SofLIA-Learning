import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationService } from '../notifications.service'
import type { NotificationRepository } from '../notifications.repository'
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

function createRepositoryMock(): NotificationRepository {
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

describe('NotificationService', () => {
  let repository: NotificationRepository
  let service: NotificationService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new NotificationService(repository)
  })

  it('normalizes filters before fetching notifications', async () => {
    vi.mocked(repository.findForUser).mockResolvedValue({
      notifications: [createNotification()],
      total: 1,
    })

    const result = await service.getUserNotifications('user-1', {
      limit: 250,
      offset: -5,
      orderDirection: 'asc',
    })

    expect(repository.findForUser).toHaveBeenCalledWith('user-1', {
      limit: 100,
      offset: 0,
      orderBy: 'created_at',
      orderDirection: 'asc',
      priority: undefined,
      notificationType: undefined,
      status: undefined,
    })
    expect(result.hasMore).toBe(false)
  })

  it('returns the existing notification when it is already read', async () => {
    const notification = createNotification({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    vi.mocked(repository.findByIdForUser).mockResolvedValue(notification)

    const result = await service.markAsRead('notif-1', 'user-1')

    expect(result).toEqual(notification)
    expect(repository.updateForUser).not.toHaveBeenCalled()
  })

  it('marks unread notifications as read', async () => {
    const updatedNotification = createNotification({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    vi.mocked(repository.findByIdForUser).mockResolvedValue(createNotification())
    vi.mocked(repository.updateForUser).mockResolvedValue(updatedNotification)

    const result = await service.markAsRead('notif-1', 'user-1')

    expect(repository.updateForUser).toHaveBeenCalled()
    expect(result.status).toBe('read')
  })

  it('throws when the notification does not belong to the user', async () => {
    vi.mocked(repository.findByIdForUser).mockResolvedValue(null)

    await expect(service.deleteNotification('notif-1', 'user-1')).rejects.toThrow(
      'Notificacion no encontrada o no pertenece al usuario',
    )
  })

  it('avoids duplicate notifications inside the protected window', async () => {
    vi.mocked(repository.findRecentDuplicate).mockResolvedValue(true)

    await expect(
      service.createNotification({
        userId: 'user-1',
        notificationType: 'system_login_success',
        title: 'Inicio de sesion',
        message: 'Acceso correcto',
      }),
    ).rejects.toThrow('Notificacion duplicada evitada')

    expect(repository.create).not.toHaveBeenCalled()
  })

  it('delegates unread count and mark-all-read operations', async () => {
    vi.mocked(repository.getUnreadCount).mockResolvedValue({
      total: 3,
      critical: 1,
      high: 1,
    })
    vi.mocked(repository.markAllAsRead).mockResolvedValue({ updated: 3 })

    const counts = await service.getUnreadCount('user-1')
    const result = await service.markAllAsRead('user-1')

    expect(counts).toEqual({ total: 3, critical: 1, high: 1 })
    expect(result).toEqual({ updated: 3 })
  })
})
