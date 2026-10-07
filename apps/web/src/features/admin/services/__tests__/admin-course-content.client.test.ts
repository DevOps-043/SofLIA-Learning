import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminCourseContentClient } from '../admin-course-content.client'

beforeEach(() => vi.clearAllMocks())

describe('admin course content authorization', () => {
  it.each([401, 403, 500])('never creates a privileged client when authorization returns %s', async (status) => {
    vi.mocked(requireAdmin).mockResolvedValue(NextResponse.json({ error: 'denied' }, { status }))
    await expect(createAdminCourseContentClient()).rejects.toThrow('ADMIN_COURSE_ACCESS_DENIED')
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('creates the privileged client only after admin authorization succeeds', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin', userEmail: '', userRole: 'Administrador' })
    const client = { from: vi.fn() }
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    expect(await createAdminCourseContentClient()).toBe(client)
    expect(requireAdmin).toHaveBeenCalledBefore(createAdminClient)
  })
})
