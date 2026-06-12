import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { calculateAverage, calculatePercentage, clampPercentage } from '../../reports-analytics/reports-analytics.helpers'
import { buildTrendWithValues } from './build-trend-with-values'
import { normalizeQuizScore } from './normalize-quiz-score'
import { QueryData } from './query-data'

/**
 * Métricas de quizzes con fuente AUTORITATIVA y sin números engañosos:
 * - Conteos y promedio salen de `user_lesson_progress` (estado de quiz por lección:
 *   `quiz_completed` / `quiz_passed` / `quiz_progress_percentage`), que es la señal
 *   real de "presentó/aprobó el quiz de esta lección".
 * - Los intentos reales (totales, reintentos, primer intento) salen de
 *   `user_quiz_attempts` (append-only).
 * - `lessonsWithQuiz` es el denominador de contexto: NO toda lección tiene quiz.
 *
 * Antes, "Intentos" contaba filas de `user_quiz_submissions` (1 por quiz, los
 * reintentos se sobrescriben), lo que mezclaba "quizzes presentados" con "intentos".
 */
export function buildQuizzes(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const quizProgress = data.lessonProgress.filter((progress) => progress.quiz_completed === true)
  const quizzesTaken = quizProgress.length
  const quizzesPassed = data.lessonProgress.filter((progress) => progress.quiz_passed === true).length

  const completedScores = quizProgress
    .map((progress) => clampPercentage(Number(progress.quiz_progress_percentage)))
    .filter((value) => Number.isFinite(value))

  const latestProgress = [...quizProgress].sort(
    (a, b) =>
      new Date(b.completed_at || b.updated_at || 0).getTime() -
      new Date(a.completed_at || a.updated_at || 0).getTime(),
  )[0]

  // Intentos reales (append-only). attempt_number > 1 = reintento.
  const totalAttempts = data.quizAttempts.length
  const retries = data.quizAttempts.filter((attempt) => Number(attempt.attempt_number) > 1).length
  const firstAttempts = data.quizAttempts.filter((attempt) => Number(attempt.attempt_number) === 1)
  const firstAttemptsPassed = firstAttempts.filter((attempt) => attempt.is_passed === true).length

  return {
    lessonsWithQuiz: data.quizLessonIds.length,
    quizzesTaken,
    quizzesPassed,
    passRate: calculatePercentage(quizzesPassed, quizzesTaken),
    totalAttempts,
    retries,
    firstTryPassRate: calculatePercentage(firstAttemptsPassed, firstAttempts.length),
    scoredCount: data.quizSubmissions.length,
    averageScore: calculateAverage(completedScores),
    bestScore: completedScores.length > 0 ? Math.max(...completedScores) : 0,
    latestScore: latestProgress ? clampPercentage(Number(latestProgress.quiz_progress_percentage)) : 0,
    trend: buildTrendWithValues(data.quizSubmissions, period, normalizeQuizScore),
  }
}
