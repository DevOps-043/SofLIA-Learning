import { incrementMap, normalizeDimension } from '../reports-analytics.helpers'
import { isCompletedActivitySubmission } from './is-completed-activity-submission'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { unwrapRelation } from './unwrap-relation'
import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivityMetricsAccumulator } from './activity-metrics-accumulator'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { BuildContext } from './build-context'

export function addActivitySubmissionMetrics(
  metrics: ActivityMetricsAccumulator,
  context: BuildContext,
  submission: ActivitySubmissionRecord,
  latestEvaluation: ActivityEvaluationRecord | null,
): void {
  if (!shouldIncludeEngagementRecord(context, submission.user_id, submission.course_id, [
    submission.submitted_at,
    submission.last_validated_at,
    submission.created_at,
    submission.updated_at,
  ])) {
    return
  }

  metrics.totalActivities += 1
  metrics.totalAttempts += 1
  if (isCompletedActivitySubmission(submission, latestEvaluation)) metrics.completedActivities += 1
  if (latestEvaluation?.result_status === 'revise' || submission.status === 'needs_revision') {
    metrics.usersNeedingHelp.add(submission.user_id)
  }

  const activityType = unwrapRelation(submission.lesson_activities)?.activity_type
  incrementMap(metrics.typeCounts, normalizeDimension(activityType))
}
