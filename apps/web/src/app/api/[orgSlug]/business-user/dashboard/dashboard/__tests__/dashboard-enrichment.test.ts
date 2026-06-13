import { describe, expect, it, vi } from 'vitest'
import { fetchDashboardEnrichment } from '../dashboard-enrichment'
import type { DashboardBaseData, DashboardSupabaseClient } from '../dashboard.types'

function createEnrollmentQuery() {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    returns: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve({
      data: [
        {
          enrollment_id: 'enrollment-art',
          course_id: 'course-ia',
          organization_id: 'org-art',
          overall_progress_percentage: 0,
          enrollment_status: 'active',
          completed_at: null,
        },
      ],
      error: null,
    })),
  }
  return query
}

describe('fetchDashboardEnrichment', () => {
  it('loads course progress only from the requested organization', async () => {
    const enrollmentQuery = createEnrollmentQuery()
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'user_course_enrollments') return enrollmentQuery
        throw new Error(`Unexpected table ${table}`)
      }),
    } as unknown as DashboardSupabaseClient
    const baseData: DashboardBaseData = {
      combinedAssignments: [],
      certificates: [],
      certificatesMap: new Map(),
      courseIds: ['course-ia'],
      instructorIds: [],
    }

    const enrichment = await fetchDashboardEnrichment(
      supabase,
      { userId: 'user-1', organizationId: 'org-art', orgSlug: 'art-in-technology' },
      baseData,
      [],
    )

    expect(enrollmentQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(enrollmentQuery.eq).toHaveBeenCalledWith('organization_id', 'org-art')
    expect(enrichment.enrollmentsMap.get('course-ia')?.organization_id).toBe('org-art')
    expect(enrichment.enrollmentsMap.get('course-ia')?.overall_progress_percentage).toBe(0)
  })
})
