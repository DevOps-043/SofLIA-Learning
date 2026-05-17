import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { buildBreakdown, calculateAverage, calculatePercentage, incrementMap } from '../../reports-analytics/reports-analytics.helpers'
import { buildTrend } from './build-trend'
import { isCompletedStatus } from './is-completed-status'
import { QueryData } from './query-data'

export function buildPlanning(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const completed = data.studySessions.filter((session) => isCompletedStatus(session.status) || Boolean(session.completed_at)).length
  const missed = data.studySessions.filter((session) => ['missed', 'skipped', 'cancelled'].includes(session.status)).length
  const rescheduled = data.studySessions.filter((session) => session.was_rescheduled).length
  const statusCounts = new Map<string, number>()
  data.studySessions.forEach((session) => incrementMap(statusCounts, session.status || 'scheduled'))

  return {
    plannedSessions: data.studySessions.length,
    completedSessions: completed,
    missedSessions: missed,
    rescheduledSessions: rescheduled,
    adherenceRate: calculatePercentage(completed, data.studySessions.length),
    averagePlannedMinutes: calculateAverage(data.studySessions.map((session) => Number(session.duration_minutes) || 0)),
    averageActualMinutes: calculateAverage(data.studySessions.map((session) => Number(session.actual_duration_minutes) || 0)),
    byStatus: buildBreakdown(statusCounts, data.studySessions.length),
    sessionsTrend: buildTrend(data.studySessions.map((session) => session.completed_at || session.started_at || session.start_time), period),
  }
}
