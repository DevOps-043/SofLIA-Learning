import { describe, expect, it } from 'vitest'
import {
  mapPreferredCourseEnrollments,
  selectPreferredCourseEnrollment,
  type CourseEnrollmentRecord,
} from '../course-enrollment.server.service'

function buildEnrollment(
  overrides: Partial<CourseEnrollmentRecord>,
): CourseEnrollmentRecord {
  return {
    enrollment_id: 'enrollment-1',
    organization_id: null,
    overall_progress_percentage: 0,
    enrollment_status: 'active',
    last_accessed_at: '2026-04-10T10:00:00.000Z',
    enrolled_at: '2026-04-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('course-enrollment.server.service', () => {
  it('prefers the active organization enrollment when it already has progress', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'legacy',
          overall_progress_percentage: 40,
        }),
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 96.88,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment?.enrollment_id).toBe('board-ready')
  })

  it('falls back to the legacy enrollment when the active organization entry is empty', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 0,
        }),
        buildEnrollment({
          enrollment_id: 'legacy',
          overall_progress_percentage: 96.88,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment?.enrollment_id).toBe('legacy')
  })

  it('keeps the exact organization enrollment when there is no legacy fallback', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 0,
        }),
        buildEnrollment({
          enrollment_id: 'pulse-hub',
          organization_id: 'pulse-hub-org',
          overall_progress_percentage: 96.88,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment?.enrollment_id).toBe('board-ready')
  })

  it('uses the legacy enrollment first when there is no active organization context', () => {
    const enrollment = selectPreferredCourseEnrollment([
      buildEnrollment({
        enrollment_id: 'legacy',
        overall_progress_percentage: 24,
      }),
      buildEnrollment({
        enrollment_id: 'other-org',
        organization_id: 'org-2',
        overall_progress_percentage: 50,
      }),
    ])

    expect(enrollment?.enrollment_id).toBe('legacy')
  })

  it('maps each course to the preferred enrollment for the active organization', () => {
    const enrollmentMap = mapPreferredCourseEnrollments(
      [
        {
          ...buildEnrollment({
            enrollment_id: 'course-a-legacy',
            overall_progress_percentage: 20,
          }),
          course_id: 'course-a',
        },
        {
          ...buildEnrollment({
            enrollment_id: 'course-a-org',
            organization_id: 'org-1',
            overall_progress_percentage: 60,
          }),
          course_id: 'course-a',
        },
        {
          ...buildEnrollment({
            enrollment_id: 'course-b-legacy',
            overall_progress_percentage: 35,
          }),
          course_id: 'course-b',
        },
      ],
      'org-1',
    )

    expect(enrollmentMap.get('course-a')?.enrollment_id).toBe('course-a-org')
    expect(enrollmentMap.get('course-b')?.enrollment_id).toBe('course-b-legacy')
  })
})
