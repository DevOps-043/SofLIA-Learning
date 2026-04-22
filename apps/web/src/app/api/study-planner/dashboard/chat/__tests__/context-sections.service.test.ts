import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../calendar.service', () => ({
  createAdminClient: vi.fn(),
  normalizeCalendarEventId: (eventId: string | null | undefined) => String(eventId || '').trim(),
  parseSessionMetrics: (metrics: unknown) =>
    metrics && typeof metrics === 'object' && !Array.isArray(metrics) ? metrics : null,
  resolveSessionCalendarSync: ({
    externalEventId,
    calendarProvider,
    metrics,
  }: {
    externalEventId?: string | null
    calendarProvider?: string | null
    metrics?: { calendarSync?: Record<string, unknown> } | null
  }) =>
    metrics?.calendarSync || (externalEventId && calendarProvider
      ? {
          provider: calendarProvider,
          externalEventId,
          normalizedExternalEventId: externalEventId,
          calendarId: null,
          source: 'sync',
          lastSyncedAt: new Date().toISOString(),
        }
      : null),
}))

vi.mock('../../../../../../features/study-planner/services/calendar-integration.service', () => ({
  CalendarIntegrationService: {
    getGoogleCalendarList: vi.fn(),
    getMicrosoftCalendarList: vi.fn(),
  },
}))

import { setCurrentTimezone } from '../format.utils'
import {
  buildCalendarEventsTodaySection,
  buildCalendarLoadSections,
  buildOrphanedSessionsAlertSection,
  buildProactiveAnalysisSection,
  buildSessionsSection,
} from '../context-sections.service'
import type { ProactiveAnalysis } from '../types'

describe('context-sections.service', () => {
  beforeEach(() => {
    setCurrentTimezone('America/Mexico_City')
    vi.useRealTimers()
  })

  it('renders orphaned sessions alert with actionable guidance', () => {
    const section = buildOrphanedSessionsAlertSection({
      deletedFromDb: [],
      orphanedSessions: ['Sesion de Algebra'],
      message: '',
    })

    expect(section).toContain('CAMBIOS DETECTADOS EN EL CALENDARIO')
    expect(section).toContain('"Sesion de Algebra"')
    expect(section).toContain('NO fueron eliminadas automaticamente')
  })

  it('renders sessions with lesson and calendar sync details', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T08:00:00-06:00'))

    const section = buildSessionsSection([
      {
        id: 'session-1',
        title: 'Sesion de Algebra',
        start_time: '2026-04-20T10:00:00-06:00',
        end_time: '2026-04-20T11:00:00-06:00',
        duration_minutes: 60,
        status: 'planned',
        external_event_id: 'evt-1',
        calendar_provider: 'google',
        plan_id: 'plan-1',
        metrics: {
          plannedLessons: [
            { lessonTitle: 'Leccion 1', durationMinutes: 20 },
            { lessonTitle: 'Leccion 2', durationMinutes: 25 },
          ],
          calendarSync: {
            provider: 'google',
            externalEventId: 'evt-1',
            normalizedExternalEventId: 'evt-1',
            source: 'sync',
            lastSyncedAt: '2026-04-20T09:00:00-06:00',
          },
        },
      },
    ])

    expect(section).toContain('Sesion de Algebra [HOY]')
    expect(section).toContain('Lecciones del plan: Leccion 1 | Leccion 2')
    expect(section).toContain('Estado calendario: Sincronizada (google)')
    expect(section).toContain('Tiempo total estimado asociado: 45 minutos')
  })

  it('renders proactive analysis summary', () => {
    const analysis: ProactiveAnalysis = {
      conflicts: [
        {
          sessionTitle: 'Sesion intensa',
          sessionId: 's-1',
          sessionDate: 'lunes 20 de abril',
          sessionTime: '10:00 - 11:00',
          conflictingEvent: 'Reunion',
          conflictTime: '10:30 - 11:00',
          suggestedAlternatives: ['martes 21, 12:00 - 13:00'],
        },
      ],
      overloadedDays: [
        {
          date: '2026-04-20',
          totalHours: 9.5,
          events: [],
          suggestion: 'Reduce una sesion.',
        },
      ],
      missedSessions: [],
      overdueSessions: [
        {
          sessionTitle: 'Sesion atrasada',
          sessionId: 's-2',
          scheduledTime: 'domingo 19 a las 10:00',
          hoursOverdue: 5,
          suggestedRecoverySlots: ['lunes 20, 19:00 - 20:00'],
        },
      ],
      effectivelyCompletedSessions: [],
      partialSessions: [],
      freeSlots: [
        {
          date: '2026-04-21',
          startTime: '13:00',
          endTime: '13:20',
          duration: 20,
          suggestion: 'Buen momento para repasar.',
        },
      ],
      weeklyProgress: {
        plannedMinutes: 180,
        completedMinutes: 60,
        remainingMinutes: 120,
        overdueMinutes: 120,
        upcomingMinutes: 0,
        onTrack: false,
        status: 'actionable',
        suggestion: 'Te conviene redistribuir.',
      },
      consistencyAlert: {
        daysWithoutStudy: 4,
        lastStudyDate: 'jueves 16 de abril',
        suggestion: 'Retoma con una sesion corta.',
      },
      burnoutRisk: {
        level: 'medium',
        consecutiveHeavyDays: 3,
        suggestion: 'Baja la carga.',
      },
      patterns: {
        frequentRescheduleTime: null,
        preferredStudyTime: null,
        suggestion: null,
      },
    }

    const section = buildProactiveAnalysisSection(analysis)

    expect(section).toContain('CONFLICTOS DETECTADOS')
    expect(section).toContain('Sesion intensa')
    expect(section).toContain('SESIONES NO REALIZADAS')
    expect(section).toContain('VENTANAS LIBRES PARA MICRO-SESIONES')
    expect(section).toContain('Te conviene redistribuir.')
  })

  it('classifies work blocks separately from conflict events', () => {
    const [workBlockSection, otherEventsSection] = buildCalendarLoadSections([
      {
        id: 'wb-1',
        title: 'Bloque de trabajo',
        start: '2026-04-21T09:00:00-06:00',
        end: '2026-04-21T13:00:00-06:00',
        isAllDay: false,
        isStudySession: false,
      },
      {
        id: 'event-1',
        title: 'Reunion de equipo',
        start: '2026-04-21T15:00:00-06:00',
        end: '2026-04-21T16:00:00-06:00',
        isAllDay: false,
        isStudySession: false,
      },
    ])

    expect(workBlockSection).toContain('BLOQUES DE TRABAJO DEL USUARIO')
    expect(otherEventsSection).toContain('OTROS EVENTOS DE LA SEMANA')
  })

  it('renders external events section with provider-aware label', () => {
    const section = buildCalendarEventsTodaySection([], 'microsoft')
    expect(section).toContain('Microsoft Calendar')
    expect(section).toContain('No hay eventos programados para hoy')
  })
})
