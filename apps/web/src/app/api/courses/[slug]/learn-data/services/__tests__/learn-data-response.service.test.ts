import { describe, expect, it, vi } from 'vitest'
import { buildLearnDataResponse } from '../learn-data-response.service'
import type { LearnDataQueryPayload } from '../learn-data-query.service'

describe('learn-data-response.service', () => {
  it('builds the learn payload and defaults note stats when missing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T08:00:00.000Z'))

    const payload: LearnDataQueryPayload = {
      course: {
        id: 'course-1',
        title: 'Curso',
        description: 'Descripcion',
        thumbnail_url: 'thumb.png',
        instructor_id: 'instructor-1',
        category: 'dev',
        level: 'beginner',
        price: 99,
        is_active: true,
      },
      modulesResult: {
        modules: [
          {
            module_id: 'module-1',
            module_title: 'Modulo 1',
            module_description: null,
            module_order_index: 1,
            lessons: [],
          },
        ],
        progress: 25,
        lastWatchedLessonId: 'lesson-1',
      },
      questionsResult: [{ id: 'question-1', title: 'Pregunta' }],
      notesStatsResult: null,
      lessonDataResult: {
        lesson_id: 'lesson-1',
        transcript: 'transcript',
        summary: 'summary',
        activities: [],
        materials: [],
      },
      totalTimeMs: 44,
    }

    const response = buildLearnDataResponse(payload)

    expect(response.course.thumbnail).toBe('thumb.png')
    expect(response.courseProgress).toBe(25)
    expect(response.lastWatchedLessonId).toBe('lesson-1')
    expect(response.notesStats).toEqual({
      totalNotes: 0,
      lessonsWithNotes: '0/0',
      lastUpdate: null,
    })
    expect(response._meta).toEqual({
      timestamp: '2026-04-02T08:00:00.000Z',
      executionTime: '44ms',
      queriesExecuted: 4,
      optimization: 'unified-endpoint',
    })

    vi.useRealTimers()
  })
})
