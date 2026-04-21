import { beforeEach, describe, expect, it, vi } from 'vitest'

const calendarIntegrationServiceMock = vi.hoisted(() => ({
  getGoogleCalendarList: vi.fn(),
  getMicrosoftCalendarList: vi.fn(),
}))

vi.mock('../calendar.service', () => ({
  createAdminClient: vi.fn(),
  normalizeCalendarEventId: (eventId: string | null | undefined) => String(eventId || '').trim(),
  parseSessionMetrics: (metrics: unknown) =>
    metrics && typeof metrics === 'object' && !Array.isArray(metrics) ? metrics : null,
  resolveSessionCalendarSync: ({
    externalEventId,
    metrics,
  }: {
    externalEventId?: string | null
    metrics?: { calendarSync?: Record<string, unknown> } | null
  }) =>
    metrics?.calendarSync || (externalEventId
      ? {
          provider: 'google',
          externalEventId,
          normalizedExternalEventId: String(externalEventId),
          calendarId: null,
          source: 'sync',
          lastSyncedAt: new Date().toISOString(),
        }
      : null),
}))

vi.mock('../../../../../../features/study-planner/services/calendar-integration.service', () => ({
  CalendarIntegrationService: calendarIntegrationServiceMock,
}))

import {
  buildCalendarListContext,
  getSessionLessonSummary,
} from '../context-prompt.service'

describe('context-prompt.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dedupes planned lesson titles from metrics', () => {
    const summary = getSessionLessonSummary('Sesion 1', {
      plannedLessons: [
        { lessonTitle: 'Leccion A', durationMinutes: 20 },
        { lessonTitle: 'Leccion B', durationMinutes: 25 },
      ],
      plannedLessonTitles: ['Leccion B', 'Leccion C'],
    })

    expect(summary.lessonTitles).toEqual(['Leccion A', 'Leccion B', 'Leccion C'])
    expect(summary.totalMinutes).toBe(45)
  })

  it('builds google calendar context with selected calendars', async () => {
    calendarIntegrationServiceMock.getGoogleCalendarList.mockResolvedValue([
      { id: 'primary', summary: 'Trabajo', primary: true },
      { id: 'family', summary: 'Familia', primary: false },
    ])

    const context = await buildCalendarListContext({
      accessToken: 'token',
      provider: 'google',
      selectedCalendarIds: ['family'],
    })

    expect(context).toContain('CALENDARIOS DISPONIBLES DEL USUARIO (Google)')
    expect(context).toContain('Seleccion actual: family')
    expect(context).toContain('[no seleccionado] "Trabajo"')
    expect(context).toContain('[seleccionado] "Familia"')
  })

  it('builds microsoft calendar context using default calendar when nothing is selected', async () => {
    calendarIntegrationServiceMock.getMicrosoftCalendarList.mockResolvedValue([
      { id: 'main', name: 'Principal', isDefaultCalendar: true },
      { id: 'team', name: 'Equipo', isDefaultCalendar: false },
    ])

    const context = await buildCalendarListContext({
      accessToken: 'token',
      provider: 'microsoft',
      selectedCalendarIds: null,
    })

    expect(context).toContain('CALENDARIOS DISPONIBLES DEL USUARIO (Microsoft)')
    expect(context).toContain('Seleccion actual: solo principal (sin configurar)')
    expect(context).toContain('[seleccionado] "Principal"')
    expect(context).toContain('[no seleccionado] "Equipo"')
  })
})
