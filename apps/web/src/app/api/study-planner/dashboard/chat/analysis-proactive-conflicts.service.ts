import { findAlternativeSlots, isWorkBlockEvent } from './analysis-slots.service'
import { formatDate, formatTime } from './format.utils'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { CalendarEvent, ProactiveAnalysis } from './types'

function hasOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart
}

export function addConflictInsights(params: {
  analysis: ProactiveAnalysis
  activeSessions: ProactiveSessionInput[]
  otherSessions: ProactiveSessionInput[]
  calendarEvents: CalendarEvent[]
  allSessions: ProactiveSessionInput[]
  now: Date
}): void {
  for (const session of params.activeSessions) {
    const sessionStart = new Date(session.start_time).getTime()
    const sessionEnd = new Date(session.end_time).getTime()

    if (sessionStart < params.now.getTime()) {
      continue
    }

    if (
      session.derivedStatus === 'effectively_completed'
      || session.derivedStatus === 'completed_early'
    ) {
      continue
    }

    let conflictFound = false

    for (const event of params.calendarEvents) {
      if (event.isStudySession || isWorkBlockEvent(event)) {
        continue
      }

      const eventStart = new Date(event.start).getTime()
      const eventEnd = new Date(event.end).getTime()

      if (!hasOverlap(sessionStart, sessionEnd, eventStart, eventEnd)) {
        continue
      }

      const alternatives = findAlternativeSlots(
        new Date(session.start_time),
        session.duration_minutes || 60,
        params.calendarEvents,
        params.allSessions,
      )

      params.analysis.conflicts.push({
        sessionTitle: session.title,
        sessionId: session.id,
        sessionDate: formatDate(new Date(session.start_time)),
        sessionTime: `${formatTime(new Date(session.start_time))} - ${formatTime(new Date(session.end_time))}`,
        conflictingEvent: event.title,
        conflictTime: `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`,
        suggestedAlternatives: alternatives.slice(0, 3),
      })
      conflictFound = true
      break
    }

    if (conflictFound) {
      continue
    }

    for (const otherSession of params.otherSessions) {
      const otherStart = new Date(otherSession.start_time).getTime()
      const otherEnd = new Date(otherSession.end_time).getTime()

      if (!hasOverlap(sessionStart, sessionEnd, otherStart, otherEnd)) {
        continue
      }

      const alternatives = findAlternativeSlots(
        new Date(session.start_time),
        session.duration_minutes || 60,
        params.calendarEvents,
        params.allSessions,
      )

      params.analysis.conflicts.push({
        sessionTitle: session.title,
        sessionId: session.id,
        sessionDate: formatDate(new Date(session.start_time)),
        sessionTime: `${formatTime(new Date(session.start_time))} - ${formatTime(new Date(session.end_time))}`,
        conflictingEvent: `Planificacion: ${otherSession.title}`,
        conflictTime: `${formatTime(new Date(otherSession.start_time))} - ${formatTime(new Date(otherSession.end_time))}`,
        suggestedAlternatives: alternatives.slice(0, 3),
      })
      break
    }
  }
}
