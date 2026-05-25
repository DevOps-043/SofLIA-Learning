import type { Database } from '@/core/supabase/database.types'

import type { CourseInstructor, CourseListItem, LessonProgress } from './courses.types'

type CourseRow = Database['public']['Tables']['courses']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
export type UserCourseEnrollmentRow =
  Database['public']['Tables']['user_course_enrollments']['Row']
type UserLessonProgressRow =
  Database['public']['Tables']['user_lesson_progress']['Row']

export type CourseSelectRow = Pick<
  CourseRow,
  | 'id'
  | 'title'
  | 'description'
  | 'category'
  | 'level'
  | 'instructor_id'
  | 'duration_total_minutes'
  | 'thumbnail_url'
  | 'slug'
  | 'is_active'
  | 'price'
  | 'average_rating'
  | 'student_count'
  | 'review_count'
  | 'created_at'
  | 'updated_at'
> & {
  instructor: Pick<
    UserRow,
    'id' | 'first_name' | 'last_name' | 'email' | 'username'
  > | null
}

export function mapInstructor(
  instructor: CourseSelectRow['instructor'],
): CourseInstructor | null {
  if (!instructor) return null

  return {
    id: instructor.id,
    first_name: instructor.first_name,
    last_name: instructor.last_name,
    email: instructor.email,
    username: instructor.username,
  }
}

export function mapCourse(row: CourseSelectRow): CourseListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    level: row.level,
    instructor_id: row.instructor_id,
    duration_total_minutes: row.duration_total_minutes,
    thumbnail_url: row.thumbnail_url,
    slug: row.slug,
    is_active: row.is_active ?? false,
    price: row.price,
    average_rating: row.average_rating,
    student_count: row.student_count,
    review_count: row.review_count,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    instructor: mapInstructor(row.instructor),
  }
}

export function mapLessonProgress(row: UserLessonProgressRow): LessonProgress {
  const progressPercent =
    row.video_progress_percentage ?? (row.is_completed ? 100 : 0)

  return {
    progress_id: row.progress_id,
    lesson_id: row.lesson_id,
    user_id: row.user_id,
    enrollment_id: row.enrollment_id,
    progress_percent: progressPercent,
    time_spent_seconds: (row.time_spent_minutes ?? 0) * 60,
    is_completed: row.is_completed ?? false,
    last_position: row.current_time_seconds ?? 0,
    completed_at: row.completed_at,
    updated_at: row.updated_at,
    last_accessed_at: row.last_accessed_at,
    lesson_status: row.lesson_status,
    video_progress_percentage: progressPercent,
    quiz_completed: row.quiz_completed ?? false,
    quiz_passed: row.quiz_passed ?? false,
  }
}

export function mapEnrollment(
  row: Pick<UserCourseEnrollmentRow, 'course_id' | 'started_at' | 'completed_at'>,
) {
  return {
    course_id: row.course_id,
    enrolled_at: row.started_at ?? row.completed_at ?? '',
  }
}
