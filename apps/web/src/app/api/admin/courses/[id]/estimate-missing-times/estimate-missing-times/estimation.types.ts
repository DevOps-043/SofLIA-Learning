import type { createClient } from '@/lib/supabase/server'

export type EstimateSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface EstimateRouteContext {
  params: Promise<{ id: string }>
}

export interface CourseInfo {
  id: string
  title: string
}

export interface CourseModuleInfo {
  module_id: string
  module_title: string | null
}

export interface CourseLessonInfo {
  lesson_id: string
  lesson_title: string | null
  module_id: string | null
}

export interface LessonMaterialInfo {
  material_id: string
  lesson_id: string
  material_title: string
  material_description: string | null
  material_type: string
  content_data: unknown
  external_url: string | null
  file_url: string | null
  estimated_time_minutes: number | null
}

export interface LessonActivityInfo {
  activity_id: string
  lesson_id: string
  activity_title: string
  activity_description: string | null
  activity_type: string
  activity_content: string
  activity_config: unknown
  ai_prompts: string | null
  requires_soflia_validation: boolean
  estimated_time_minutes: number | null
}

export interface CourseStructure {
  course: CourseInfo
  modules: CourseModuleInfo[]
  lessons: CourseLessonInfo[]
  moduleIds: string[]
  lessonIds: string[]
}

export interface PendingTimeItems {
  materials: LessonMaterialInfo[]
  activities: LessonActivityInfo[]
}
