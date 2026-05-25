import { ActivityEvaluationRecord } from './activity-evaluation-record'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { chunkArray } from './chunk-array'
import { logQueryError } from './log-query-error'

export async function fetchActivityEvaluations(
  supabase: BusinessUserAnalyticsSupabaseClient,
  submissionIds: string[],
) {
  if (submissionIds.length === 0) return []

  const rows: ActivityEvaluationRecord[] = []
  for (const chunk of chunkArray(submissionIds, 200)) {
    const { data, error } = await supabase
      .from('user_activity_evaluations')
      .select('submission_id, result_status, feedback_payload, model_name, created_at')
      .in('submission_id', chunk)
      .order('created_at', { ascending: false })
      .returns<ActivityEvaluationRecord[]>()

    logQueryError('business user activity evaluations', error)
    rows.push(...(data || []))
  }

  return rows
}
