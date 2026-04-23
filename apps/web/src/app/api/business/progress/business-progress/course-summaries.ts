import { logger } from '@/lib/utils/logger'
import type {
  CourseInfo,
  CourseProgressSummary,
  DashboardQueriesResult,
} from './types'

export function buildCourseSummaries(
  data: DashboardQueriesResult,
  courseInfoMap: Map<string, CourseInfo>,
) {
  const courseMap = createCourseMap(data.assignments, courseInfoMap)
  applyCourseProgress(courseMap, data)
  applyCourseTime(courseMap, data)

  logger.log('📊 Cursos procesados en courseMap:', courseMap.size)
  return Array.from(courseMap.values())
}

function createCourseMap(assignments: DashboardQueriesResult['assignments'], courseInfoMap: Map<string, CourseInfo>) {
  const courseMap = new Map<string, CourseProgressSummary>()

  assignments.forEach((assignment) => {
    const courseId = assignment.course_id
    const courseInfo = courseInfoMap.get(courseId)
    if (!courseInfo) logger.warn('⚠️ Curso no encontrado en courseInfoMap:', courseId)

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, createCourseSummary(courseId, courseInfo))
    }

    const course = courseMap.get(courseId)!
    course.total_assigned += 1
    if (assignment.status === 'completed') course.completed += 1
    else if (assignment.status === 'in_progress') course.in_progress += 1
    else if (assignment.status === 'assigned') course.not_started += 1
  })

  return courseMap
}

function createCourseSummary(courseId: string, courseInfo?: CourseInfo) {
  return {
    course_id: courseId,
    course_title: courseInfo?.title || 'Curso desconocido',
    thumbnail_url: courseInfo?.thumbnail_url || null,
    total_assigned: 0,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    average_progress: 0,
    total_time_minutes: 0,
    total_time_hours: 0,
  }
}

function applyCourseProgress(courseMap: Map<string, CourseProgressSummary>, data: DashboardQueriesResult) {
  const progressByCourse = new Map<string, { count: number; total: number }>()

  data.enrollments.forEach((enrollment) => {
    const current = progressByCourse.get(enrollment.course_id) || { count: 0, total: 0 }
    current.count += 1
    current.total += Number(enrollment.overall_progress_percentage) || 0
    progressByCourse.set(enrollment.course_id, current)
  })

  progressByCourse.forEach((progress, courseId) => {
    const course = courseMap.get(courseId)
    if (course) course.average_progress = Math.round((progress.total / progress.count) * 10) / 10
  })
}

function applyCourseTime(courseMap: Map<string, CourseProgressSummary>, data: DashboardQueriesResult) {
  const enrollmentToCourse = new Map(data.enrollments.map((item) => [item.enrollment_id, item.course_id]))

  data.lessonProgress.forEach((progress) => {
    const courseId = progress.enrollment_id
      ? enrollmentToCourse.get(progress.enrollment_id)
      : progress.user_course_enrollments?.course_id
    const course = courseId ? courseMap.get(courseId) : undefined
    if (!course) return

    course.total_time_minutes += progress.time_spent_minutes || 0
    course.total_time_hours = Math.round((course.total_time_minutes / 60) * 10) / 10
  })
}
