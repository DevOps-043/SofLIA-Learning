import type {
  CourseLessonRow,
  CourseModuleRow,
  CourseSkillRow,
  EnrollmentRow,
} from './full.types'

export interface LessonWithProgress {
  lesson_id: string
  lesson_title: string
  lesson_description?: string | null
  lesson_order_index: number
  duration_seconds?: number | null
  total_duration_minutes: number
  video_provider_id?: string | null
  video_provider?: string | null
  is_completed: boolean
  progress_percentage: number
}

export interface ModuleWithLessons extends CourseModuleRow {
  lessons: LessonWithProgress[]
}

export interface CourseFullQueryResults {
  modules: CourseModuleRow[]
  skills: CourseSkillRow[]
  purchaseCheck: boolean
  enrollment: EnrollmentRow | null
  instructor: unknown
}

export interface LessonQueryData {
  lessons: CourseLessonRow[]
  progress: Map<string, { is_completed?: boolean | null; video_progress_percentage?: number | null }>
}
