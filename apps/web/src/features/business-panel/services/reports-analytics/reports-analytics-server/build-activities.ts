import type { ReportsAnalyticsActivities } from '../../../types/reports-analytics.types'
import { buildBreakdown, calculateAverage, calculatePercentage } from '../reports-analytics.helpers'
import { addActivitySubmissionMetrics } from './add-activity-submission-metrics'
import { addLegacyActivityMetrics } from './add-legacy-activity-metrics'
import { addQuizActivityMetrics } from './add-quiz-activity-metrics'
import { buildLatestActivityEvaluationBySubmission } from './build-latest-activity-evaluation-by-submission'
import { createActivityMetricsAccumulator } from './create-activity-metrics-accumulator'
import type { ActivityCompletionRecord } from './activity-completion-record'
import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { BuildContext } from './build-context'
import type { QuizSubmissionRecord } from './quiz-submission-record'

export function buildActivities(
  context: BuildContext,
  activities: ActivityCompletionRecord[],
  submissions: ActivitySubmissionRecord[],
  evaluations: ActivityEvaluationRecord[],
  quizzes: QuizSubmissionRecord[],
): ReportsAnalyticsActivities {
  const metrics = createActivityMetricsAccumulator()
  const latestEvaluationBySubmission = buildLatestActivityEvaluationBySubmission(evaluations)

  activities.forEach((activity) => {
    addLegacyActivityMetrics(metrics, context, activity)
  })

  submissions.forEach((submission) => {
    const latestEvaluation = latestEvaluationBySubmission.get(submission.submission_id) || null
    addActivitySubmissionMetrics(metrics, context, submission, latestEvaluation)
  })

  quizzes.forEach((quiz) => {
    addQuizActivityMetrics(metrics, context, quiz)
  })

  return {
    totalActivities: metrics.totalActivities,
    completedActivities: metrics.completedActivities,
    completionRate: calculatePercentage(metrics.completedActivities, metrics.totalActivities),
    averageAttempts: calculateAverage(metrics.totalActivities > 0 ? [metrics.totalAttempts / metrics.totalActivities] : []),
    averageTimeMinutes: calculateAverage(metrics.timedActivities > 0 ? [metrics.totalSeconds / metrics.timedActivities / 60] : []),
    usersNeedingHelp: metrics.usersNeedingHelp.size,
    redirects: metrics.redirects,
    totalEvaluations: metrics.quizAttempts,
    completedEvaluations: metrics.quizPassed,
    evaluationCompletionRate: calculatePercentage(metrics.quizPassed, metrics.quizAttempts),
    quizAttempts: metrics.quizAttempts,
    quizPassRate: calculatePercentage(metrics.quizPassed, metrics.quizAttempts),
    quizAverageScore: calculateAverage(metrics.quizScores),
    byType: buildBreakdown(metrics.typeCounts, metrics.totalActivities),
  }
}
