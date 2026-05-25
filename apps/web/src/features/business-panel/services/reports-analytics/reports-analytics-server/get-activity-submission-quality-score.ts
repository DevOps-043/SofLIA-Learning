import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'

export function getActivitySubmissionQualityScore(
  submission: ActivitySubmissionRecord,
  latestEvaluation: ActivityEvaluationRecord | null,
): number {
  if (latestEvaluation?.result_status === 'pass') return 100
  if (latestEvaluation?.result_status === 'revise') return 55
  if (latestEvaluation?.result_status === 'error') return 30
  if (submission.status === 'validated') return 90
  if (submission.status === 'submitted') return 70
  if (submission.status === 'needs_revision') return 50
  return 25
}
