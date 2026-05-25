import type { CourseWithContent, UserCourse, UserLessonProgressItem } from './context.types'
import type {
  AssignedCourseRow,
  LessonProgressRow,
  UserEnrollmentRow,
  UserProfileNameRow,
} from './row.types'

export function normalizeNullableValue<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

export function buildUserDisplayName(userData: UserProfileNameRow): string | undefined {
  const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim()
  return fullName || userData.display_name || userData.username || undefined
}

export function mapUserCourse(ue: UserEnrollmentRow): UserCourse {
  return {
    title: normalizeNullableValue(ue.course?.title),
    slug: normalizeNullableValue(ue.course?.slug),
    progress: ue.overall_progress_percentage,
    status: ue.enrollment_status,
  }
}

export function mapLessonProgress(lp: LessonProgressRow): UserLessonProgressItem {
  return {
    lessonTitle: normalizeNullableValue(lp.lesson?.lesson_title),
    lessonDescription: normalizeNullableValue(lp.lesson?.lesson_description),
    lessonOrder: normalizeNullableValue(lp.lesson?.lesson_order_index),
    moduleName: normalizeNullableValue(lp.lesson?.module?.module_title),
    moduleOrder: normalizeNullableValue(lp.lesson?.module?.module_order_index),
    courseName: normalizeNullableValue(lp.lesson?.module?.course?.title),
    courseSlug: normalizeNullableValue(lp.lesson?.module?.course?.slug),
    status: lp.lesson_status,
    isCompleted: lp.is_completed,
    videoProgress: lp.video_progress_percentage,
    timeSpentMinutes: lp.time_spent_minutes,
    durationMinutes: Math.round((lp.lesson?.duration_seconds || 0) / 60),
  }
}

export function mapAssignedCourse(assignment: AssignedCourseRow): CourseWithContent {
  return {
    title: normalizeNullableValue(assignment.course?.title),
    slug: normalizeNullableValue(assignment.course?.slug),
    description: normalizeNullableValue(assignment.course?.description),
    level: normalizeNullableValue(assignment.course?.level),
    durationMinutes: normalizeNullableValue(assignment.course?.duration_total_minutes),
    isAssigned: true,
  }
}
