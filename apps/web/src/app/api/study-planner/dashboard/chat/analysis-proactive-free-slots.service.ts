import { formatTime } from './format.utils'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { CalendarEvent, ProactiveAnalysis } from './types'

export function addFreeSlotInsights(params: {
  analysis: ProactiveAnalysis
  sessions: ProactiveSessionInput[]
  calendarEvents: CalendarEvent[]
  todayStart: Date
}): void {
  const next7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(params.todayStart)
    date.setDate(date.getDate() + index)
    return date
  })

  for (const day of next7Days) {
    const dayStart = new Date(day)
    dayStart.setHours(8, 0, 0, 0)

    const dateKey = day.toISOString().split('T')[0]
    const dayEvents = [
      ...params.calendarEvents,
      ...params.sessions.map((session) => ({
        start: session.start_time,
        end: session.end_time,
        title: session.title,
      })),
    ]
      .filter((event) => new Date(event.start).toISOString().split('T')[0] === dateKey)
      .sort((first, second) => new Date(first.start).getTime() - new Date(second.start).getTime())

    let lastEnd = dayStart.getTime()
    for (const event of dayEvents) {
      const eventStart = new Date(event.start).getTime()
      const gap = (eventStart - lastEnd) / (1000 * 60)

      if (gap >= 15 && gap <= 45) {
        params.analysis.freeSlots.push({
          date: dateKey,
          startTime: formatTime(new Date(lastEnd)),
          endTime: formatTime(new Date(eventStart)),
          duration: Math.round(gap),
          suggestion:
            gap < 20
              ? 'Ideal para repasar flashcards o hacer una lectura rapida.'
              : 'Puedes hacer una micro-sesion de estudio enfocado.',
        })
      }

      lastEnd = Math.max(lastEnd, new Date(event.end).getTime())
    }
  }
}
