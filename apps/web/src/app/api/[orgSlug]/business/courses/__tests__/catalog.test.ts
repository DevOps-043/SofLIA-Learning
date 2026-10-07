import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/requireBusiness', () => ({ requireBusiness: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/features/courses/services/course-enrollment-counts.server.service', () => ({ getCourseEnrollmentCounts: vi.fn() }))

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseEnrollmentCounts } from '@/features/courses/services/course-enrollment-counts.server.service'
import { GET as orgCatalog } from '../route'
import { GET as legacyCatalog } from '@/app/api/business/courses/route'

const request = new NextRequest('http://localhost/api/pulsehub/business/courses')
const context = { params: Promise.resolve({ orgSlug: 'pulsehub' }) }
const actor = { userId: 'diana', userEmail: '', userRole: 'Business', organizationId: 'demo-org', isOrgAdmin: true, organizationRole: 'admin' as const }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireBusiness).mockResolvedValue(actor)
  vi.mocked(getCourseEnrollmentCounts).mockResolvedValue(new Map([['challenger', 3]]))
})

describe.each([
  ['organization catalog', () => orgCatalog(request, context)],
  ['legacy catalog', () => legacyCatalog()],
] as const)('%s', (_name, getCatalog) => {
  it('lists approved active courses for an org admin and uses real org counts', async () => {
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'challenger', slug: 'Challenger-sale', student_count: 0 }], error: null }),
    }
    const client = { from: vi.fn(() => query) }
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    const response = await getCatalog()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ courses: [{ id: 'challenger', student_count: 3, slug: 'Challenger-sale' }] })
    expect(query.eq).toHaveBeenCalledWith('is_active', true)
    expect(query.or).toHaveBeenCalledWith('approval_status.eq.approved,approval_status.is.null')
    expect(getCourseEnrollmentCounts).toHaveBeenCalledWith(client, ['challenger'], 'demo-org')
  })

  it('blocks a Business user who is only a member of the requested org', async () => {
    vi.mocked(requireBusiness).mockResolvedValue({ ...actor, organizationId: 'other-org', isOrgAdmin: false, organizationRole: 'member' })
    expect((await getCatalog()).status).toBe(403)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('never exposes global counts to a Business user without an organization', async () => {
    vi.mocked(requireBusiness).mockResolvedValue({ ...actor, organizationId: undefined })
    expect((await getCatalog()).status).toBe(403)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('preserves authentication failures before privileged database access', async () => {
    vi.mocked(requireBusiness).mockResolvedValue(NextResponse.json({}, { status: 401 }))
    expect((await getCatalog()).status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})

it('authorizes the organization from the URL instead of choosing the most recent membership', async () => {
  vi.mocked(requireBusiness).mockResolvedValue(NextResponse.json({}, { status: 403 }))
  await orgCatalog(request, context)
  expect(requireBusiness).toHaveBeenCalledWith({ organizationSlug: 'pulsehub' })
})
