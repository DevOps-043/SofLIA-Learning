import { getCourseIdFromActivityCompletion } from './get-course-id-from-activity-completion'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { ActivityCompletionRecord } from './activity-completion-record'
import type { BuildContext } from './build-context'

export function filterQualityActivities(
  context: BuildContext,
  activities: ActivityCompletionRecord[],
): ActivityCompletionRecord[] {
  return activities.filter((activity) =>
    shouldIncludeEngagementRecord(context, activity.user_id, getCourseIdFromActivityCompletion(activity), [
      activity.started_at,
      activity.completed_at,
      activity.updated_at,
    ]),
  )
}
