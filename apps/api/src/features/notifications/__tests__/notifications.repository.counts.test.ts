import { describe, expect, it, vi } from 'vitest'

import { getUnreadCount } from '../notifications.repository.counts'

describe('notifications repository unread counts', () => {
  it('uses the deployed get_unread_notification_counts RPC', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { total: 7, critical: 2, high: 3 },
      error: null,
    })
    const rpc = vi.fn(() => ({ single }))

    const result = await getUnreadCount({ rpc } as never, 'user-1')

    expect(rpc).toHaveBeenCalledWith('get_unread_notification_counts', {
      p_user_id: 'user-1',
    })
    expect(single).toHaveBeenCalledOnce()
    expect(result).toEqual({ total: 7, critical: 2, high: 3 })
  })
})
