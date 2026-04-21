import { formatDateTime } from './format.utils'
import { findAlternativeSlots } from './analysis-slots.service'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { CalendarEvent, ProactiveAnalysis } from './types'

export function addCompletionInsights(params: {
  analysis: ProactiveAnalysis
  activeSessions: ProactiveSessionInput[]
  calendarEvents: CalendarEvent[]
  allSessions: ProactiveSessionInput[]
}): void {
  for (const session of params.activeSessions) {
    const durationMinutes = session.duration_minutes || 60
    const progressPct = Math.max(0, Math.min(100, session.progressPct || 0))
    const hasCalendarEventLinked = Boolean(session.hasCalendarEventLinked)

    if (
      session.derivedStatus === 'effectively_completed'
      || session.derivedStatus === 'completed_early'
    ) {
      params.analysis.effectivelyCompletedSessions.push({
        sessionTitle: session.title,
        sessionId: session.id,
        scheduledEndTime: formatDateTime(new Date(session.end_time)),
        calendarEventLinked: hasCalendarEventLinked,
        completedEarly: session.derivedStatus === 'completed_early',
      })
    }

    if (session.derivedStatus === 'in_progress') {
      params.analysis.partialSessions.push({
        sessionTitle: session.title,
        sessionId: session.id,
        progressPct,
        remainingMinutes: Math.max(15, Math.round(durationMinutes * (1 - progressPct / 100))),
        suggestedCompletionSlots: findAlternativeSlots(
          new Date(),
          Math.max(15, Math.round(durationMinutes * (1 - progressPct / 100))),
          params.calendarEvents,
          params.allSessions,
        ).slice(0, 3),
      })
    }
  }
}
