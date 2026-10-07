import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/services/session.service', () => ({ SessionService: { getCurrentUser: vi.fn() } }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => { throw new Error('No Supabase JWT in legacy session') }) }))

import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { GET } from '../route'

const context = { params: Promise.resolve({ slug: 'Challenger-sale' }) }
const userId = 'diana'

function setup(enrollments: unknown[], memberships: unknown[], assignment: unknown = null, error: unknown = null) {
  const queries = new Map<string, ReturnType<typeof chain>>()
  const results: Record<string, unknown> = {
    courses: { data: { id: 'challenger' }, error },
    user_course_enrollments: { data: enrollments, error: null },
    organization_users: { data: memberships, error: null },
    organization_course_assignments: { data: assignment, error: null },
  }
  function chain(result: unknown) {
    return {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    }
  }
  vi.mocked(createAdminClient).mockReturnValue({
    from: vi.fn((table: string) => {
      const query = chain(results[table])
      queries.set(table, query)
      return query
    }),
  } as never)
  return queries
}

async function request(orgId?: string) {
  const response = await GET(new NextRequest(`http://localhost/api/courses/Challenger-sale/check-purchase${orgId ? `?orgId=${orgId}` : ''}`), context)
  return { response, payload: await response.json() }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(SessionService.getCurrentUser).mockResolvedValue({ id: userId, platform_role: 'Business' } as never)
})

describe('course access for organization enrollments', () => {
  it('recognizes an existing enrollment with a valid legacy session and no Supabase JWT', async () => {
    const queries = setup([{ organization_id: 'pulsehub' }], [{ organization_id: 'pulsehub' }])
    const { payload, response } = await request('pulsehub')
    expect(payload).toEqual({ isPurchased: true })
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(createClient).not.toHaveBeenCalled()
    expect(queries.get('user_course_enrollments')?.eq).toHaveBeenCalledWith('user_id', userId)
    expect(queries.get('user_course_enrollments')?.eq).toHaveBeenCalledWith('organization_id', 'pulsehub')
    expect(queries.get('user_course_enrollments')?.in).toHaveBeenCalledWith('enrollment_status', ['active', 'completed'])
  })

  it('recognizes an org enrollment from a legacy link without an org parameter', async () => {
    setup([{ organization_id: 'pulsehub' }], [{ organization_id: 'pulsehub' }])
    expect((await request()).payload).toEqual({ isPurchased: true })
  })

  it('does not fall back to another organization when the requested one has no enrollment', async () => {
    const queries = setup([], [{ organization_id: 'soflia' }])
    expect((await request('soflia')).payload).toEqual({ isPurchased: false })
    expect(queries.get('user_course_enrollments')?.eq).toHaveBeenCalledWith('organization_id', 'soflia')
  })

  it('rejects an old enrollment after membership is removed', async () => {
    setup([{ organization_id: 'pulsehub' }], [])
    expect((await request('pulsehub')).payload).toEqual({ isPurchased: false })
  })

  it('recognizes a direct assignment only for the authenticated user in an active org', async () => {
    const queries = setup([], [{ organization_id: 'pulsehub' }], { id: 'assignment' })
    expect((await request('pulsehub')).payload).toEqual({ isPurchased: true })
    expect(queries.get('organization_course_assignments')?.eq).toHaveBeenCalledWith('user_id', userId)
    expect(queries.get('organization_course_assignments')?.eq).toHaveBeenCalledWith('organization_id', 'pulsehub')
  })

  it('reports database failures as errors instead of denying a valid enrollment', async () => {
    setup([], [], null, { code: '42501', message: 'permission denied' })
    expect((await request('pulsehub')).response.status).toBe(500)
  })

  it('rejects unauthenticated requests before creating a privileged client', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(null)
    expect((await request('pulsehub')).payload).toEqual({ isPurchased: false })
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})
