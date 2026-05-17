import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { BuildContext } from './build-context'

export function filterQualitySubmissions(
  context: BuildContext,
  submissions: ActivitySubmissionRecord[],
): ActivitySubmissionRecord[] {
  return submissions.filter((submission) =>
    shouldIncludeEngagementRecord(context, submission.user_id, submission.course_id, [
      submission.submitted_at,
      submission.last_validated_at,
      submission.created_at,
      submission.updated_at,
    ]),
  )
}
