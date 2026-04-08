import { describe, expect, it } from 'vitest'

import { attachSessionIdsToDistribution } from '../study-plan-persistence.service'
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
