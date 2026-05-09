import { describe, expect, it } from 'vitest'
import {
  attachUsersToNotifications,
  buildNextNotificationCursor,
  buildNotificationInsertPayload,
  encodeNotificationCursor,
  filterExpiredNotifications,
  getDuplicateNotificationWindow,
  normalizeNotificationFilters,
  parseNotificationCursor,
  shouldUseNotificationCursorPagination,
} from '../notification/utils'

describe('notification.utils', () => {
  it('returns duplicate windows only for protected notification types', () => {
    expect(getDuplicateNotificationWindow('system_login_success')).toBe(5)
    expect(getDuplicateNotificationWindow('custom_event')).toBeUndefined()
  })

  it('builds insert payload with trimmed strings and defaults', () => {
    expect(
      buildNotificationInsertPayload({
        userId: 'user-1',
        notificationType: 'custom',
        title: '  Alerta ',
        message: '  Mensaje ',
      }),
    ).toEqual({
      user_id: 'user-1',
      notification_type: 'custom',
      title: 'Alerta',
      message: 'Mensaje',
      metadata: {
        is_localized: false,
      },
      priority: 'medium',
      status: 'unread',
      channels_sent: [],
      channels_pending: [],
      organization_id: null,
      group_id: null,
    })
  })

  it('normalizes filters and clamps pagination', () => {
    expect(
      normalizeNotificationFilters({
        limit: 500,
        offset: -4,
        cursor: 'cursor-1',
      }),
    ).toMatchObject({
      limit: 100,
      offset: 0,
      cursor: 'cursor-1',
      orderBy: 'created_at',
      orderDirection: 'desc',
    })
  })

  it('encodes and decodes notification cursors', () => {
    const cursor = encodeNotificationCursor({
      created_at: '2026-04-02T10:00:00.000Z',
      notification_id: 'notif-2',
    })

    expect(cursor).toBe('2026-04-02T10:00:00.000Z::notif-2')
    expect(parseNotificationCursor(cursor)).toEqual({
      createdAt: '2026-04-02T10:00:00.000Z',
      notificationId: 'notif-2',
    })
    expect(buildNextNotificationCursor([])).toBeNull()
  })

  it('enables cursor pagination only for created_at feeds', () => {
    expect(
      shouldUseNotificationCursorPagination({
        cursor: undefined,
        offset: 0,
        orderBy: 'created_at',
      }),
    ).toBe(true)
    expect(
      shouldUseNotificationCursorPagination({
        cursor: 'cursor',
        offset: 10,
        orderBy: 'priority',
      }),
    ).toBe(false)
  })

  it('filters expired notifications and enriches with users', () => {
    const valid = filterExpiredNotifications(
      [
        { user_id: '1', expires_at: null },
        { user_id: '2', expires_at: '2026-04-02T00:00:00.000Z' },
        { user_id: '3', expires_at: '2026-03-01T00:00:00.000Z' },
      ],
      new Date('2026-04-01T00:00:00.000Z'),
    )

    const enriched = attachUsersToNotifications(valid, [
      { id: '1', name: 'Ada' },
      { id: '2', name: 'Linus' },
    ])

    expect(valid).toHaveLength(2)
    expect(enriched[0]?.users).toEqual({ id: '1', name: 'Ada' })
    expect(enriched[1]?.users).toEqual({ id: '2', name: 'Linus' })
  })
})
