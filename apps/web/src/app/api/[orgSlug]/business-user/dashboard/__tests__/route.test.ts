import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../route'

const mocks = vi.hoisted(() => ({
  defaults: vi.fn(), courseDefaults: vi.fn(), base: vi.fn(), paths: vi.fn(),
}))
vi.mock('@/features/learning-paths/services/learning-path-defaults.server', () => ({ LearningPathDefaultsService: { applyDefaultRulesForUser: mocks.defaults } }))
vi.mock('@/features/courses/services/course-defaults.server', () => ({ CourseDefaultsService: { applyDefaultRulesForUser: mocks.courseDefaults } }))
vi.mock('@/features/learning-paths/services/learning-path-dashboard.server', () => ({ loadBusinessUserLearningPaths: mocks.paths }))
vi.mock('../dashboard/dashboard-auth', () => ({ resolveDashboardAuth: async () => ({ userId: 'user', organizationId: 'org', orgSlug: 'demo' }) }))
vi.mock('../dashboard/dashboard-base-data', () => ({ fetchDashboardBaseData: mocks.base }))
vi.mock('../dashboard/dashboard-enrichment', () => ({ fetchDashboardEnrichment: async () => ({ enrollmentsMap: new Map(), instructorMap: new Map(), learningPaths: [] }) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => {
  const query = { select: () => query, eq: () => query, single: async () => ({ data: null, error: null }) }
  return { from: () => query }
} }))

describe('dashboard assignment snapshot', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.defaults.mockResolvedValue({})
    mocks.courseDefaults.mockResolvedValue({})
    mocks.paths.mockResolvedValue([])
    mocks.base.mockResolvedValue({ combinedAssignments: [], certificates: [], certificatesMap: new Map() })
  })

  it('waits for default assignments before querying assigned courses', async () => {
    let finish!: () => void
    mocks.defaults.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const pending = GET(new NextRequest('https://example.test/api/demo/business-user/dashboard'), { params: Promise.resolve({ orgSlug: 'demo' }) })
    await vi.waitFor(() => expect(mocks.defaults).toHaveBeenCalled())
    expect(mocks.base).not.toHaveBeenCalled()
    finish()
    expect((await pending).status).toBe(200)
    expect(mocks.courseDefaults.mock.invocationCallOrder[0]).toBeLessThan(mocks.base.mock.invocationCallOrder[0])
  })

  it('returns an error when learning paths cannot be loaded', async () => {
    mocks.paths.mockRejectedValue(new Error('unavailable'))
    const response = await GET(new NextRequest('https://example.test/api/demo/business-user/dashboard'), { params: Promise.resolve({ orgSlug: 'demo' }) })
    expect(response.status).toBe(500)
    expect((await response.json()).success).toBe(false)
  })
})
