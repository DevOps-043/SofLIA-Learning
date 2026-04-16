import { describe, expect, it } from 'vitest'
import { getChangedSessionUpdates } from '../planner-message-handler.utils'
import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types'

function makeSlot(
  overrides: Partial<StudyPlannerStoredLessonDistribution>,
): StudyPlannerStoredLessonDistribution {
  return {
    clientReferenceId: 'dist-1',
    sessionId: 'session-1',
    dateStr: '2026-04-10',
    dayName: 'viernes',
    startTime: '10:00',
    endTime: '11:00',
    lessons: [],
    ...overrides,
  }
}

describe('planner-message-handler.utils', () => {
  it('detects date-only changes for the same session identity', () => {
    const original = [makeSlot({ dateStr: '2026-04-10', dayName: 'viernes' })]
    const updated = [makeSlot({ dateStr: '2026-04-12', dayName: 'domingo' })]

    expect(getChangedSessionUpdates(updated, original)).toEqual([
      {
        sessionId: 'session-1',
        clientReferenceId: 'dist-1',
        dateStr: '2026-04-12',
        originalStartTime: '10:00',
        newStartTime: '10:00',
        newEndTime: '11:00',
      },
    ])
  })

  it('matches original sessions by clientReferenceId instead of array index', () => {
    const original = [
      makeSlot({
        clientReferenceId: 'dist-1',
        sessionId: 'session-1',
        dateStr: '2026-04-10',
        startTime: '10:00',
        endTime: '11:00',
      }),
      makeSlot({
        clientReferenceId: 'dist-2',
        sessionId: 'session-2',
        dateStr: '2026-04-11',
        dayName: 'sabado',
        startTime: '12:00',
        endTime: '13:00',
      }),
    ]

    const updated = [
      makeSlot({
        clientReferenceId: 'dist-2',
        sessionId: 'session-2',
        dateStr: '2026-04-09',
        dayName: 'jueves',
        startTime: '12:30',
        endTime: '13:30',
      }),
      makeSlot({
        clientReferenceId: 'dist-1',
        sessionId: 'session-1',
        dateStr: '2026-04-10',
        startTime: '10:00',
        endTime: '11:00',
      }),
    ]

    expect(getChangedSessionUpdates(updated, original)).toEqual([
      {
        sessionId: 'session-2',
        clientReferenceId: 'dist-2',
        dateStr: '2026-04-09',
        originalStartTime: '12:00',
        newStartTime: '12:30',
        newEndTime: '13:30',
      },
    ])
  })
})
