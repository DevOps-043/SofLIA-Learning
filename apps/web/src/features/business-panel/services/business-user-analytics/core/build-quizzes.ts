import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { calculateAverage, calculatePercentage } from '../../reports-analytics/reports-analytics.helpers'
import { buildTrendWithValues } from './build-trend-with-values'
import { normalizeQuizScore } from './normalize-quiz-score'
import { QueryData } from './query-data'

export function buildQuizzes(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const sortedSubmissions = [...data.quizSubmissions].sort((a, b) =>
    new Date(a.completed_at || a.created_at || 0).getTime() - new Date(b.completed_at || b.created_at || 0).getTime(),
  )
  const scores = sortedSubmissions.map((quiz) => normalizeQuizScore(quiz)).filter((value) => Number.isFinite(value))

  return {
    attempts: sortedSubmissions.length,
    passed: sortedSubmissions.filter((quiz) => quiz.is_passed).length,
    passRate: calculatePercentage(sortedSubmissions.filter((quiz) => quiz.is_passed).length, sortedSubmissions.length),
    averageScore: calculateAverage(scores),
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    latestScore: scores.length > 0 ? scores[scores.length - 1] : 0,
    trend: buildTrendWithValues(sortedSubmissions, period, normalizeQuizScore),
  }
}
