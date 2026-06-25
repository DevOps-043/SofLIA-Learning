import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationService } from '../notification.service'

vi.mock('../notification', () => ({
  createNotification: vi.fn(),
  getUserNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markMultipleNotificationsAsRead: vi.fn(),
  archiveNotification: vi.fn(),
  deleteNotification: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  getRecentActivity: vi.fn(),
}))

import {
  archiveNotification,
  createNotification,
  deleteNotification,
  getRecentActivity,
  getUnreadCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markMultipleNotificationsAsRead,
  markNotificationAsRead,
} from '../notification'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeNotification(overrides = {}) {
  return {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'info',
    title: 'Test notification',
    message: 'Test message',
    read_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createNotification ───────────────────────────────────────────────────────

describe('NotificationService.createNotification', () => {
  it('delegates to createNotification function', async () => {
    const notif = makeNotification()
    vi.mocked(createNotification).mockResolvedValue(notif)
    const params = { user_id: 'user-1', type: 'info', title: 'Title', message: 'Msg' }

    const result = await NotificationService.createNotification(params)

    expect(createNotification).toHaveBeenCalledWith(params)
    expect(result).toEqual(notif)
  })
})

// ─── getUserNotifications ─────────────────────────────────────────────────────

describe('NotificationService.getUserNotifications', () => {
  it('delegates to getUserNotifications with userId', async () => {
    const expected = {
      notifications: [makeNotification()],
      total: 1,
      hasMore: false,
      nextCursor: null,
    }
    vi.mocked(getUserNotifications).mockResolvedValue(expected)

    const result = await NotificationService.getUserNotifications('user-1')

    expect(getUserNotifications).toHaveBeenCalledWith('user-1', undefined)
    expect(result).toEqual(expected)
  })

  it('passes filters to getUserNotifications', async () => {
    vi.mocked(getUserNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      hasMore: false,
      nextCursor: null,
    })
    const filters = { type: 'info', unreadOnly: true }

    await NotificationService.getUserNotifications('user-1', filters)

    expect(getUserNotifications).toHaveBeenCalledWith('user-1', filters)
  })
})

// ─── getUnreadCount ───────────────────────────────────────────────────────────

describe('NotificationService.getUnreadCount', () => {
  it('delegates to getUnreadCount and returns counts', async () => {
    const counts = { total: 5, critical: 1, high: 2 }
    vi.mocked(getUnreadCount).mockResolvedValue(counts)

    const result = await NotificationService.getUnreadCount('user-1')

    expect(getUnreadCount).toHaveBeenCalledWith('user-1')
    expect(result).toEqual(counts)
  })
})

// ─── markAsRead ───────────────────────────────────────────────────────────────

describe('NotificationService.markAsRead', () => {
  it('delegates to markNotificationAsRead', async () => {
    const updated = { notificationId: 'notif-1', status: 'read' as const, updated: true }
    vi.mocked(markNotificationAsRead).mockResolvedValue(updated)

    const result = await NotificationService.markAsRead('notif-1', 'user-1')

    expect(markNotificationAsRead).toHaveBeenCalledWith('notif-1', 'user-1')
    expect(result).toEqual(updated)
  })
})

// ─── markMultipleAsRead ───────────────────────────────────────────────────────

describe('NotificationService.markMultipleAsRead', () => {
  it('delegates to markMultipleNotificationsAsRead', async () => {
    vi.mocked(markMultipleNotificationsAsRead).mockResolvedValue({ updated: 3 })

    const result = await NotificationService.markMultipleAsRead(
      ['n-1', 'n-2', 'n-3'],
      'user-1',
    )

    expect(markMultipleNotificationsAsRead).toHaveBeenCalledWith(
      ['n-1', 'n-2', 'n-3'],
      'user-1',
    )
    expect(result).toEqual({ updated: 3 })
  })
})

// ─── markAllAsRead ────────────────────────────────────────────────────────────

describe('NotificationService.markAllAsRead', () => {
  it('delegates to markAllNotificationsAsRead', async () => {
    vi.mocked(markAllNotificationsAsRead).mockResolvedValue({ updated: 10 })

    const result = await NotificationService.markAllAsRead('user-1')

    expect(markAllNotificationsAsRead).toHaveBeenCalledWith('user-1')
    expect(result).toEqual({ updated: 10 })
  })
})

// ─── archiveNotification ──────────────────────────────────────────────────────

describe('NotificationService.archiveNotification', () => {
  it('delegates to archiveNotification function', async () => {
    const archived = { notificationId: 'notif-1', status: 'archived' as const, updated: true }
    vi.mocked(archiveNotification).mockResolvedValue(archived)

    const result = await NotificationService.archiveNotification('notif-1', 'user-1')

    expect(archiveNotification).toHaveBeenCalledWith('notif-1', 'user-1')
    expect(result).toEqual(archived)
  })
})

// ─── deleteNotification ───────────────────────────────────────────────────────

describe('NotificationService.deleteNotification', () => {
  it('delegates to deleteNotification function', async () => {
    vi.mocked(deleteNotification).mockResolvedValue({
      notificationId: 'notif-1',
      deleted: true,
    })

    const result = await NotificationService.deleteNotification('notif-1', 'user-1')

    expect(deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1')
    expect(result).toEqual({ notificationId: 'notif-1', deleted: true })
  })

  it('propagates deletion errors', async () => {
    vi.mocked(deleteNotification).mockRejectedValue(new Error('Not found'))

    await expect(
      NotificationService.deleteNotification('notif-1', 'user-1'),
    ).rejects.toThrow('Not found')
  })
})

// ─── getRecentActivity ────────────────────────────────────────────────────────

describe('NotificationService.getRecentActivity', () => {
  it('delegates to getRecentActivity with default limit of 10', async () => {
    vi.mocked(getRecentActivity).mockResolvedValue([])

    await NotificationService.getRecentActivity()

    expect(getRecentActivity).toHaveBeenCalledWith(10)
  })

  it('passes custom limit to getRecentActivity', async () => {
    vi.mocked(getRecentActivity).mockResolvedValue([])

    await NotificationService.getRecentActivity(25)

    expect(getRecentActivity).toHaveBeenCalledWith(25)
  })

  it('returns activity list', async () => {
    const activity = [{ id: '1', action: 'login' }, { id: '2', action: 'update' }]
    vi.mocked(getRecentActivity).mockResolvedValue(activity)

    const result = await NotificationService.getRecentActivity(2)

    expect(result).toEqual(activity)
  })
})
