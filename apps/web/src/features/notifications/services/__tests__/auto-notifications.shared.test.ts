import { describe, expect, it, vi } from 'vitest'

vi.mock('../notification.service', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}))

import { NotificationService } from '../notification.service'
import {
  dispatchNotificationsInChunks,
  resolveNotificationActorName,
  truncateNotificationPreview,
} from '../auto-notifications.shared'

describe('auto-notifications shared helpers', () => {
  it('resolves the display name using the richest available identity field', () => {
    expect(
      resolveNotificationActorName({
        username: 'user',
        display_name: 'Display Name',
        first_name: 'First',
      }),
    ).toBe('Display Name')

    expect(
      resolveNotificationActorName({
        username: 'user',
        display_name: null,
        first_name: 'First',
      }),
    ).toBe('First')
  })

  it('truncates long previews and keeps short ones intact', () => {
    expect(truncateNotificationPreview('short')).toBe('short')
    expect(truncateNotificationPreview('a'.repeat(110), 100)).toBe(`${'a'.repeat(100)}...`)
  })

  it('dispatches notifications in deterministic chunks', async () => {
    await dispatchNotificationsInChunks(
      [
        { userId: 'user-1', notificationType: 'info', title: 'One', message: 'A' },
        { userId: 'user-2', notificationType: 'info', title: 'Two', message: 'B' },
        { userId: 'user-3', notificationType: 'info', title: 'Three', message: 'C' },
      ],
      2,
    )

    expect(NotificationService.createNotification).toHaveBeenCalledTimes(3)
    expect(NotificationService.createNotification).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      notificationType: 'info',
      title: 'One',
      message: 'A',
    })
    expect(NotificationService.createNotification).toHaveBeenNthCalledWith(3, {
      userId: 'user-3',
      notificationType: 'info',
      title: 'Three',
      message: 'C',
    })
  })
})
