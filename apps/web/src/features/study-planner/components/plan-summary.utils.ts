import type { StudyPlanConfig, StudySession } from '../types/user-context.types'
import type { PlanSummaryStats } from './PlanSummary.types'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

export function getPlanSummaryStats(
  config: StudyPlanConfig,
  sessions: StudySession[],
): PlanSummaryStats {
  const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const totalSessions = sessions.length
  const estimatedWeeks =
    config.goalHoursPerWeek > 0
      ? Math.ceil(totalMinutes / (config.goalHoursPerWeek * 60))
      : 0

  return {
    estimatedWeeks,
    preferredDaysFormatted: config.preferredDays.map((day) => DAY_NAMES[day]).join(', '),
    totalHours,
    totalSessions,
  }
}
