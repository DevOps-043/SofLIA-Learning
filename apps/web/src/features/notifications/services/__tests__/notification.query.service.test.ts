import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getServerClient } from '../auto-notifications-server-client'
import {
  getRecentActivity,
  getUserNotifications,
} from '../notification/query.service'

vi.mock('../auto-notifications-server-client', () => ({
  getServerClient: vi.fn(),
}))

vi.mock('../../../../lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

function createNotificationsRangeChain(result: {
  data: unknown[]
  count: number | null
  error: null
}) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(result),
  }
}

function createNotificationsCursorChain(result: {
  data: unknown[]
  count: number | null
  error: null
}) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  }
}

function createRecentActivityChain(result: {
  data: unknown[]
  error: null
}) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  }
}

function createUsersChain(result: {
  data: unknown[]
  error: null
}) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue(result),
  }
}

describe('notification query service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads paginated notifications with explicit columns instead of select all', async () => {
    const notificationsChain = createNotificationsRangeChain({
      data: [
        {
          notification_id: 'notif-1',
          user_id: 'user-1',
          notification_type: 'system',
          title: 'Titulo',
          message: 'Mensaje',
          metadata: {},
          priority: 'high',
          status: 'unread',
          channels_sent: [],
          channels_pending: [],
          read_at: null,
          expires_at: null,
          organization_id: null,
          group_id: null,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T10:00:00.000Z',
        },
      ],
      count: 1,
      error: null,
    })

    vi.mocked(getServerClient).mockResolvedValue({
      from: vi.fn(() => notificationsChain),
    } as never)

    const result = await getUserNotifications('user-1', {
      limit: 10,
      offset: 10,
      priority: 'high',
    })

    expect(notificationsChain.select).toHaveBeenCalledWith(
      expect.stringContaining('notification_id'),
      { count: 'exact' },
    )
    expect(notificationsChain.select).not.toHaveBeenCalledWith('*', { count: 'exact' })
    expect(notificationsChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(notificationsChain.eq).toHaveBeenCalledWith('priority', 'high')
    expect(notificationsChain.range).toHaveBeenCalledWith(10, 19)
    expect(result.total).toBe(1)
    expect(result.notifications).toHaveLength(1)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it('uses cursor pagination for created_at feeds and returns nextCursor', async () => {
    const notificationsChain = createNotificationsCursorChain({
      data: [
        {
          notification_id: 'notif-3',
          user_id: 'user-1',
          notification_type: 'system',
          title: 'Tercera',
          message: 'Mensaje 3',
          metadata: {},
          priority: 'medium',
          status: 'unread',
          channels_sent: [],
          channels_pending: [],
          read_at: null,
          expires_at: null,
          organization_id: null,
          group_id: null,
          created_at: '2026-04-03T10:00:00.000Z',
          updated_at: '2026-04-03T10:00:00.000Z',
        },
        {
          notification_id: 'notif-2',
          user_id: 'user-1',
          notification_type: 'system',
          title: 'Segunda',
          message: 'Mensaje 2',
          metadata: {},
          priority: 'medium',
          status: 'unread',
          channels_sent: [],
          channels_pending: [],
          read_at: null,
          expires_at: null,
          organization_id: null,
          group_id: null,
          created_at: '2026-04-02T10:00:00.000Z',
          updated_at: '2026-04-02T10:00:00.000Z',
        },
        {
          notification_id: 'notif-1',
          user_id: 'user-1',
          notification_type: 'system',
          title: 'Primera',
          message: 'Mensaje 1',
          metadata: {},
          priority: 'medium',
          status: 'unread',
          channels_sent: [],
          channels_pending: [],
          read_at: null,
          expires_at: null,
          organization_id: null,
          group_id: null,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T10:00:00.000Z',
        },
      ],
      count: 3,
      error: null,
    })

    vi.mocked(getServerClient).mockResolvedValue({
      from: vi.fn(() => notificationsChain),
    } as never)

    const result = await getUserNotifications('user-1', {
      limit: 2,
      orderBy: 'created_at',
      orderDirection: 'desc',
    })

    expect(notificationsChain.limit).toHaveBeenCalledWith(3)
    expect(result.notifications).toHaveLength(2)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('2026-04-02T10:00:00.000Z::notif-2')
  })

  it('hydrates recent activity with user data after filtering expired notifications', async () => {
    const notificationsChain = createRecentActivityChain({
      data: [
        {
          notification_id: 'notif-1',
          user_id: 'user-1',
          notification_type: 'system',
          title: 'Activa',
          message: 'Mensaje activo',
          metadata: {},
          priority: 'medium',
          status: 'unread',
          channels_sent: [],
          channels_pending: [],
          read_at: null,
          expires_at: null,
          organization_id: null,
          group_id: null,
          created_at: '2026-04-01T10:00:00.000Z',
          updated_at: '2026-04-01T10:00:00.000Z',
        },
        {
          notification_id: 'notif-2',
          user_id: 'user-2',
          notification_type: 'system',
          title: 'Expirada',
          message: 'Mensaje expirado',
          metadata: {},
          priority: 'low',
          status: 'read',
          channels_sent: [],
          channels_pending: [],
          read_at: null,
          expires_at: '2020-01-01T00:00:00.000Z',
          organization_id: null,
          group_id: null,
          created_at: '2026-04-01T09:00:00.000Z',
          updated_at: '2026-04-01T09:00:00.000Z',
        },
      ],
      error: null,
    })
    const usersChain = createUsersChain({
      data: [
        {
          id: 'user-1',
          first_name: 'Ana',
          last_name: 'Ruiz',
          display_name: 'Ana Ruiz',
          username: 'aruiz',
        },
      ],
      error: null,
    })

    vi.mocked(getServerClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'user_notifications') {
          return notificationsChain
        }

        if (table === 'users') {
          return usersChain
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    } as never)

    const result = await getRecentActivity(5)

    expect(notificationsChain.select).toHaveBeenCalledWith(
      expect.stringContaining('notification_id'),
    )
    expect(notificationsChain.select).not.toHaveBeenCalledWith('*')
    expect(usersChain.in).toHaveBeenCalledWith('id', ['user-1'])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      notification_id: 'notif-1',
      user_id: 'user-1',
      users: expect.objectContaining({ id: 'user-1', display_name: 'Ana Ruiz' }),
    })
  })
})
