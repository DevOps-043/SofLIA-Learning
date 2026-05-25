import type { ReportsAnalyticsPlanner } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_UNSPECIFIED, buildBreakdown, calculateAverage, calculatePercentage, incrementMap, normalizeDimension } from '../reports-analytics.helpers'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { BuildContext } from './build-context'
import type { StudySessionRecord } from './study-session-record'

export function buildPlanner(context: BuildContext, sessions: StudySessionRecord[]): ReportsAnalyticsPlanner {
  const statusCounts = new Map<string, number>()
  const plannedMinutes: number[] = []
  const actualMinutes: number[] = []
  let plannedSessions = 0
  let completedSessions = 0
  let missedSessions = 0
  let rescheduledSessions = 0

  sessions.forEach((session) => {
    const courseId = session.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, session.user_id, courseId, [
        session.start_time,
        session.end_time,
        session.completed_at,
        session.started_at,
        session.updated_at,
      ])
    ) {
      return
    }

    const status = session.status.toLowerCase()
    plannedSessions += 1
    incrementMap(statusCounts, normalizeDimension(status))
    plannedMinutes.push(Number(session.duration_minutes) || 0)
    if (session.actual_duration_minutes !== null) actualMinutes.push(Number(session.actual_duration_minutes) || 0)
    if (status === 'completed' || session.completed_at) completedSessions += 1
    if (status === 'missed' || status === 'overdue' || status === 'skipped') missedSessions += 1
    if (session.was_rescheduled) rescheduledSessions += 1
  })

  return {
    plannedSessions,
    completedSessions,
    missedSessions,
    rescheduledSessions,
    adherenceRate: calculatePercentage(completedSessions, plannedSessions),
    averagePlannedMinutes: calculateAverage(plannedMinutes),
    averageActualMinutes: calculateAverage(actualMinutes),
    byStatus: buildBreakdown(statusCounts, plannedSessions),
  }
}
