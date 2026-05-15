import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { AdminStatsService } from '../adminStats.service'

type QueryResult =
  | { count: number | null; error: unknown | null }
  | { data: Array<{ user_id: string | null }>; error: unknown | null }

type MockChain = PromiseLike<unknown> & {
  table: string
  select: Mock
  eq: Mock
  gte: Mock
}

function createChain(table: string, result: QueryResult): MockChain {
  const chain = {
    table,
  } as MockChain

  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.gte = vi.fn(() => chain)
  chain.then = (onfulfilled, onrejected) =>
    Promise.resolve(result).then(onfulfilled, onrejected)

  return chain
}

describe('AdminStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses head count queries for dashboard totals and growth', async () => {
    const chains: MockChain[] = []
    const results: QueryResult[] = [
      { count: 10, error: null },
      { count: 2, error: null },
      { count: 8, error: null },
      { count: 1, error: null },
      { count: 4, error: null },
      { count: 1, error: null },
      { count: 12, error: null },
      { count: 3, error: null },
      { count: 6, error: null },
      { count: 2, error: null },
      { count: 5, error: null },
      { count: 1, error: null },
      { count: 20, error: null },
      { count: 5, error: null },
      {
        data: [
          { user_id: 'user-1' },
          { user_id: 'user-1' },
          { user_id: 'user-2' },
        ],
        error: null,
      },
    ]

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        const result = results[chains.length]
        const chain = createChain(table, result)
        chains.push(chain)
        return chain
      }),
    } as never)

    const stats = await AdminStatsService.getStats()

    expect(stats).toMatchObject({
      totalUsers: 10,
      activeCourses: 8,
      totalOrganizations: 4,
      totalAIApps: 12,
      totalNews: 6,
      totalReels: 5,
      engagementRate: 20,
      userGrowth: 25,
      engagementGrowth: 33,
    })

    const countChains = chains.slice(0, 14)
    countChains.forEach((chain) => {
      expect(chain.select).toHaveBeenCalledWith(
        expect.not.stringContaining('created_at'),
        expect.objectContaining({ count: 'exact', head: true })
      )
    })

    const activeSessionChain = chains[14]
    expect(activeSessionChain.select).toHaveBeenCalledWith('user_id', { head: false })
    expect(activeSessionChain.gte).toHaveBeenCalledWith('issued_at', expect.any(String))
    expect(activeSessionChain.eq).toHaveBeenCalledWith('revoked', false)
  })
})
