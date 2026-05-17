import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsQuizSubmissionRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

type QuizStats = {
  attempts: number
  failed: number
  passed: number
  scores: number[]
  total: number
}

function createEmptyQuizStats(): QuizStats {
  return {
    attempts: 0,
    failed: 0,
    passed: 0,
    scores: [],
    total: 0,
  }
}

export function applyQuizStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  submissions: BusinessUserStatsQuizSubmissionRecord[],
) {
  const quizStatsByCourse = new Map<string, QuizStats>()

  submissions.forEach((submission) => {
    const courseId = unwrapRelation(submission.user_course_enrollments)?.course_id
    if (!courseId || !courseStatsMap.has(courseId)) return

    const stats = quizStatsByCourse.get(courseId) || createEmptyQuizStats()
    stats.total += 1
    stats.attempts += 1
    if (submission.is_passed) {
      stats.passed += 1
    } else {
      stats.failed += 1
    }

    if (submission.percentage_score !== null && submission.percentage_score !== undefined) {
      stats.scores.push(Number(submission.percentage_score))
    }

    quizStatsByCourse.set(courseId, stats)
  })

  quizStatsByCourse.forEach((quizStats, courseId) => {
    const courseStats = courseStatsMap.get(courseId)
    if (!courseStats) return

    courseStats.quiz_total = quizStats.total
    courseStats.quiz_passed = quizStats.passed
    courseStats.quiz_failed = quizStats.failed
    courseStats.quiz_total_attempts = quizStats.attempts

    if (quizStats.scores.length > 0) {
      const scoreAverage =
        quizStats.scores.reduce((sum, value) => sum + value, 0) / quizStats.scores.length
      courseStats.quiz_average_score = Math.round(scoreAverage * 10) / 10
      courseStats.quiz_best_score = Math.max(...quizStats.scores)
    }
  })
}
