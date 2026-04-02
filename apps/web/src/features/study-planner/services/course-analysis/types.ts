import type { CourseRow, PersonNameRow } from '../course-query.shared'

export interface CourseInfoRow extends CourseRow {
  instructor?: PersonNameRow | null
}

export interface CourseModuleRow {
  course_id: string
  module_id: string
  module_title: string
  module_description?: string | null
  module_order_index: number
  module_duration_minutes?: number | null
  is_required?: boolean | null
  is_published: boolean
  course_lessons?: CourseLessonRow[] | null
}

export interface CourseLessonRow {
  lesson_id: string
  lesson_title: string
  lesson_description?: string | null
  lesson_order_index: number
  duration_seconds?: number | null
  is_published: boolean
}

export interface LessonRow {
  lesson_id: string
  lesson_title: string
  duration_seconds?: number | null
}

export interface LessonEstimateRow {
  lesson_id: string
  video_minutes?: number | null
  activities_time_minutes?: number | null
  reading_time_minutes?: number | null
  quiz_time_minutes?: number | null
  exercise_time_minutes?: number | null
  link_time_minutes?: number | null
  interactions_time_minutes?: number | null
  total_time_minutes?: number | null
}

export interface LessonActivityRow {
  lesson_id: string
  estimated_time_minutes?: number | null
}

export interface LessonMaterialRow {
  lesson_id: string
  estimated_time_minutes?: number | null
  material_type?: string | null
}

export interface UserCourseProgressRow {
  progress_percentage?: number | null
  completed_lessons_count?: number | null
  last_accessed_at?: string | null
}

export interface UserCourseProgressSummaryRow extends UserCourseProgressRow {
  course_id: string
}

export interface CourseLessonCountRow {
  course_id: string
  course_lessons?: CourseLessonCountLessonRow[] | null
}

export interface CourseLessonCountLessonRow {
  lesson_id: string
  is_published?: boolean | null
}

export interface UserStudyStreakRow {
  total_study_minutes?: number | null
  total_sessions_completed?: number | null
  current_streak?: number | null
  longest_streak?: number | null
}
