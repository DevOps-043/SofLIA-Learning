import { getCourseIdFromActivityCompletion } from './get-course-id-from-activity-completion'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { BuildContext } from './build-context'

export function countIncludedActivities(
  context: BuildContext,
  queryData: Pick<AnalyticsQueryData, 'activityCompletions' | 'activitySubmissions'>,
): number {
  const legacyActivityTotal = queryData.activityCompletions.filter((record) =>
    shouldIncludeEngagementRecord(context, record.user_id, getCourseIdFromActivityCompletion(record), [
      record.started_at,
      record.completed_at,
      record.updated_at,
    ]),
  ).length
  const submissionActivityTotal = queryData.activitySubmissions.filter((record) =>
    shouldIncludeEngagementRecord(context, record.user_id, record.course_id, [
      record.submitted_at,
      record.last_validated_at,
      record.created_at,
      record.updated_at,
    ]),
  ).length

  return legacyActivityTotal + submissionActivityTotal
}
