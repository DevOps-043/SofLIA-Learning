import { describe, expect, it } from 'vitest'
import { validateLessonOrderEntries } from '../lesson-order-guardrails.service'

describe('lesson-order-guardrails.service', () => {
  it('rejects schedules that place a later lesson before an earlier pending lesson', () => {
    const result = validateLessonOrderEntries([
      {
        sessionId: 'session-late',
        title: 'Leccion 3',
        courseId: 'course-1',
        startTime: '2026-04-22T09:00:00-06:00',
        sequence: { moduleOrderIndex: 1, lessonOrderIndex: 3 },
      },
      {
        sessionId: 'session-early',
        title: 'Leccion 2',
        courseId: 'course-1',
        startTime: '2026-04-22T11:00:00-06:00',
        sequence: { moduleOrderIndex: 1, lessonOrderIndex: 2 },
      },
    ])

    expect(result.valid).toBe(false)
    expect(result.code).toBe('lesson_order_violation')
    expect(result.message).toContain('rompería el orden estricto')
  })

  it('allows schedules that preserve ascending lesson order inside the course', () => {
    const result = validateLessonOrderEntries([
      {
        sessionId: 'session-1',
        title: 'Leccion 1',
        courseId: 'course-1',
        startTime: '2026-04-22T09:00:00-06:00',
        sequence: { moduleOrderIndex: 1, lessonOrderIndex: 1 },
      },
      {
        sessionId: 'session-2',
        title: 'Leccion 2',
        courseId: 'course-1',
        startTime: '2026-04-22T11:00:00-06:00',
        sequence: { moduleOrderIndex: 1, lessonOrderIndex: 2 },
      },
    ])

    expect(result).toEqual({ valid: true })
  })
})
