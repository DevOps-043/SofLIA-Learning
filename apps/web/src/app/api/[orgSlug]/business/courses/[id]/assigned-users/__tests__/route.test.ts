import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/requireBusiness', () => ({ requireBusiness: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => { throw new Error('RLS exposes only the current user') }) }))

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { GET as orgAssignments } from '../route'
import { GET as legacyAssignments } from '@/app/api/business/courses/[id]/assigned-users/route'

const request = new Request('http://localhost/api/pulsehub/business/courses/challenger/assigned-users')
const context = { params: Promise.resolve({ orgSlug: 'pulsehub', id: 'challenger' }) }
const actor = { userId: 'israel', userEmail: '', userRole: 'Administrador', organizationId: 'demo-org', isOrgAdmin: true }

beforeEach(() => { vi.clearAllMocks(); vi.mocked(requireBusiness).mockResolvedValue(actor) })

function setup(error: unknown = null) {
  const direct = chain({ data: [{ user_id: 'israel' }, { user_id: 'diana' }], error })
  const other = chain({ data: [], error: null })
  const client = { from: vi.fn((table: string) => table === 'organization_course_assignments' ? direct : other) }
  vi.mocked(createAdminClient).mockReturnValue(client as never)
  return direct
}

function chain(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
}

describe.each([
  ['org assignment list', () => orgAssignments(request, context)],
  ['legacy assignment list', () => legacyAssignments(request, context)],
] as const)('%s', (_label, getAssigned) => {
  it('returns Diana as removable just like Israel, using the full authorized org list', async () => {
    const direct = setup()
    const response = await getAssigned()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      user_ids: ['israel', 'diana'], assigned_users: [{ user_id: 'israel', source: 'direct' }, { user_id: 'diana', source: 'direct' }],
    })
    expect(direct.eq).toHaveBeenCalledWith('organization_id', 'demo-org')
    expect(direct.eq).toHaveBeenCalledWith('course_id', 'challenger')
    expect(direct.eq).not.toHaveBeenCalledWith('user_id', 'israel')
    expect(direct.or).toHaveBeenCalledWith('status.is.null,status.in.(assigned,in_progress)')
    expect(createClient).not.toHaveBeenCalled()
  })

  it('does not return a partial successful list when querying assignments fails', async () => {
    setup({ code: '42501', message: 'permission denied' })
    const response = await getAssigned()
    expect(response.status).toBe(500)
    expect((await response.json()).success).toBe(false)
  })

  it('blocks ordinary members before opening the privileged client', async () => {
    vi.mocked(requireBusiness).mockResolvedValue({ ...actor, userRole: 'Business', isOrgAdmin: false })
    expect((await getAssigned()).status).toBe(403)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('preserves an expired-session response', async () => {
    vi.mocked(requireBusiness).mockResolvedValue(NextResponse.json({}, { status: 401 }))
    expect((await getAssigned()).status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})
