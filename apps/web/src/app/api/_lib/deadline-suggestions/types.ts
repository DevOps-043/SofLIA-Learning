export interface CourseCategoryItem {
  name: string
}

export interface LessonTimeEstimate {
  total_time_minutes?: number | null
  video_minutes?: number | null
  reading_time_minutes?: number | null
  activities_time_minutes?: number | null
  quiz_time_minutes?: number | null
  exercise_time_minutes?: number | null
}

export interface LessonDurationItem {
  estimated_time_minutes?: number | null
}

export interface DeadlineCourseLessonRow {
  lesson_title: string | null
  duration_seconds: number | null
  lesson_time_estimates: LessonTimeEstimate[] | LessonTimeEstimate | null
  lesson_activities: LessonDurationItem[] | null
  lesson_materials: LessonDurationItem[] | null
}

export interface DeadlineCourseModuleRow {
  module_title: string | null
  module_description: string | null
  course_lessons: DeadlineCourseLessonRow[] | null
}

export interface DeadlineCourseRow {
  id: string
  title: string
  description: string | null
  level: string | null
  duration_total_minutes: number | null
  category: CourseCategoryItem[] | CourseCategoryItem | null
  course_modules: DeadlineCourseModuleRow[] | null
}

export type DeadlineApproach = 'fast' | 'balanced' | 'long'

export type DeadlineDays = Record<DeadlineApproach, number>

export type AiDeadlineReasoning = Record<DeadlineApproach | 'summary', string>

export interface AggregatedCourseDeadlineContext {
  dbTotalMinutes: number
  finalTotalHours: number
  finalTotalMinutes: number
  syllabusContext: string
  totalActivityMinutes: number
  totalReadingMinutes: number
  totalVideoMinutes: number
}
