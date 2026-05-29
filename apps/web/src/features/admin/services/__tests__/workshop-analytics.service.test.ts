import { describe, expect, it } from 'vitest'

import {
  buildCourseChartData,
  buildCourseUserStats,
} from '../admin-workshops/workshop-analytics-calculations.service'

const NOW = new Date('2026-05-28T12:00:00.000Z')

describe('workshop-analytics.service', () => {
  it('builds real progress buckets and enrollment trends from enrollment rows', () => {
    const charts = buildCourseChartData([
      makeEnrollment({ enrolled_at: '2026-05-22T10:00:00.000Z', last_accessed_at: '2026-05-28T09:00:00.000Z', overall_progress_percentage: 0 }),
      makeEnrollment({ enrolled_at: '2026-05-27T10:00:00.000Z', last_accessed_at: '2026-05-27T13:00:00.000Z', overall_progress_percentage: 30 }),
      makeEnrollment({ enrolled_at: '2026-05-28T10:00:00.000Z', last_accessed_at: null, overall_progress_percentage: 70 }),
      makeEnrollment({ enrolled_at: '2026-05-28T11:00:00.000Z', last_accessed_at: '2026-05-28T11:30:00.000Z', overall_progress_percentage: 100 }),
    ], NOW)

    expect(charts.progress_distribution).toEqual([
      { name: '0-25%', value: 1 },
      { name: '26-50%', value: 1 },
      { name: '51-75%', value: 1 },
      { name: '76-100%', value: 1 },
    ])
    expect(charts.enrollment_trend_7d.at(-1)).toMatchObject({
      activos: 2,
      inscripciones: 2,
    })
  })

  it('builds KPIs from enrollments without hardcoded visual deltas', () => {
    const stats = buildCourseUserStats(
      [
        makeEnrollment({ overall_progress_percentage: 0 }),
        makeEnrollment({ overall_progress_percentage: 50, last_accessed_at: '2026-05-20T10:00:00.000Z' }),
        makeEnrollment({ enrollment_status: 'completed', overall_progress_percentage: 100, last_accessed_at: '2026-05-28T10:00:00.000Z' }),
      ],
      { totalActivities: 3, totalLessons: 2, totalMaterials: 4 },
      { averageRating: 4.5, totalReviews: 2 },
      1,
      NOW,
    )

    expect(stats.total_enrolled).toBe(3)
    expect(stats.completed).toBe(1)
    expect(stats.in_progress).toBe(1)
    expect(stats.not_started).toBe(1)
    expect(stats.average_progress).toBe(50)
    expect(stats.completion_rate).toBeCloseTo(33.333, 2)
    expect(stats.active_7d).toBe(1)
    expect(stats.active_30d).toBe(2)
    expect(stats.total_lessons).toBe(2)
    expect(stats.total_materials).toBe(4)
    expect(stats.total_activities).toBe(3)
    expect(stats.total_certificates).toBe(1)
  })
})

function makeEnrollment(overrides: Partial<Parameters<typeof buildCourseChartData>[0][number]> = {}) {
  return {
    completed_at: null,
    enrollment_id: crypto.randomUUID(),
    enrollment_status: 'active',
    enrolled_at: '2026-05-28T10:00:00.000Z',
    last_accessed_at: null,
    overall_progress_percentage: 0,
    started_at: null,
    user_id: crypto.randomUUID(),
    ...overrides,
  }
}
