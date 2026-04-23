import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { TranslationContext } from '../../../../../_services/lesson-language-resolution.service'

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>

export interface ModuleRow {
  module_id: string
  module_title: string
  module_description?: string | null
  module_order_index: number
  module_duration_minutes?: number | null
  is_published: boolean | null
}

export interface LessonRow {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  duration_seconds: number | null
  video_provider_id: string | null
  video_provider: string | null
  is_published: boolean | null
  module_id: string
  transcript_content: string | null
  summary_content: string | null
}

export interface ProgressRow {
  lesson_id: string
  is_completed: boolean | null
  lesson_status: string | null
  video_progress_percentage: number | null
  last_accessed_at: string | null
  started_at: string | null
}

export interface ModulesWithProgressResult {
  modules: Array<{
    module_id: string
    module_title: string
    module_description?: string | null
    module_order_index: number
    lessons: Array<{
      lesson_id: string
      lesson_title: string
      lesson_description: string | null
      lesson_order_index: number
      duration_seconds: number | null
      video_provider_id: string | null
      video_provider: string | null
      is_completed: boolean
      progress_percentage: number
      transcript_content: string | null
      summary_content: string | null
    }>
  }>
  progress: number
  lastWatchedLessonId: string | null
  translationContext: TranslationContext
  enrollmentId: string | null
  organizationId: string | null
}
