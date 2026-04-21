import { formatDate } from './format.utils'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { ProactiveAnalysis } from './types'

export function addWeeklyProgressInsights(params: {
  analysis: ProactiveAnalysis
  activeSessions: ProactiveSessionInput[]
  now: Date
  todayStart: Date
}): void {
  const weekStart = new Date(params.todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  for (const session of params.activeSessions) {
    const sessionDate = new Date(session.start_time)
    if (sessionDate < weekStart || sessionDate >= weekEnd) {
      continue
    }

    params.analysis.weeklyProgress.plannedMinutes += session.duration_minutes || 60

    if (session.status === 'completed') {
      params.analysis.weeklyProgress.completedMinutes += session.duration_minutes || 60
    } else if (sessionDate < params.now) {
      params.analysis.weeklyProgress.remainingMinutes += session.duration_minutes || 60
    }
  }

  const completionRate =
    params.analysis.weeklyProgress.plannedMinutes > 0
      ? params.analysis.weeklyProgress.completedMinutes
        / params.analysis.weeklyProgress.plannedMinutes
      : 0

  params.analysis.weeklyProgress.onTrack = completionRate >= 0.7

  if (
    !params.analysis.weeklyProgress.onTrack
    && params.analysis.weeklyProgress.remainingMinutes > 0
  ) {
    params.analysis.weeklyProgress.suggestion =
      `Vas atrasado esta semana. Te faltan ${Math.round(params.analysis.weeklyProgress.remainingMinutes / 60)} horas de estudio. Â¿Quieres que redistribuya las sesiones restantes?`
  }
}

export function addConsistencyInsights(params: {
  analysis: ProactiveAnalysis
  sessions: ProactiveSessionInput[]
  now: Date
}): void {
  const sortedSessions = [...params.sessions].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
  )
  const lastCompletedSession = sortedSessions.find((session) => session.status === 'completed')

  if (!lastCompletedSession) {
    return
  }

  const lastStudyDate = new Date(lastCompletedSession.start_time)
  const daysSinceStudy = Math.floor(
    (params.now.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (daysSinceStudy < 3) {
    return
  }

  params.analysis.consistencyAlert = {
    daysWithoutStudy: daysSinceStudy,
    lastStudyDate: formatDate(lastStudyDate),
    suggestion:
      daysSinceStudy >= 7
        ? `Llevas ${daysSinceStudy} dias sin estudiar. Â¿Te gustaria retomar con una sesion corta?`
        : `Han pasado ${daysSinceStudy} dias desde tu ultima sesion. Es buen momento para retomar.`,
  }
}
