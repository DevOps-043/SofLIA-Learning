import { describe, expect, it } from 'vitest'
import {
  buildStudyPlannerSessionLookup,
  buildUpdatedSessionWindow,
  findMatchingStudySession,
  parseOriginalSessionReference,
  parseSessionUpdateDate,
  parseSessionTime,
  parseUpdateSessionRequest,
} from '../study-planner-session-update.utils'

describe('study-planner-session-update.utils', () => {
  it('validates the request payload', () => {
    expect(
      parseUpdateSessionRequest({
        planId: 'plan-1',
        updates: [
          {
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '11:00',
            newEndTime: '12:00',
          },
        ],
      }),
    ).toEqual({
      planId: 'plan-1',
      updates: [
        {
          dateStr: '2026-04-10',
          originalStartTime: '10:00',
          newStartTime: '11:00',
          newEndTime: '12:00',
          sessionId: undefined,
        },
      ],
    })
  })

  it('rejects malformed payloads', () => {
    expect(() => parseUpdateSessionRequest({ planId: '', updates: [] })).toThrow(
      'planId y updates son requeridos',
    )
  })

  it('parses valid dates and times', () => {
    expect(parseSessionUpdateDate('2026-04-10')).toBeInstanceOf(Date)
    expect(parseSessionTime('09:30')).toEqual({ hour: 9, minute: 30 })
    expect(parseSessionTime('25:00')).toBeNull()
  })

  it('matches sessions by id before using date and time lookup', () => {
    const lookup = buildStudyPlannerSessionLookup([
      {
        id: 'session-1',
        start_time: '2026-04-10T10:00:00.000Z',
      },
      {
        id: 'session-2',
        start_time: '2026-04-10T11:01:00.000Z',
      },
    ])

    const originalReference = parseOriginalSessionReference({
      sessionId: 'session-2',
      dateStr: '2026-04-10',
      originalStartTime: '11:00',
      newStartTime: '12:00',
      newEndTime: '13:00',
    })

    expect(originalReference).not.toBeNull()
    expect(
      findMatchingStudySession(
        lookup,
        {
          sessionId: 'session-2',
          dateStr: '2026-04-10',
          originalStartTime: '11:00',
          newStartTime: '12:00',
          newEndTime: '13:00',
        },
        originalReference!,
      )?.id,
    ).toBe('session-2')
  })

  it('matches sessions by date and one-minute tolerance when no id is provided', () => {
    const lookup = buildStudyPlannerSessionLookup([
      {
        id: 'session-1',
        start_time: new Date(2026, 3, 10, 10, 1, 0, 0).toISOString(),
      },
    ])

    const originalReference = parseOriginalSessionReference({
      dateStr: '2026-04-10',
      originalStartTime: '10:00',
      newStartTime: '10:30',
      newEndTime: '11:30',
    })

    expect(originalReference).not.toBeNull()
    expect(
      findMatchingStudySession(
        lookup,
        {
          dateStr: '2026-04-10',
          originalStartTime: '10:00',
          newStartTime: '10:30',
          newEndTime: '11:30',
        },
        originalReference!,
      )?.id,
    ).toBe('session-1')
  })

  it('builds updated windows and rejects inverted ranges', () => {
    expect(
      buildUpdatedSessionWindow({
        dateStr: '2026-04-10',
        originalStartTime: '10:00',
        newStartTime: '10:30',
        newEndTime: '11:30',
      }),
    ).not.toBeNull()

    expect(
      buildUpdatedSessionWindow({
        dateStr: '2026-04-10',
        originalStartTime: '10:00',
        newStartTime: '11:30',
        newEndTime: '10:30',
      }),
    ).toBeNull()
  })
})
