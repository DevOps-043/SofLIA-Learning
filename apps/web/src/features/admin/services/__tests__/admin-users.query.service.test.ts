import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminUserStats, getAdminUsers } from '../admin-users/query.service'

vi.mock('server-only', () => ({}))
vi.mock('../admin-users/client', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('../admin-users/helpers', () => ({
  ADMIN_USER_LIST_SELECT_FIELDS: 'id,email,first_name,last_name',
  normalizeUsersPagination: vi.fn((opts) => ({
    page: opts.page ?? 1,
    limit: opts.limit ?? 20,
    from: 0,
    to: 19,
    search: opts.search ?? '',
  })),
}))

import { createAdminClient } from '../admin-users/client'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeUser(id = 'user-1') {
  return { id, email: `${id}@test.com`, first_name: 'Test', last_name: 'User' }
}

function makeSupabaseChain({
  data = [],
  count = 0,
  error = null,
}: { data?: unknown[]; count?: number; error?: unknown } = {}) {
  const chain: Record<string, unknown> = {}
  const terminal = vi.fn().mockResolvedValue({ data, count, error })
  chain.select = vi.fn().mockReturnValue(chain)
  chain.or = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.range = terminal
  chain.eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ count, error }) }) })
  return { chain, terminal }
}

function makeHeadChain(count: number, error: unknown = null) {
  return { count, error }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getAdminUsers ────────────────────────────────────────────────────────────

describe('getAdminUsers', () => {
  it('returns users and pagination metadata', async () => {
    const users = [makeUser('user-1'), makeUser('user-2')]
    const { chain } = makeSupabaseChain({ data: users, count: 2 })
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any)

    const result = await getAdminUsers({ page: 1, limit: 20 })

    expect(result.users).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it('returns empty users when no data found', async () => {
    const { chain } = makeSupabaseChain({ data: [], count: 0 })
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any)

    const result = await getAdminUsers()

    expect(result.users).toEqual([])
    expect(result.total).toBe(0)
  })

  it('applies search filter with or() when search is provided', async () => {
    const { chain } = makeSupabaseChain({ data: [makeUser()], count: 1 })
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any)

    await getAdminUsers({ search: 'test@email.com' })

    expect(chain.or).toHaveBeenCalledWith(
      expect.stringContaining('email.ilike.%test@email.com%'),
    )
  })

  it('throws when query returns error', async () => {
    const errorChain: Record<string, unknown> = {}
    errorChain.select = vi.fn().mockReturnValue(errorChain)
    errorChain.or = vi.fn().mockReturnValue(errorChain)
    errorChain.order = vi.fn().mockReturnValue(errorChain)
    errorChain.range = vi.fn().mockResolvedValue({ data: null, count: null, error: { message: 'DB error' } })
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue(errorChain) } as any)

    await expect(getAdminUsers()).rejects.toMatchObject({ message: 'DB error' })
  })

  it('calculates totalPages correctly', async () => {
    const { chain } = makeSupabaseChain({ data: Array(20).fill(makeUser()), count: 45 })
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as any)

    const result = await getAdminUsers({ limit: 20 })

    expect(result.totalPages).toBe(3)
  })
})

// ─── getAdminUserStats ────────────────────────────────────────────────────────

describe('getAdminUserStats', () => {
  it('returns user stats from parallel queries', async () => {
    const makeEqChain = (count: number) => ({
      select: vi.fn().mockReturnValue({
        count,
        error: null,
        eq: vi.fn().mockResolvedValue({ count, error: null }),
      }),
      eq: vi.fn().mockResolvedValue({ count, error: null }),
    })

    const fromMock = vi.fn()
      .mockReturnValueOnce(makeEqChain(100)) // total
      .mockReturnValueOnce(makeEqChain(80))  // verified
      .mockReturnValueOnce(makeEqChain(10))  // instructors
      .mockReturnValueOnce(makeEqChain(3))   // admins

    vi.mocked(createAdminClient).mockReturnValue({ from: fromMock } as any)

    // For Promise.all parallel queries, mock each .from().select().eq() chain
    const buildHeadChain = (count: number) => {
      const headChain = {
        select: vi.fn(),
        eq: vi.fn(),
        count,
        error: null,
      }
      headChain.select.mockReturnValue(headChain)
      headChain.eq.mockResolvedValue({ count, error: null })
      return headChain
    }

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(buildHeadChain(100))
        .mockReturnValueOnce(buildHeadChain(80))
        .mockReturnValueOnce(buildHeadChain(10))
        .mockReturnValueOnce(buildHeadChain(3)),
    } as any)

    const result = await getAdminUserStats()

    expect(result).toMatchObject({
      totalUsers: 100,
      verifiedUsers: 80,
      instructors: 10,
      administrators: 3,
    })
  })

  it('throws when any stat query returns error', async () => {
    const errorChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Stats error' } }),
    }
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue(errorChain),
    } as any)

    await expect(getAdminUserStats()).rejects.toMatchObject({ message: 'Stats error' })
  })
})
