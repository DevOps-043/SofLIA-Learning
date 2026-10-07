import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/features/courses/services/course-enrollment-counts.server.service', () => ({ getCourseEnrollmentCounts: vi.fn() }))

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseEnrollmentCounts } from '@/features/courses/services/course-enrollment-counts.server.service'
import { GET } from '../workshop-detail.get'

const request = new NextRequest('http://localhost/api/admin/workshops/challenger')
const context = { params: Promise.resolve({ id: 'challenger' }) }

function setup(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => query) } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin', userEmail: '', userRole: 'Administrador' })
  vi.mocked(getCourseEnrollmentCounts).mockResolvedValue(new Map([['challenger', 16]]))
})

describe('admin workshop detail', () => {
  it('opens the course and replaces its stale zero count with real enrollments', async () => {
    setup({ id: 'challenger', slug: 'Challenger-sale', student_count: 0, instructor_id: null })
    const response = await GET(request, context)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ workshop: { id: 'challenger', student_count: 16 } })
  })

  it('keeps missing courses distinct from database permission failures', async () => {
    setup(null)
    expect((await GET(request, context)).status).toBe(404)
    setup(null, { code: '42501', message: 'permission denied' })
    expect((await GET(request, context)).status).toBe(500)
  })

  it('rejects non-admins before opening a privileged database client', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(NextResponse.json({}, { status: 403 }))
    expect((await GET(request, context)).status).toBe(403)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('does not replace a failed count query with zero', async () => {
    setup({ id: 'challenger', instructor_id: null })
    vi.mocked(getCourseEnrollmentCounts).mockRejectedValue(new Error('database unavailable'))
    expect((await GET(request, context)).status).toBe(500)
  })
})
