import { REPORTS_ANALYTICS_UNSPECIFIED, clampPercentage } from '../reports-analytics.helpers'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { unwrapRelation } from './unwrap-relation'
import type { ActivityMetricsAccumulator } from './activity-metrics-accumulator'
import type { BuildContext } from './build-context'
import type { QuizSubmissionRecord } from './quiz-submission-record'

export function addQuizActivityMetrics(
  metrics: ActivityMetricsAccumulator,
  context: BuildContext,
  quiz: QuizSubmissionRecord,
): void {
  const enrollment = unwrapRelation(quiz.user_course_enrollments)
  const courseId = enrollment?.course_id || REPORTS_ANALYTICS_UNSPECIFIED
  if (!shouldIncludeEngagementRecord(context, quiz.user_id, courseId, [
    quiz.completed_at,
    quiz.created_at,
    quiz.updated_at,
  ])) {
    return
  }

  metrics.quizAttempts += 1
  if (quiz.is_passed) metrics.quizPassed += 1
  metrics.quizScores.push(clampPercentage(Number(quiz.percentage_score) || 0))
}
