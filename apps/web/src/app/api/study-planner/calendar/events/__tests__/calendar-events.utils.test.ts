import { describe, expect, it } from 'vitest'
import {
  filterOrphanedCalendarEvents,
  mapGoogleCalendarEvent,
  mapMicrosoftCalendarEvent,
  needsCalendarTokenRefresh,
  normalizeExternalEventId,
  parseCalendarDateRange,
} from '../calendar-events.utils'

describe('calendar-events.utils', () => {
  it('parses date range with safe defaults', () => {
    const now = new Date('2026-04-01T10:00:00.000Z')
    const result = parseCalendarDateRange(
      'https://example.com/api/study-planner/calendar/events',
      now,
    )

    expect(result.startDate.toISOString()).toBe(now.toISOString())
    expect(result.endDate.toISOString()).toBe('2026-04-15T10:00:00.000Z')
  })

  it('detects refresh need for missing or expired tokens', () => {
    const now = new Date('2026-04-01T00:00:00.000Z')
    expect(needsCalendarTokenRefresh(null, now)).toBe(true)
    expect(needsCalendarTokenRefresh('2026-03-31T23:59:59.000Z', now)).toBe(
      true,
    )
    expect(needsCalendarTokenRefresh('2026-04-02T00:00:00.000Z', now)).toBe(
      false,
    )
  })

  it('normalizes recurring external event ids', () => {
    expect(normalizeExternalEventId('event_20260401')).toBe('event')
    expect(normalizeExternalEventId(123)).toBe('123')
    expect(normalizeExternalEventId(null)).toBe('')
  })

  it('maps all-day Google events to local-day boundaries', () => {
    const mapped = mapGoogleCalendarEvent(
      {
        id: 'google-1',
        summary: 'Bloque',
        start: { date: '2026-04-10' },
        end: { date: '2026-04-11' },
      },
      'primary',
    )

    expect(mapped).toMatchObject({
      id: 'google-1',
      title: 'Bloque',
      start: '2026-04-10T00:00:00',
      end: '2026-04-10T23:59:59',
      isAllDay: true,
      calendarId: 'primary',
    })
  })

  it('maps all-day Microsoft events to local-day boundaries', () => {
    const mapped = mapMicrosoftCalendarEvent({
      id: 'ms-1',
      subject: 'Focus',
      isAllDay: true,
      start: { dateTime: '2026-04-12T00:00:00.0000000' },
      end: { dateTime: '2026-04-13T00:00:00.0000000' },
      location: { displayName: 'Remote' },
      showAs: 'busy',
    })

    expect(mapped).toMatchObject({
      id: 'ms-1',
      title: 'Focus',
      start: '2026-04-12T00:00:00',
      end: '2026-04-12T23:59:59',
      location: 'Remote',
      status: 'busy',
      isAllDay: true,
    })
  })

  it('filters orphaned events using normalized ids', () => {
    const result = filterOrphanedCalendarEvents(
      [
        {
          id: 'event-1_abc',
          title: 'Keep?',
          description: '',
          start: '2026-04-01T10:00:00.000Z',
          end: '2026-04-01T11:00:00.000Z',
          location: '',
          status: 'confirmed',
          isAllDay: false,
        },
        {
          id: 'event-2',
          title: 'Keep',
          description: '',
          start: '2026-04-01T12:00:00.000Z',
          end: '2026-04-01T13:00:00.000Z',
          location: '',
          status: 'confirmed',
          isAllDay: false,
        },
      ],
      new Set(['event-1']),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('event-2')
  })
})
