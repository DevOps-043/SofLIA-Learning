import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNotification } from '../notification/creation.service'

vi.mock('server-only', () => ({}))
vi.mock('../../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('../auto-notifications-server-client', () => ({
  getServerClient: vi.fn(),
}))
vi.mock('../notification/utils', () => ({
  buildNotificationInsertPayload: vi.fn((params) => ({
    user_id: params.userId,
    notification_type: params.notificationType,
    title: params.title,
    message: params.message,
    priority: params.priority ?? 'medium',
    status: 'unread',
  })),
  getDuplicateNotificationWindow: vi.fn(() => null),
}))

import { getServerClient } from '../auto-notifications-server-client'
import { getDuplicateNotificationWindow } from '../notification/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeParams(overrides = {}) {
  return {
    userId: 'user-1',
    notificationType: 'course_completed',
    title: 'Curso completado',
    message: 'Has completado el curso.',
    priority: 'medium',
    ...overrides,
  }
}

function makeSupabase(insertResult: { data?: unknown; error?: unknown } = {}) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: insertResult.data ?? { notification_id: 'notif-1', ...makeParams() },
      error: insertResult.error ?? null,
    }),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  }
  return { from: vi.fn().mockReturnValue(chain), chain }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createNotification ───────────────────────────────────────────────────────

describe('createNotification', () => {
  it('creates and returns a notification on happy path', async () => {
    const notif = { notification_id: 'notif-1', ...makeParams() }
    const supabase = makeSupabase({ data: notif })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await createNotification(makeParams())

    expect(supabase.chain.insert).toHaveBeenCalled()
    expect(result).toMatchObject({ notification_id: 'notif-1' })
  })

  it('throws when userId is missing', async () => {
    const supabase = makeSupabase()
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(createNotification(makeParams({ userId: '' }))).rejects.toThrow(
      'Faltan campos requeridos',
    )
  })

  it('throws when notificationType is missing', async () => {
    const supabase = makeSupabase()
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(createNotification(makeParams({ notificationType: '' }))).rejects.toThrow(
      'Faltan campos requeridos',
    )
  })

  it('throws when title is missing', async () => {
    const supabase = makeSupabase()
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(createNotification(makeParams({ title: '' }))).rejects.toThrow(
      'Faltan campos requeridos',
    )
  })

  it('rejects duplicate notifications within deduplication window', async () => {
    vi.mocked(getDuplicateNotificationWindow).mockReturnValue(30)
    const supabaseDup = makeSupabase()
    // checkDuplicate query returns one existing notification
    supabaseDup.chain.limit = vi.fn().mockResolvedValue({ data: [{ notification_id: 'existing' }], error: null })
    vi.mocked(getServerClient).mockResolvedValue(supabaseDup as any)

    await expect(createNotification(makeParams())).rejects.toThrow(
      'Notificacion duplicada evitada',
    )
  })

  it('allows notification when no duplicate exists in window', async () => {
    vi.mocked(getDuplicateNotificationWindow).mockReturnValue(30)
    const notif = { notification_id: 'notif-new', ...makeParams() }
    const supabase = makeSupabase({ data: notif })
    // checkDuplicate returns empty
    supabase.chain.limit = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    const result = await createNotification(makeParams())

    expect(result).toMatchObject({ notification_id: 'notif-new' })
  })

  it('throws with error message when insert fails', async () => {
    const supabase = makeSupabase({ data: null, error: { message: 'Insert failed' } })
    vi.mocked(getServerClient).mockResolvedValue(supabase as any)

    await expect(createNotification(makeParams())).rejects.toThrow('Error al crear notificacion')
  })
})
