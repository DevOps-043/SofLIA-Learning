import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveNotification,
  deleteNotification,
  markAllNotificationsAsRead,
  markMultipleNotificationsAsRead,
  markNotificationAsRead,
} from '../notification/actions.service'

vi.mock('server-only', () => ({}))
vi.mock('../../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('../auto-notifications-server-client', () => ({
  getServerClient: vi.fn(),
}))
vi.mock('../notification/utils', () => ({
  buildNotificationsActiveFilter: vi.fn(() => 'expires_at.is.null,expires_at.gte.now()'),
}))

import { getServerClient } from '../auto-notifications-server-client'

function rpcSingle(data: unknown = null, error: unknown = { message: 'RPC unavailable' }) {
  return vi.fn(() => ({
    single: vi.fn().mockResolvedValue({ data, error }),
  }))
}

function makeStatusFallbackSupabase({
  rpcData = null,
  rpcError = { message: 'RPC unavailable' },
  updateData = { notification_id: 'notif-1', status: 'read' },
  updateError = null,
  existingData = { notification_id: 'notif-1', status: 'read' },
  existingError = null,
}: {
  rpcData?: unknown
  rpcError?: unknown
  updateData?: unknown
  updateError?: unknown
  existingData?: unknown
  existingError?: unknown
} = {}) {
  const updateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: updateData, error: updateError }),
  }
  const existingChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existingData, error: existingError }),
  }

  let fromCallCount = 0
  return {
    rpc: rpcSingle(rpcData, rpcError),
    from: vi.fn(() => {
      fromCallCount += 1
      return fromCallCount === 1 ? updateChain : existingChain
    }),
    existingChain,
    updateChain,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('markNotificationAsRead', () => {
  it('uses the RPC result when available', async () => {
    const supabase = makeStatusFallbackSupabase({
      rpcData: { notification_id: 'notif-1', status: 'read', updated: true },
      rpcError: null,
    })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await markNotificationAsRead('notif-1', 'user-1')

    expect(supabase.rpc).toHaveBeenCalledWith('mark_notification_read', {
      p_notification_id: 'notif-1',
      p_user_id: 'user-1',
    })
    expect(supabase.from).not.toHaveBeenCalled()
    expect(result).toEqual({
      notificationId: 'notif-1',
      status: 'read',
      updated: true,
    })
  })

  it('falls back to a single ownership-safe update when RPC is unavailable', async () => {
    const supabase = makeStatusFallbackSupabase()
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await markNotificationAsRead('notif-1', 'user-1')

    expect(supabase.updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
    expect(supabase.updateChain.eq).toHaveBeenCalledWith('notification_id', 'notif-1')
    expect(supabase.updateChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(supabase.updateChain.neq).toHaveBeenCalledWith('status', 'read')
    expect(result).toEqual({
      notificationId: 'notif-1',
      status: 'read',
      updated: true,
    })
  })

  it('returns updated false when the notification is already read', async () => {
    const supabase = makeStatusFallbackSupabase({ updateData: null })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await markNotificationAsRead('notif-1', 'user-1')

    expect(supabase.existingChain.select).toHaveBeenCalledWith('notification_id, status')
    expect(result).toEqual({
      notificationId: 'notif-1',
      status: 'read',
      updated: false,
    })
  })

  it('throws when notification is not owned by the user', async () => {
    const supabase = makeStatusFallbackSupabase({
      updateData: null,
      existingData: null,
    })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(markNotificationAsRead('notif-x', 'user-1')).rejects.toThrow(
      'Notificacion no encontrada o no pertenece al usuario',
    )
  })
})

describe('markMultipleNotificationsAsRead', () => {
  it('returns { updated: 0 } when notificationIds is empty', async () => {
    vi.mocked(getServerClient).mockResolvedValue({} as any)

    const result = await markMultipleNotificationsAsRead([], 'user-1')

    expect(result).toEqual({ updated: 0 })
  })

  it('updates notifications and returns count', async () => {
    const updated = [{ notification_id: 'n-1' }, { notification_id: 'n-2' }]
    const chain = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    vi.mocked(getServerClient).mockResolvedValue({ from: vi.fn().mockReturnValue(chain) } as any)

    const result = await markMultipleNotificationsAsRead(['n-1', 'n-2'], 'user-1')

    expect(chain.in).toHaveBeenCalledWith('notification_id', ['n-1', 'n-2'])
    expect(result).toEqual({ updated: 2 })
  })
})

describe('markAllNotificationsAsRead', () => {
  it('uses the provided server client and falls back when the RPC is unavailable', async () => {
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ count: 2, error: null }),
    }
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ error: null }),
    }
    let fromCallCount = 0
    const supabase = {
      rpc: rpcSingle(null, { message: 'Function not found' }),
      from: vi.fn(() => {
        fromCallCount += 1
        return fromCallCount === 1 ? countChain : updateChain
      }),
    }

    const result = await markAllNotificationsAsRead('user-1', {
      supabase: supabase as any,
    })

    expect(getServerClient).not.toHaveBeenCalled()
    expect(supabase.rpc).toHaveBeenCalledWith('mark_all_notifications_read', {
      p_user_id: 'user-1',
    })
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
    expect(result).toEqual({ updated: 2 })
  })

  it('returns the RPC count when available', async () => {
    const supabase = {
      rpc: rpcSingle({ updated_count: 4 }, null),
      from: vi.fn(),
    }

    const result = await markAllNotificationsAsRead('user-1', {
      supabase: supabase as any,
    })

    expect(supabase.from).not.toHaveBeenCalled()
    expect(result).toEqual({ updated: 4 })
  })
})

describe('archiveNotification', () => {
  it('archives notification through fallback update when RPC is unavailable', async () => {
    const supabase = makeStatusFallbackSupabase({
      updateData: { notification_id: 'notif-1', status: 'archived' },
      existingData: { notification_id: 'notif-1', status: 'archived' },
    })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await archiveNotification('notif-1', 'user-1')

    expect(supabase.updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'archived' }),
    )
    expect(result).toEqual({
      notificationId: 'notif-1',
      status: 'archived',
      updated: true,
    })
  })
})

describe('deleteNotification', () => {
  it('returns compact delete result from RPC', async () => {
    const supabase = {
      rpc: rpcSingle({ notification_id: 'notif-1', deleted: true }, null),
      from: vi.fn(),
    }
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await deleteNotification('notif-1', 'user-1')

    expect(result).toEqual({ notificationId: 'notif-1', deleted: true })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('deletes notification through fallback with ownership in the delete statement', async () => {
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { notification_id: 'notif-1' },
        error: null,
      }),
    }
    const supabase = {
      rpc: rpcSingle(null, { message: 'RPC unavailable' }),
      from: vi.fn().mockReturnValue(deleteChain),
    }
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await deleteNotification('notif-1', 'user-1')

    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('notification_id', 'notif-1')
    expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual({ notificationId: 'notif-1', deleted: true })
  })
})
