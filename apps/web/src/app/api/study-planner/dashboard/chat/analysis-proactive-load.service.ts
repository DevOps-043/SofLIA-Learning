import { isWorkBlockEvent } from './analysis-slots.service'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { CalendarEvent, ProactiveAnalysis } from './types'

export function addLoadInsights(params: {
  analysis: ProactiveAnalysis
  sessions: ProactiveSessionInput[]
  calendarEvents: CalendarEvent[]
}): void {
  const dayLoadMap = new Map<string, { totalMinutes: number; events: string[] }>()

  for (const event of params.calendarEvents) {
    if (event.isAllDay || isWorkBlockEvent(event)) {
      continue
    }

    const eventDate = new Date(event.start)
    eventDate.setHours(0, 0, 0, 0)
    const dateKey = eventDate.toISOString().split('T')[0]
    const duration =
      (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60)

    const current = dayLoadMap.get(dateKey) || { totalMinutes: 0, events: [] }
    current.totalMinutes += duration
    current.events.push(event.title)
    dayLoadMap.set(dateKey, current)
  }

  for (const session of params.sessions) {
    const sessionDate = new Date(session.start_time)
    sessionDate.setHours(0, 0, 0, 0)
    const dateKey = sessionDate.toISOString().split('T')[0]
    const current = dayLoadMap.get(dateKey) || { totalMinutes: 0, events: [] }

    current.totalMinutes += session.duration_minutes || 60
    current.events.push(`Sesion: ${session.title}`)
    dayLoadMap.set(dateKey, current)
  }

  let consecutiveHeavyDays = 0
  for (const [dateKey, load] of dayLoadMap) {
    const hours = load.totalMinutes / 60
    if (hours > 8) {
      params.analysis.overloadedDays.push({
        date: dateKey,
        totalHours: Math.round(hours * 10) / 10,
        events: load.events,
        suggestion:
          hours > 10
            ? 'Dia muy saturado. Considera mover alguna sesion o reducir su duracion.'
            : 'Dia cargado. Asegurate de dejar descansos entre actividades.',
      })
      consecutiveHeavyDays += 1
    } else {
      consecutiveHeavyDays = 0
    }
  }

  if (consecutiveHeavyDays >= 3) {
    params.analysis.burnoutRisk = {
      level: consecutiveHeavyDays >= 5 ? 'high' : 'medium',
      consecutiveHeavyDays,
      suggestion: `Llevas ${consecutiveHeavyDays} dias muy cargados seguidos. Considera bajar la carga.`,
    }
  }
}
