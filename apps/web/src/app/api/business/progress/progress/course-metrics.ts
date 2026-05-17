import type { AssignmentRow, CourseInfo, EnrollmentRow, LessonProgressRow } from './types'

export interface CourseProgressMetric {
  course_id: string
  course_title: string
  thumbnail_url: string | null
  total_assigned: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
  total_time_minutes: number
  total_time_hours: number
}

export function buildCourseMetrics(input: {
  assignments: AssignmentRow[]
  enrollments: EnrollmentRow[]
  lessonProgress: LessonProgressRow[]
  courseInfoMap: Map<string, CourseInfo>
}): CourseProgressMetric[] {
  const courseMap = new Map<string, CourseProgressMetric>()
  for (const assignment of input.assignments) applyAssignment(courseMap, assignment, input.courseInfoMap)
  applyEnrollmentProgress(courseMap, input.enrollments)
  applyLessonTime(courseMap, input.enrollments, input.lessonProgress)
  return Array.from(courseMap.values())
}

function applyAssignment(
  courseMap: Map<string, CourseProgressMetric>,
  assignment: AssignmentRow,
  courseInfoMap: Map<string, CourseInfo>,
): void {
  const courseInfo = courseInfoMap.get(assignment.course_id)
  if (!courseMap.has(assignment.course_id)) {
    courseMap.set(assignment.course_id, {
      course_id: assignment.course_id,
      course_title: courseInfo?.title || 'Curso desconocido',
      thumbnail_url: courseInfo?.thumbnail_url || null,
      total_assigned: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      average_progress: 0,
      total_time_minutes: 0,
      total_time_hours: 0,
    })
  }

  const course = courseMap.get(assignment.course_id)!
  course.total_assigned += 1
  if (assignment.status === 'completed') course.completed += 1
  else if (assignment.status === 'in_progress') course.in_progress += 1
  else if (assignment.status === 'assigned') course.not_started += 1
}

function applyEnrollmentProgress(courseMap: Map<string, CourseProgressMetric>, enrollments: EnrollmentRow[]): void {
  for (const course of courseMap.values()) {
    const courseEnrollments = enrollments.filter((enrollment) => enrollment.course_id === course.course_id)
    const progressSum = courseEnrollments.reduce((sum, item) => sum + (Number(item.overall_progress_percentage) || 0), 0)
    course.average_progress = courseEnrollments.length > 0 ? Math.round((progressSum / courseEnrollments.length) * 10) / 10 : 0
  }
}

function applyLessonTime(
  courseMap: Map<string, CourseProgressMetric>,
  enrollments: EnrollmentRow[],
  lessonProgress: LessonProgressRow[],
): void {
  const enrollmentToCourseMap = new Map(enrollments.map((enrollment) => [enrollment.enrollment_id, enrollment.course_id]))
  for (const progress of lessonProgress) {
    const courseId = progress.enrollment_id
      ? enrollmentToCourseMap.get(progress.enrollment_id)
      : progress.user_course_enrollments?.course_id
    const course = courseId ? courseMap.get(courseId) : undefined
    if (!course) continue
    course.total_time_minutes += progress.time_spent_minutes || 0
    course.total_time_hours = Math.round((course.total_time_minutes / 60) * 10) / 10
  }
}
