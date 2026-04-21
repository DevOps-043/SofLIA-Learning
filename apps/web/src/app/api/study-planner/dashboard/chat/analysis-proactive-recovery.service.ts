import { findAlternativeSlots } from './analysis-slots.service'
import { formatDateTime } from './format.utils'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { CalendarEvent, ProactiveAnalysis } from './types'

export function addRecoveryInsights(params: {
  analysis: ProactiveAnalysis
  activeSessions: ProactiveSessionInput[]
  calendarEvents: CalendarEvent[]
  allSessions: ProactiveSessionInput[]
  now: Date
}): void {
  for (const session of params.activeSessions) {
    if (session.status === 'missed') {
      params.analysis.missedSessions.push({
        sessionTitle: session.title,
        sessionId: session.id,
        originalTime: formatDateTime(new Date(session.start_time)),
        suggestedRecoverySlots: findAlternativeSlots(
          new Date(),
          session.duration_minutes || 60,
          params.calendarEvents,
          params.allSessions,
        ).slice(0, 3),
      })
    }

    if (session.status === 'planned') {
      const sessionEndTime = new Date(session.end_time)
      const hoursOverdue =
        (params.now.getTime() - sessionEndTime.getTime()) / (1000 * 60 * 60)

      if (hoursOverdue > 1) {
        params.analysis.overdueSessions.push({
          sessionTitle: session.title,
          sessionId: session.id,
          scheduledTime: formatDateTime(new Date(session.start_time)),
          hoursOverdue: Math.round(hoursOverdue),
          suggestedRecoverySlots: findAlternativeSlots(
            new Date(),
            session.duration_minutes || 60,
            params.calendarEvents,
            params.allSessions,
          ).slice(0, 3),
        })
      }
    }
  }
}
