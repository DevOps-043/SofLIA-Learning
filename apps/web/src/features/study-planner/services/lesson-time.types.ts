import type { createClient } from '@/lib/supabase/server'

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface CourseModuleRow {
  module_id: string | null
  module_title: string | null
}

export type CourseModuleRelation = CourseModuleRow | CourseModuleRow[] | null

export interface CourseLessonRow {
  lesson_id: string
  lesson_title: string | null
  duration_seconds: number | null
  module_id: string | null
  course_modules: CourseModuleRelation
}

export interface EstimatedTimeRow {
  estimated_time_minutes: number | null
}

export interface LessonEstimatedTimeRelation extends EstimatedTimeRow {
  lesson_id: string
}

export interface LessonTimeEstimate {
  lessonId: string
  lessonTitle: string
  moduleId: string | null
  moduleName: string | null
  videoMinutes: number
  activitiesMinutes: number
  materialsMinutes: number
  interactionsMinutes: number
  totalMinutes: number
}

export interface CourseTimeEstimate {
  courseId: string
  courseTitle: string
  lessons: LessonTimeEstimate[]
  totalMinutes: number
  averageLessonMinutes: number
  minLessonMinutes: number
  maxLessonMinutes: number
  lessonCount: number
}

export interface CoursesTimeAnalysis {
  courses: CourseTimeEstimate[]
  totalMinutes: number
  totalLessons: number
  globalMinLessonMinutes: number
  globalMaxLessonMinutes: number
  globalAverageLessonMinutes: number
  recommendedMinSessionMinutes: number
}
