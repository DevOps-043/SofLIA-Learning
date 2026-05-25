import { incrementMap, normalizeDimension } from '../reports-analytics.helpers'
import { getCourseIdFromActivityCompletion } from './get-course-id-from-activity-completion'
import { isCompletedStatus } from './is-completed-status'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { unwrapRelation } from './unwrap-relation'
import type { ActivityCompletionRecord } from './activity-completion-record'
import type { ActivityMetricsAccumulator } from './activity-metrics-accumulator'
import type { BuildContext } from './build-context'

export function addLegacyActivityMetrics(
  metrics: ActivityMetricsAccumulator,
  context: BuildContext,
  activity: ActivityCompletionRecord,
): void {
  const courseId = getCourseIdFromActivityCompletion(activity)
  if (!shouldIncludeEngagementRecord(context, activity.user_id, courseId, [
    activity.started_at,
    activity.completed_at,
    activity.updated_at,
  ])) {
    return
  }

  metrics.totalActivities += 1
  metrics.totalAttempts += Number(activity.attempts_to_complete) || 0
  if (activity.time_to_complete_seconds) {
    metrics.totalSeconds += activity.time_to_complete_seconds
    metrics.timedActivities += 1
  }
  if (isCompletedStatus(activity.status)) metrics.completedActivities += 1
  if (activity.user_needed_help) metrics.usersNeedingHelp.add(activity.user_id)
  metrics.redirects += Number(activity.lia_had_to_redirect) || 0

  const activityType = unwrapRelation(activity.lesson_activities)?.activity_type
  incrementMap(metrics.typeCounts, normalizeDimension(activityType))
}
