import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsLessonProgressRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

type LessonStats = { total: number; completed: number; inProgress: number; quizCompleted: number }

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
    if (!stats) return
    stats.time_spent_minutes = (stats.time_spent_minutes || 0) + (progress.time_spent_minutes || 0)
    const courseLessonStats = lessonStatsByCourse.get(courseId) || createEmptyLessonStats()
    courseLessonStats.total += 1
    if (progress.is_completed) courseLessonStats.completed += 1
    else if (progress.lesson_status === 'in_progress' || progress.started_at) courseLessonStats.inProgress += 1
    if (progress.quiz_completed && progress.quiz_passed) courseLessonStats.quizCompleted += 1
    lessonStatsByCourse.set(courseId, courseLessonStats)
  })

  lessonStatsByCourse.forEach((lessonStats, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats) return
    stats.lessons_total = realLessonsByCourse.get(courseId) || lessonStats.total
    stats.lessons_completed = lessonStats.completed
    stats.lessons_in_progress = lessonStats.inProgress
    stats.quiz_lessons_completed = lessonStats.quizCompleted
  })

  realLessonsByCourse.forEach((totalLessons, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (stats && !stats.lessons_total) stats.lessons_total = totalLessons
  })
}

function createEmptyLessonStats(): LessonStats {
  return { total: 0, completed: 0, inProgress: 0, quizCompleted: 0 }
}
