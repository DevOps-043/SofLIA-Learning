import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { buildBreakdown, calculateAverage, calculatePercentage, incrementMap } from '../../reports-analytics/reports-analytics.helpers'
import { ActivityEvaluationRecord } from './activity-evaluation-record'
import { buildActivityProgressFallback } from './build-activity-progress-fallback'
import { buildTrend } from './build-trend'
import { extractSubmissionText } from './extract-submission-text'
import { isActivityCompletionSatisfied } from './is-activity-completion-satisfied'
import { QueryData } from './query-data'
import { scoreEvaluationStatus } from './score-evaluation-status'

export function buildActivities(
  data: QueryData,
  period: BusinessUserAnalyticsPeriod,
  evaluationsBySubmission: Map<string, ActivityEvaluationRecord>,
  completedCourseIds: Set<string>,
) {
  const completedActivityIdsFromSubmissions = new Set(
    data.activitySubmissions
      .filter((submission) => submission.status !== 'draft')
      .map((submission) => submission.activity_id),
  )
  const submittedActivities = data.activitySubmissions.filter((submission) => submission.status !== 'draft')
  const completedSofliaActivities = data.activityCompletions.filter((completion) =>
    isActivityCompletionSatisfied(completion) && !completedActivityIdsFromSubmissions.has(completion.activity_id),
  )
  const activityProgressFallback = buildActivityProgressFallback(
    data.lessonProgress,
    data.lessonActivities,
    data.courseLessons,
    completedCourseIds,
    submittedActivities.length === 0 && completedSofliaActivities.length === 0,
  )
  const validated = data.activitySubmissions.filter((submission) => submission.status === 'validated').length
  const needsRevision = data.activitySubmissions.filter((submission) => submission.status === 'needs_revision').length
  const submitted = data.activitySubmissions.filter((submission) => submission.status !== 'draft').length
  const evaluationScores = submittedActivities.map((submission) => {
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    if (evaluation) return scoreEvaluationStatus(evaluation.result_status)
    if (submission.status === 'validated') return 100
    if (submission.status === 'needs_revision') return 55
    return 100
  })
  const statusCounts = new Map<string, number>()
  data.activitySubmissions.forEach((submission) => incrementMap(statusCounts, submission.status || 'draft'))
  completedSofliaActivities.forEach((completion) => incrementMap(statusCounts, completion.status || 'completed'))
  if (activityProgressFallback.completed > 0) {
    incrementMap(statusCounts, 'completed', activityProgressFallback.completed)
  }
  if (activityProgressFallback.total > activityProgressFallback.completed) {
    incrementMap(statusCounts, 'in_progress', activityProgressFallback.total - activityProgressFallback.completed)
  }
  const directPasses = submittedActivities.filter((submission) => {
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    if (evaluation) return evaluation.result_status === 'pass'
    return submission.status === 'validated' || submission.status === 'completed'
  }).length
  const totalEvaluatedOrCompleted =
    submittedActivities.length +
    completedSofliaActivities.length +
    activityProgressFallback.total
  const qualityScores = [
    ...evaluationScores,
    ...completedSofliaActivities.map(() => 100),
    ...activityProgressFallback.scores,
  ]
  const totalActivitySignals =
    data.activitySubmissions.length +
    completedSofliaActivities.length +
    activityProgressFallback.total
  const completedActivitySignals =
    submitted +
    completedSofliaActivities.length +
    activityProgressFallback.completed

  return {
    totalSubmissions: completedActivitySignals,
    submitted: completedActivitySignals,
    validated: validated + completedSofliaActivities.length + activityProgressFallback.completed,
    needsRevision,
    passRate: calculatePercentage(
      directPasses + completedSofliaActivities.length + activityProgressFallback.completed,
      totalEvaluatedOrCompleted,
    ),
    averageQualityScore: calculateAverage(qualityScores),
    averageResponseLength: calculateAverage(data.activitySubmissions.map((submission) => extractSubmissionText(submission).length)),
    withSofliaFeedback: evaluationsBySubmission.size + completedSofliaActivities.length,
    statusBreakdown: buildBreakdown(statusCounts, totalActivitySignals || completedActivitySignals),
    submissionsTrend: buildTrend([
      ...data.activitySubmissions.map((submission) => submission.submitted_at || submission.updated_at),
      ...completedSofliaActivities.map((completion) => completion.completed_at || completion.updated_at || completion.started_at),
      ...activityProgressFallback.dates,
    ].filter((value): value is string => Boolean(value)), period),
  }
}
