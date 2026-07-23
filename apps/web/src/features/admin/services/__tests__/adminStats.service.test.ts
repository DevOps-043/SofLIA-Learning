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

  it('uses head count queries for real B2B totals and growth (no phantom tables)', async () => {
    const chains: MockChain[] = []
    // Orden de queries: users total, users growth, courses total, courses growth,
    // orgs total, orgs growth, active sessions. Sin ai_apps / news / reels / favorites.
    const results: QueryResult[] = [
      { count: 10, error: null }, // users total
      { count: 2, error: null }, // users growth 30d
      { count: 8, error: null }, // courses total
      { count: 1, error: null }, // courses growth 30d
      { count: 4, error: null }, // orgs total
      { count: 1, error: null }, // orgs growth 30d
      {
        data: [
          { user_id: 'user-1' },
          { user_id: 'user-1' },
          { user_id: 'user-2' },
        ],
        error: null,
      }, // active sessions → 2 usuarios únicos
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
      engagementRate: 20, // 2 activos / 10 usuarios
      userGrowth: 25, // crecimiento 2 sobre previo 8
      courseGrowth: 14, // crecimiento 1 sobre previo 7
    })
    // Las métricas de features eliminadas ya no existen en el resultado.
    expect(stats).not.toHaveProperty('totalAIApps')
    expect(stats).not.toHaveProperty('totalReels')

    const countChains = chains.slice(0, 6)
    countChains.forEach((chain) => {
      expect(chain.select).toHaveBeenCalledWith(
        expect.not.stringContaining('created_at'),
        expect.objectContaining({ count: 'exact', head: true })
      )
    })

    const activeSessionChain = chains[6]
    expect(activeSessionChain.select).toHaveBeenCalledWith('user_id', { head: false })
    expect(activeSessionChain.gte).toHaveBeenCalledWith('issued_at', expect.any(String))
    expect(activeSessionChain.eq).toHaveBeenCalledWith('revoked', false)
  })
})
