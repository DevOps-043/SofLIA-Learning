import { logger } from '../../../../../lib/utils/logger'
import { addCompletionInsights } from './analysis-proactive-completion.service'
import { addConflictInsights } from './analysis-proactive-conflicts.service'
import { addFreeSlotInsights } from './analysis-proactive-free-slots.service'
import { addLoadInsights } from './analysis-proactive-load.service'
import { addConsistencyInsights, addWeeklyProgressInsights } from './analysis-proactive-progress.service'
import { addRecoveryInsights } from './analysis-proactive-recovery.service'
import type { ProactiveSessionInput } from './analysis-proactive.types'
import type { CalendarEvent, ProactiveAnalysis } from './types'

function createEmptyAnalysis(): ProactiveAnalysis {
  return {
    conflicts: [],
    overloadedDays: [],
    missedSessions: [],
    overdueSessions: [],
    effectivelyCompletedSessions: [],
    partialSessions: [],
    freeSlots: [],
    weeklyProgress: {
      plannedMinutes: 0,
      completedMinutes: 0,
      remainingMinutes: 0,
      overdueMinutes: 0,
      upcomingMinutes: 0,
      onTrack: true,
      status: 'neutral',
      suggestion: '',
    },
    consistencyAlert: null,
    burnoutRisk: null,
    patterns: {
      frequentRescheduleTime: null,
      preferredStudyTime: null,
      suggestion: null,
    },
  }
}

export async function analyzeProactively(
  userId: string,
  planId: string,
  sessions: ProactiveSessionInput[],
  calendarEvents: CalendarEvent[],
  _timezone: string,
): Promise<ProactiveAnalysis> {
  const analysis = createEmptyAnalysis()
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  logger.info(
    `Iniciando análisis proactivo para usuario ${userId} con ${sessions.length} sesiones y ${calendarEvents.length} eventos`,
  )

  const activeSessions = sessions.filter((session) => session.plan_id === planId)
  const otherSessions = sessions.filter((session) => session.plan_id !== planId)

  addCompletionInsights({
    analysis,
    activeSessions,
    calendarEvents,
    allSessions: sessions,
  })
  addConflictInsights({
    analysis,
    activeSessions,
    otherSessions,
    calendarEvents,
    allSessions: sessions,
    now,
  })
  addLoadInsights({ analysis, sessions, calendarEvents })
  addRecoveryInsights({
    analysis,
    activeSessions,
    calendarEvents,
    allSessions: sessions,
    now,
  })
  addFreeSlotInsights({
    analysis,
    sessions,
    calendarEvents,
    todayStart,
  })
  addWeeklyProgressInsights({
    analysis,
    activeSessions,
    now,
    todayStart,
  })
  addConsistencyInsights({
    analysis,
    sessions,
    now,
  })

  logger.info(
    `Análisis completado: ${analysis.conflicts.length} conflictos, ${analysis.overloadedDays.length} días sobrecargados, ${analysis.missedSessions.length} sesiones perdidas, ${analysis.overdueSessions.length} sesiones no realizadas`,
  )

  return analysis
}
