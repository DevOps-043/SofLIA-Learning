import type {
  ActivityEvaluationRecord,
  ActivitySubmissionSummary,
} from '../../types/activity-config'
import { normalizeActivityEvaluationFeedback } from '../../types/activity-config'

import { isActivitySubmissionCompletionSatisfied } from './completion'
import type {
  ActivityEvaluationRow,
  ActivitySubmissionRow,
  SupabaseServerClient,
} from './types'

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
  activityConfig: Parameters<typeof isActivitySubmissionCompletionSatisfied>[0],
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

export async function loadLatestEvaluationMap(
  supabase: SupabaseServerClient,
  submissionIds: string[],
) {
  if (submissionIds.length === 0) {
    return new Map<string, ActivityEvaluationRow>()
  }

  const { data: evaluations } = await supabase
    .from('user_activity_evaluations')
    .select('submission_id, evaluation_id, result_status, feedback_payload, created_at')
    .in('submission_id', submissionIds)
    .order('created_at', { ascending: false })

  const evaluationMap = new Map<string, ActivityEvaluationRow>()
  ;((evaluations || []) as ActivityEvaluationRow[]).forEach((evaluation) => {
    if (!evaluationMap.has(evaluation.submission_id)) {
      evaluationMap.set(evaluation.submission_id, evaluation)
    }
  })

  return evaluationMap
}
