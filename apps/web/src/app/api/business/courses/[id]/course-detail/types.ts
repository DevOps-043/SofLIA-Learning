import type { createClient as createSupabaseClient } from '@/lib/supabase/server'

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>

export interface CourseRow {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor_id: string | null
  duration_total_minutes: number | null
  thumbnail_url: string | null
  slug: string | null
  is_active: boolean | null
  price: number | null
  average_rating: number | null
  student_count: number | null
  review_count: number | null
  learning_objectives: unknown[] | null
  created_at: string | null
  updated_at: string | null
}

export interface CourseModuleRow {
  module_id: string
  module_title: string | null
  module_description: string | null
  module_order_index: number | null
  module_duration_minutes: number | null
  is_required: boolean | null
  is_published: boolean | null
}

export interface CourseLessonRow {
  lesson_id: string
  lesson_title: string | null
  lesson_description: string | null
  lesson_order_index: number | null
  duration_seconds: number | null
  total_duration_minutes: number | null
  video_provider: string | null
  video_provider_id: string | null
  is_published: boolean | null
}

export interface EstimatedMinutesRow {
  estimated_time_minutes: number | null
}

export interface ModuleWithLessons extends CourseModuleRow {
  lessons: CourseLessonRow[]
  calculated_duration_minutes: number
}
