import { chunkArray } from './chunk-array'
import { fetchPagedRows } from './fetch-paged-rows'
import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export async function fetchActivityEvaluations(
  supabase: ReportsAnalyticsSupabaseClient,
  submissions: ActivitySubmissionRecord[],
): Promise<ActivityEvaluationRecord[]> {
  const submissionIds = Array.from(
    new Set(submissions.map((submission) => submission.submission_id).filter(Boolean)),
  )

  if (submissionIds.length === 0) return []

  const chunkResults = await Promise.all(
    chunkArray(submissionIds, 400).map((chunk) =>
      fetchPagedRows<ActivityEvaluationRecord>('activity evaluations', (from, to) =>
        supabase
          .from('user_activity_evaluations')
          .select(`
            evaluation_id,
            submission_id,
            result_status,
            feedback_payload,
            model_name,
            created_at
          `)
          .in('submission_id', chunk)
          .range(from, to),
      ),
    ),
  )

  return chunkResults.flat()
}
