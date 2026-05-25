import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsLessonProgressRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

type LessonStats = {
  completed: number
  inProgress: number
  quizCompleted: number
  total: number
}

function createEmptyLessonStats(): LessonStats {
  return { completed: 0, inProgress: 0, quizCompleted: 0, total: 0 }
}

export function applyLessonProgressStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  progressRecords: BusinessUserStatsLessonProgressRecord[],
  realLessonsByCourse: Map<string, number>,
) {
  const lessonStatsByCourse = new Map<string, LessonStats>()

  progressRecords.forEach((progress) => {
    const courseId = unwrapRelation(progress.user_course_enrollments)?.course_id
    if (!courseId || !courseStatsMap.has(courseId)) return

    const stats = courseStatsMap.get(courseId)
    const courseLessonStats = lessonStatsByCourse.get(courseId) || createEmptyLessonStats()
    if (!stats) return

    stats.time_spent_minutes = (stats.time_spent_minutes || 0) + (progress.time_spent_minutes || 0)
    courseLessonStats.total += 1

    if (progress.is_completed) courseLessonStats.completed += 1
    else if (progress.lesson_status === 'in_progress' || progress.started_at) {
      courseLessonStats.inProgress += 1
    }

    if (progress.quiz_completed && progress.quiz_passed) {
      courseLessonStats.quizCompleted += 1
    }

    lessonStatsByCourse.set(courseId, courseLessonStats)
  })

  lessonStatsByCourse.forEach((courseLessonStats, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats) return

    stats.lessons_total = realLessonsByCourse.get(courseId) || courseLessonStats.total
    stats.lessons_completed = courseLessonStats.completed
    stats.lessons_in_progress = courseLessonStats.inProgress
    stats.quiz_lessons_completed = courseLessonStats.quizCompleted
  })

  realLessonsByCourse.forEach((totalLessons, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (stats && !stats.lessons_total) {
      stats.lessons_total = totalLessons
    }
  })
}
