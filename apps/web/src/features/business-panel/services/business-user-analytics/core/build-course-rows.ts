import type { BusinessUserAnalyticsCourseProgressRow } from '../../../types/business-user-analytics.types'
import { clampPercentage } from '../../reports-analytics/reports-analytics.helpers'
import { buildCourseLessonCountByCourse } from './build-course-lesson-count-by-course'
import { calculateStudyMinutes } from './calculate-study-minutes'
import { getLatestDate } from './get-latest-date'
import { groupCourseLessonsByCourse } from './group-course-lessons-by-course'
import { groupLessonProgressByCourse } from './group-lesson-progress-by-course'
import { groupLessonTrackingByCourse } from './group-lesson-tracking-by-course'
import { QueryData } from './query-data'
import { resolveCourseStatus } from './resolve-course-status'
import { resolveCourseTitle } from './resolve-course-title'

export function buildCourseRows(
  data: QueryData,
  courseTitleById: Map<string, string>,
): BusinessUserAnalyticsCourseProgressRow[] {
  const enrollmentCourseById = new Map(data.enrollments.map((enrollment) => [
    enrollment.enrollment_id,
    enrollment.course_id,
  ]))
  const certificateCourseIds = new Set(data.certificates.map((certificate) => certificate.course_id))
  const lessonProgressByCourse = groupLessonProgressByCourse(data.lessonProgress, enrollmentCourseById)
  const lessonTrackingByCourse = groupLessonTrackingByCourse(data.lessonTracking, data.courseLessons)
  const courseLessonsByCourse = groupCourseLessonsByCourse(data.courseLessons)
  const lessonCountByCourse = buildCourseLessonCountByCourse(data.courseLessons)

  return data.assignments.map((assignment) => {
    const enrollment = data.enrollments.find((item) => item.course_id === assignment.course_id)
    const progress = clampPercentage(
      Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0),
    )
    const lessonProgress = lessonProgressByCourse.get(assignment.course_id) || []
    const lessonTracking = lessonTrackingByCourse.get(assignment.course_id) || []
    const courseLessons = courseLessonsByCourse.get(assignment.course_id) || []
    const status = resolveCourseStatus(assignment.status, enrollment?.enrollment_status, progress)
    const completedFromProgress = lessonProgress.filter((item) =>
      item.is_completed || item.lesson_status === 'completed',
    ).length
    const publishedLessons = lessonCountByCourse.get(assignment.course_id) || completedFromProgress

    return {
      courseId: assignment.course_id,
      courseTitle: resolveCourseTitle(courseTitleById, assignment.course_id),
      progress,
      status,
      assignedAt: assignment.assigned_at,
      dueDate: assignment.due_date,
      completedAt: enrollment?.completed_at || assignment.completed_at,
      lastAccessedAt: getLatestDate([
        enrollment?.last_accessed_at,
        enrollment?.updated_at,
        ...lessonProgress.map((item) => item.last_accessed_at || item.updated_at),
        ...lessonTracking.map((item) => item.last_activity_at || item.completed_at || item.updated_at),
      ]),
      lessonsCompleted: status === 'completed' && publishedLessons > completedFromProgress
        ? publishedLessons
        : completedFromProgress,
      timeSpentMinutes: calculateStudyMinutes(
        lessonProgress,
        lessonTracking,
        courseLessons,
        data.lessonActivities,
        status === 'completed' || progress >= 100,
      ),
      hasCertificate: certificateCourseIds.has(assignment.course_id),
    }
  })
}
