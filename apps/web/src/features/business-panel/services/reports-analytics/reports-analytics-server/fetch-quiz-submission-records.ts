import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { QuizSubmissionRecord } from './quiz-submission-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchQuizSubmissionRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
  dateRange: { from: string; to: string },
): Promise<QuizSubmissionRecord[]> {
  return fetchUserScopedRows<QuizSubmissionRecord>('quiz submissions', userIds, (chunk, from, to) =>
    supabase
      .from('user_quiz_submissions')
      .select(`
        submission_id,
        user_id,
        enrollment_id,
        lesson_id,
        activity_id,
        percentage_score,
        score,
        total_points,
        user_answers,
        is_passed,
        completed_at,
        created_at,
        updated_at,
        user_course_enrollments!inner (
          course_id,
          courses (
            id,
            title
          )
        )
      `)
      .in('user_id', chunk)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .range(from, to),
  )
}
