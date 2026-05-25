import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'
import { QuizSubmissionRecord } from './quiz-submission-record'

export async function fetchQuizSubmissions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_quiz_submissions')
    .select('submission_id, enrollment_id, organization_id, percentage_score, score, total_points, user_answers, is_passed, completed_at, created_at, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<QuizSubmissionRecord[]>()

  logQueryError('business user quiz submissions', error)
  return data || []
}
