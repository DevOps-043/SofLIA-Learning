import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGoogleStudySessionEvent,
  createMicrosoftStudySessionEvent,
} from '../sync-sessions-provider.service'

vi.mock('../../../../../../features/study-planner/services/calendar-integration.service', () => ({
  CalendarIntegrationService: {
    getOrCreatePlatformCalendar: vi.fn(),
  },
}))

import { CalendarIntegrationService } from '../../../../../../features/study-planner/services/calendar-integration.service'

const baseSession = {
  id: 'session-1',
  user_id: 'user-1',
  title: 'Leccion 1: Introduccion y 6 mas',
  description: '1. Leccion uno',
  start_time: '2026-04-01T10:00:00.000Z',
  end_time: '2026-04-01T11:00:00.000Z',
  plan_id: 'plan-1',
  course_id: 'course-1',
  metrics: {
    plannedLessons: [
      {
        courseTitle: 'Auditoria de SofLIA',
        lessonTitle: 'Leccion uno',
      },
    ],
  },
}

describe('sync-sessions-provider.service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null event ids when session dates are invalid', async () => {
    const result = await createMicrosoftStudySessionEvent(
      'token',
      {
        ...baseSession,
        start_time: 'invalid-date',
      },
      'UTC',
    )

    expect(result).toEqual({ eventId: null })
  })

  it('recreates the secondary Google calendar on 404 and returns the new id', async () => {
    vi.mocked(
      CalendarIntegrationService.getOrCreatePlatformCalendar,
    ).mockResolvedValue('new-calendar-id')
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'google-event-1' }), { status: 200 }),
      )

    const result = await createGoogleStudySessionEvent(
      'token',
      baseSession,
      'UTC',
      'old-calendar-id',
    )

    expect(result).toEqual({
      eventId: 'google-event-1',
      newSecondaryCalendarId: 'new-calendar-id',
    })
    const eventBody = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))
    expect(eventBody.summary).toBe('Sesión de estudio de Auditoria de SofLIA')
  })

  it('creates Microsoft calendar events', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ms-event-1' }), { status: 200 }),
    )

    const result = await createMicrosoftStudySessionEvent(
      'token',
      baseSession,
      'UTC',
    )

    expect(result).toEqual({ eventId: 'ms-event-1' })
    const eventBody = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))
    expect(eventBody.subject).toBe('Sesión de estudio de Auditoria de SofLIA')
  })
})
