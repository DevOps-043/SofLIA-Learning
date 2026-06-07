import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadAssignedLearningPathIds } from '../learning-path-assignments.server'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

interface QueryResult<T> {
  data: T[] | null
  error: unknown
}

describe('loadAssignedLearningPathIds', () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it('lets an explicit user revocation override an active organization assignment', async () => {
    const supabase = createSupabaseMock({
      organization_learning_path_assignments: [
        {
          data: [
            { learning_path_id: 'lp-org' },
            { learning_path_id: 'lp-shared' },
          ],
          error: null,
        },
      ],
      user_learning_path_assignments: [
        {
          data: [
            { learning_path_id: 'lp-org', status: 'revoked' },
            { learning_path_id: 'lp-direct', status: 'assigned' },
          ],
          error: null,
        },
      ],
    })
    createClientMock.mockResolvedValue(supabase)

    await expect(loadAssignedLearningPathIds('user-1', 'org-1')).resolves.toEqual([
      'lp-shared',
      'lp-direct',
    ])
  })

  it('keeps organization assignments when the user has no explicit revocation', async () => {
    const supabase = createSupabaseMock({
      organization_learning_path_assignments: [
        {
          data: [{ learning_path_id: 'lp-org' }],
          error: null,
        },
      ],
      user_learning_path_assignments: [
        {
          data: [],
          error: null,
        },
      ],
    })
    createClientMock.mockResolvedValue(supabase)

    await expect(loadAssignedLearningPathIds('user-1', 'org-1')).resolves.toEqual([
      'lp-org',
    ])
  })
})

function createSupabaseMock(resultsByTable: Record<string, Array<QueryResult<unknown>>>) {
  return {
    from: vi.fn((table: string) => {
      const result = resultsByTable[table]?.shift() ?? { data: [], error: null }
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        returns: vi.fn(() => Promise.resolve(result)),
      }

      return query
    }),
  }
}
