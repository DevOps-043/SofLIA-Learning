import { describe, expect, it, vi } from 'vitest'
import { getCourseEnrollmentCounts } from '../course-enrollment-counts.server.service'

function client(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  return { query, supabase: { from: vi.fn(() => query) } }
}

describe('course enrollment counts', () => {
  it('includes completed students and counts more than the Data API row limit', async () => {
    const { query, supabase } = client({
      data: [{ id: 'challenger', enrollments: [{ count: 1501 }] }, { id: 'empty', enrollments: [] }],
      error: null,
    })
    const result = await getCourseEnrollmentCounts(supabase as never, ['challenger', 'empty'], 'org-1')
    expect(result.get('challenger')).toBe(1501)
    expect(result.get('empty')).toBe(0)
    expect(query.in).toHaveBeenCalledWith('enrollments.enrollment_status', ['active', 'completed'])
    expect(query.eq).toHaveBeenCalledWith('enrollments.organization_id', 'org-1')
  })

  it('counts across organizations only when an admin requests global counts', async () => {
    const { query, supabase } = client({ data: [{ id: 'course', enrollments: [{ count: 16 }] }], error: null })
    expect((await getCourseEnrollmentCounts(supabase as never, ['course'])).get('course')).toBe(16)
    expect(query.eq).not.toHaveBeenCalled()
  })

  it('propagates permission errors instead of displaying zero students', async () => {
    const error = { code: '42501', message: 'permission denied' }
    const { supabase } = client({ data: null, error })
    await expect(getCourseEnrollmentCounts(supabase as never, ['course'])).rejects.toEqual(error)
  })

  it('skips empty input and batches a catalog larger than the row limit', async () => {
    const { supabase } = client({ data: [], error: null })
    expect(await getCourseEnrollmentCounts(supabase as never, [])).toEqual(new Map())
    expect(supabase.from).not.toHaveBeenCalled()
    await getCourseEnrollmentCounts(supabase as never, Array.from({ length: 1001 }, (_, i) => `course-${i}`))
    expect(supabase.from).toHaveBeenCalledTimes(6)
  })
})
