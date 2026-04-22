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

    const durationMinutes = session.duration_minutes || 60
    params.analysis.weeklyProgress.plannedMinutes += durationMinutes

    if (session.status === 'completed') {
      params.analysis.weeklyProgress.completedMinutes += durationMinutes
      continue
    }

    params.analysis.weeklyProgress.remainingMinutes += durationMinutes

    if (sessionDate < params.now) {
      params.analysis.weeklyProgress.overdueMinutes += durationMinutes
      continue
    }

    params.analysis.weeklyProgress.upcomingMinutes += durationMinutes
  }

  const hasPastDueWork =
    params.analysis.weeklyProgress.overdueMinutes > 0
    || params.analysis.missedSessions.length > 0
    || params.analysis.overdueSessions.length > 0
  const hasActionableOperationalIssue =
    params.analysis.conflicts.length > 0
    || params.analysis.overloadedDays.length > 0
    || params.analysis.burnoutRisk?.level === 'high'

  if (params.analysis.weeklyProgress.plannedMinutes === 0) {
    params.analysis.weeklyProgress.status = 'neutral'
    params.analysis.weeklyProgress.onTrack = true
    params.analysis.weeklyProgress.suggestion =
      'Esta semana no hay sesiones evaluables todavía.'
    return
  }

  if (!hasPastDueWork && params.analysis.weeklyProgress.completedMinutes === 0) {
    params.analysis.weeklyProgress.status = hasActionableOperationalIssue
      ? 'informative'
      : 'neutral'
    params.analysis.weeklyProgress.onTrack = true
    params.analysis.weeklyProgress.suggestion =
      'El plan apenas va arrancando esta semana. Todavía no hay evidencia de atraso real.'
    return
  }

  if (!hasPastDueWork) {
    params.analysis.weeklyProgress.status = 'informative'
    params.analysis.weeklyProgress.onTrack = true
    params.analysis.weeklyProgress.suggestion =
      params.analysis.weeklyProgress.upcomingMinutes > 0
        ? `Vas en camino. Aún quedan ${Math.round(params.analysis.weeklyProgress.upcomingMinutes / 60)} horas programadas por cursar esta semana.`
        : 'Vas en camino con tu plan semanal.'
    return
  }

  params.analysis.weeklyProgress.status = 'actionable'
  params.analysis.weeklyProgress.onTrack = false
  params.analysis.weeklyProgress.suggestion =
    `Ya hay sesiones vencidas esta semana por ${Math.round(params.analysis.weeklyProgress.overdueMinutes / 60)} horas. ¿Quieres que redistribuya únicamente las pendientes sin romper el orden de lecciones?`
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
        ? `Llevas ${daysSinceStudy} días sin estudiar. ¿Te gustaría retomar con una sesión corta?`
        : `Han pasado ${daysSinceStudy} días desde tu última sesión. Es buen momento para retomar.`,
  }
}
