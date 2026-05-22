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

// ─── helpers ────────────────────────────────────────────────────────────────

function makeNotif(overrides = {}) {
  return {
    notification_id: 'notif-1',
    user_id: 'user-1',
    status: 'unread',
    priority: 'medium',
    title: 'Test',
    message: 'Test message',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Builds a supabase mock that handles the ensureNotificationOwnership chain:
 * .from().select().eq().eq().single()  → returns { data: ownershipData, error }
 * Then a second .from() for the actual operation.
 */
function makeSupabase({
  ownershipData = makeNotif(),
  ownershipError = null,
  updateData = makeNotif({ status: 'read' }),
  updateError = null,
  deleteError = null,
}: {
  ownershipData?: unknown
  ownershipError?: unknown
  updateData?: unknown
  updateError?: unknown
  deleteError?: unknown
} = {}) {
  // ownership chain: .select().eq().eq().single()
  const ownershipChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: ownershipData, error: ownershipError }),
  }

  // update/delete chain: .update/delete().eq().eq().select().single() or just .eq()
  const operationChain = {
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: updateData, error: updateError }),
    in: vi.fn().mockReturnThis(),
  }
  if (deleteError) {
    operationChain.eq = vi.fn().mockReturnThis()
    // last .eq() in delete chain resolves with error
    operationChain.single = vi.fn().mockResolvedValue({ error: deleteError })
  }

  let callCount = 0
  const fromMock = vi.fn(() => {
    callCount++
    return callCount === 1 ? ownershipChain : operationChain
  })

  return { from: fromMock, ownershipChain, operationChain }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── markNotificationAsRead ───────────────────────────────────────────────────

describe('markNotificationAsRead', () => {
  it('marks unread notification as read', async () => {
    const updated = makeNotif({ status: 'read', read_at: new Date().toISOString() })
    const supabase = makeSupabase({ ownershipData: makeNotif({ status: 'unread' }), updateData: updated })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await markNotificationAsRead('notif-1', 'user-1')

    expect(supabase.operationChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
    expect(result).toMatchObject({ status: 'read' })
  })

  it('returns existing notification without update when already read', async () => {
    const existing = makeNotif({ status: 'read' })
    // For already-read: first call is ownership, second is select(*) for the full data
    let callCount = 0
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existing, error: null }),
    }
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existing, error: null }),
    }
    const fromMock = vi.fn(() => {
      callCount++
      return callCount === 1 ? ownershipChain : selectChain
    })
    vi.mocked(getServerClient).mockResolvedValue({ from: fromMock } as any)

    const result = await markNotificationAsRead('notif-1', 'user-1')

    expect(result).toMatchObject({ status: 'read' })
    expect(selectChain.select).toHaveBeenCalledWith(
      expect.stringContaining('notification_type'),
    )
    expect(selectChain.select).toHaveBeenCalledWith(
      expect.not.stringContaining('action_url'),
    )
    expect(selectChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('throws when notification not found or wrong user', async () => {
    const supabase = makeSupabase({ ownershipData: null, ownershipError: { message: 'Not found' } })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(markNotificationAsRead('notif-x', 'user-1')).rejects.toThrow(
      'Notificacion no encontrada o no pertenece al usuario',
    )
  })
})

// ─── markMultipleNotificationsAsRead ─────────────────────────────────────────

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

  it('throws when update fails', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
    }
    vi.mocked(getServerClient).mockResolvedValue({ from: vi.fn().mockReturnValue(chain) } as any)

    await expect(markMultipleNotificationsAsRead(['n-1'], 'user-1')).rejects.toThrow(
      'Error al marcar como leidas',
    )
  })
})

// ─── archiveNotification ──────────────────────────────────────────────────────

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
      rpc: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Function not found' },
        }),
      })),
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
    expect(countChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(updateChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
    expect(result).toEqual({ updated: 2 })
  })

  it('returns zero without issuing an update when there are no unread notifications', async () => {
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ count: 0, error: null }),
    }
    const supabase = {
      rpc: vi.fn(() => {
        throw new Error('RPC unavailable')
      }),
      from: vi.fn(() => countChain),
    }

    const result = await markAllNotificationsAsRead('user-1', {
      supabase: supabase as any,
    })

    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ updated: 0 })
  })
})

describe('archiveNotification', () => {
  it('archives notification and returns updated record', async () => {
    const archived = makeNotif({ status: 'archived' })
    const supabase = makeSupabase({ updateData: archived })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await archiveNotification('notif-1', 'user-1')

    expect(supabase.operationChain.update).toHaveBeenCalledWith({ status: 'archived' })
    expect(result).toMatchObject({ status: 'archived' })
  })

  it('throws when notification not found', async () => {
    const supabase = makeSupabase({ ownershipData: null, ownershipError: { message: 'Not found' } })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(archiveNotification('notif-x', 'user-1')).rejects.toThrow(
      'Notificacion no encontrada o no pertenece al usuario',
    )
  })
})

// ─── deleteNotification ───────────────────────────────────────────────────────

describe('deleteNotification', () => {
  it('deletes notification without error on happy path', async () => {
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: makeNotif(), error: null }),
    }
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    // last .eq() in delete chain resolves with { error: null }
    const eqMock = vi.fn().mockReturnThis()
    deleteChain.eq = eqMock
    eqMock.mockReturnValueOnce(deleteChain).mockResolvedValueOnce({ error: null })

    let callCount = 0
    vi.mocked(getServerClient).mockResolvedValue({
      from: vi.fn(() => {
        callCount++
        return callCount === 1 ? ownershipChain : deleteChain
      }),
    } as any)

    await expect(deleteNotification('notif-1', 'user-1')).resolves.toBeUndefined()
  })

  it('throws when notification not found', async () => {
    const supabase = makeSupabase({ ownershipData: null, ownershipError: { message: 'Not found' } })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(deleteNotification('notif-x', 'user-1')).rejects.toThrow(
      'Notificacion no encontrada o no pertenece al usuario',
    )
  })
})
