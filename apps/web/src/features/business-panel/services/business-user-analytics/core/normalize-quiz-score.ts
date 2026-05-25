import { clampPercentage } from '../../reports-analytics/reports-analytics.helpers'
import { QuizSubmissionRecord } from './quiz-submission-record'

export function normalizeQuizScore(quiz: QuizSubmissionRecord): number {
  if (Number.isFinite(Number(quiz.percentage_score))) {
    return clampPercentage(Number(quiz.percentage_score))
  }

  if (Number.isFinite(Number(quiz.score)) && Number.isFinite(Number(quiz.total_points)) && Number(quiz.total_points) > 0) {
    return clampPercentage((Number(quiz.score) / Number(quiz.total_points)) * 100)
  }

  return 0
}
