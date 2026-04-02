import { describe, expect, it, vi } from 'vitest'
import {
  buildCalendarEventsUrl,
  detectScheduleConflicts,
  validateProposedSchedule,
} from '../calendar-validation.service'

describe('calendar-validation.service', () => {
  it('builds same-origin calendar event URLs safely', () => {
    expect(
      buildCalendarEventsUrl({
        origin: 'https://soflia.test',
        userId: 'user-1',
      })
    ).toBe('https://soflia.test/api/study-planner/calendar/events?userId=user-1')
  })

  it('detects overlapping calendar events', () => {
    expect(
      detectScheduleConflicts(
        [
          {
            title: 'Reunión',
            start: '2026-04-01T10:00:00',
            end: '2026-04-01T11:00:00',
          },
        ],
        [
          {
            date: '2026-04-01',
            startTime: '10:30',
            endTime: '11:30',
          },
        ]
      )
    ).toEqual({
      hasConflicts: true,
      conflicts: [
        {
          date: '2026-04-01',
          event: 'Reunión',
          time: '10:00 - 11:00',
        },
      ],
    })
  })

  it('returns a safe empty result when the integration call fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    await expect(
      validateProposedSchedule({
        userId: 'user-1',
        proposedSlots: [
          {
            date: '2026-04-01',
            startTime: '10:00',
            endTime: '11:00',
          },
        ],
        fetchImpl,
      })
    ).resolves.toEqual({
      hasConflicts: false,
      conflicts: [],
    })
  })
})
