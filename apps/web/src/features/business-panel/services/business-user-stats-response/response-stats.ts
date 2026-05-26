import type { CourseWithLessons, BusinessUserStatsCertificate, BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsQueryData } from '../business-user-stats-query.service'
import { isCompletedCourseStats, isInProgressCourseStats } from './course-status'
import { buildCompletedByMonth, buildTimeByCourse } from './course-series'

type ResponseStatsInput = {
  certificates: BusinessUserStatsCertificate[]
  coursesData: BusinessUserStatsCourseData[]
  coursesWithLessons: CourseWithLessons[]
  data: BusinessUserStatsQueryData
  realLessonsByCourse: Map<string, number>
}

export function buildResponseStats({ certificates, coursesData, coursesWithLessons, data, realLessonsByCourse }: ResponseStatsInput) {
  const totalCourses = coursesData.length
  const completedCourses = coursesData.filter(isCompletedCourseStats).length
  const inProgressCourses = coursesData.filter(isInProgressCourseStats).length
  const notStartedCourses = Math.max(totalCourses - completedCourses - inProgressCourses, 0)
  const totalTimeSpent = data.lessonProgress.reduce((sum, progress) => sum + (progress.time_spent_minutes || 0), 0)
  const averageProgress = totalCourses > 0 ? coursesData.reduce((sum, course) => sum + (Number(course.progress) || 0), 0) / totalCourses : 0

  return {
    total_courses: totalCourses, completed_courses: completedCourses, in_progress_courses: inProgressCourses,
    not_started_courses: notStartedCourses, average_progress: Math.round(averageProgress * 10) / 10,
    total_time_spent_minutes: totalTimeSpent, total_time_spent_hours: Math.round((totalTimeSpent / 60) * 10) / 10,
    completed_lessons: data.lessonProgress.filter((progress) => progress.is_completed).length,
    total_lessons: Array.from(realLessonsByCourse.values()).reduce((sum, count) => sum + count, 0),
    certificates_count: certificates.length, notes_count: data.lessonNotes.length, total_assignments: data.assignments.length,
    completed_assignments: data.assignments.filter((assignment) => assignment.status === 'completed').length,
    lia_conversations_total: data.liaConversations.length, lia_messages_total: data.liaMessages.length,
    quiz_total: data.quizSubmissions.length, quiz_passed: data.quizSubmissions.filter((submission) => submission.is_passed).length,
    quiz_failed: data.quizSubmissions.filter((submission) => !submission.is_passed).length, quiz_average_score: buildQuizAverageScore(data),
    lia_activities_completed: coursesData.reduce((sum, course) => sum + (course.activities_completed || 0), 0),
    lia_activities_total: coursesData.reduce((sum, course) => sum + (course.activities_total || 0), 0),
    courses_data: coursesData, courses_with_lessons: coursesWithLessons,
    time_by_course: buildTimeByCourse(coursesData), completed_by_month: buildCompletedByMonth(data.enrollments, data.assignments),
    distribution: { completed: completedCourses, in_progress: inProgressCourses, not_started: notStartedCourses },
  }
}

function buildQuizAverageScore(data: BusinessUserStatsQueryData) {
  if (data.quizSubmissions.length === 0) return 0
  const totalScore = data.quizSubmissions.reduce((sum, submission) => sum + (Number(submission.percentage_score) || 0), 0)
  return Math.round((totalScore / data.quizSubmissions.length) * 10) / 10
}
