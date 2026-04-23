import {
  normalizeActivityEvaluationFeedback,
  type ActivityConfig,
  type ActivityEvaluationRecord,
  type ActivitySubmissionSummary,
} from '../../types/activity-config'
import { isActivitySubmissionCompletionSatisfied } from './activity-submission-completion.service'
import type {
  ActivityEvaluationRow,
  ActivitySubmissionRow,
} from './activity-submission.types'

function toActivityEvaluationRecord(
  evaluation: ActivityEvaluationRow | null,
): ActivityEvaluationRecord | null {
  if (!evaluation) {
    return null
  }

  return {
    evaluationId: evaluation.evaluation_id,
    resultStatus: evaluation.result_status,
    createdAt: evaluation.created_at,
    feedback: normalizeActivityEvaluationFeedback(evaluation.feedback_payload),
  }
}

export function createActivitySubmissionSummary(
  activityConfig: ActivityConfig,
  submission: ActivitySubmissionRow,
  latestEvaluation: ActivityEvaluationRow | null,
): ActivitySubmissionSummary {
  return {
    submissionId: submission.submission_id,
    status: submission.status,
    completionSatisfied: isActivitySubmissionCompletionSatisfied(
      activityConfig,
      submission,
      latestEvaluation,
    ),
    submittedAt: submission.submitted_at,
    lastValidatedAt: submission.last_validated_at,
    updatedAt: submission.updated_at,
    latestEvaluation: toActivityEvaluationRecord(latestEvaluation),
  }
}
