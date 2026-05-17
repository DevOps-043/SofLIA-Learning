import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'

export function isCompletedActivitySubmission(
  submission: ActivitySubmissionRecord,
  latestEvaluation: ActivityEvaluationRecord | null,
): boolean {
  const status = submission.status?.toLowerCase()
  return status === 'validated' || latestEvaluation?.result_status === 'pass'
}
