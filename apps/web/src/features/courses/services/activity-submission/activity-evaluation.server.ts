import type {
  ActivityEvaluationRow,
  SupabaseServerClient,
} from './activity-submission.types'

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
