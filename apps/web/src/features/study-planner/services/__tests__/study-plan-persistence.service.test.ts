import { describe, expect, it } from 'vitest'

import {
  attachSessionIdsToDistribution,
  buildStudyPlanPayload,
} from '../study-plan-persistence.service'
import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types'

function makeDistribution(overrides: Partial<StudyPlannerStoredLessonDistribution> = {}): StudyPlannerStoredLessonDistribution {
  return {
    clientReferenceId: 'dist-1',
    dateStr: '2026-04-10',
    dayName: 'Viernes',
    startTime: '09:00',
    endTime: '10:00',
    lessons: [],
    ...overrides,
  }
}

describe('attachSessionIdsToDistribution', () => {
  it('keeps the distribution untouched when no saved sessions are returned', () => {
    const distribution = [makeDistribution()]

    expect(
      attachSessionIdsToDistribution({
        savedLessonDistribution: distribution,
        savedSessions: [],
      }),
    ).toEqual(distribution)
  })

  it('attaches session ids by clientReferenceId', () => {
    const result = attachSessionIdsToDistribution({
      savedLessonDistribution: [
        makeDistribution({ clientReferenceId: 'dist-1' }),
        makeDistribution({
          clientReferenceId: 'dist-2',
          dateStr: '2026-04-11',
          startTime: '10:00',
          endTime: '11:00',
        }),
      ],
      savedSessions: [
        { id: 'session-1', clientReferenceId: 'dist-1' },
        { id: 'session-2', clientReferenceId: 'dist-2' },
      ],
    })

    expect(result.map((slot) => slot.sessionId)).toEqual(['session-1', 'session-2'])
  })
})

describe('buildStudyPlanPayload', () => {
  it('carries the selected course organization into the save payload', () => {
    const payload = buildStudyPlanPayload({
      availableCourses: [
        {
          category: 'Ventas',
          courseId: 'course-1',
          id: 'course-1__org-board',
          organizationId: 'org-board',
          organizationName: 'BoardReady',
          progress: 0,
          title: 'Metodo Challenger',
        },
      ],
      connectedCalendar: null,
      savedLessonDistribution: [
        makeDistribution({
          lessons: [
            {
              courseId: 'course-1',
              courseTitle: 'Metodo Challenger',
              durationMinutes: 30,
              lessonId: 'lesson-1',
              lessonOrderIndex: 1,
              lessonTitle: 'Intro',
              moduleOrderIndex: 1,
              moduleTitle: 'Modulo 1',
            },
          ],
        }),
      ],
      savedTargetDate: '2026-04-30',
      selectedCourseIds: ['course-1__org-board'],
      studyApproach: 'balance',
      userType: 'b2b',
    })

    expect(payload.planConfig.courseIds).toEqual(['course-1'])
    expect(payload.planConfig.organizationId).toBe('org-board')
    expect(payload.sessions[0].courseId).toBe('course-1')
    expect(payload.sessions[0].title).toBe('Sesión de estudio de Metodo Challenger')
    expect(payload.sessions[0].description).toBe('1. Intro')
  })
})
