import type { SupportedLanguage } from '@/core/i18n/i18n'
import type { createClient } from '@/lib/supabase/server'

export type TranslationSupabaseClient = Awaited<ReturnType<typeof createClient>>
export type EntityType = 'lesson' | 'activity' | 'material'
export type EntityStatus = 'translated' | 'pending' | 'failed'

export interface TranslationOptions {
  lessonIds?: string[]
  courseId?: string
  includeActivities: boolean
  includeMaterials: boolean
}

export interface EntityProgress {
  entityType: EntityType
  entityId: string
  title: string
  courseId: string
  status: EntityStatus
  missingLanguages: SupportedLanguage[]
  translatedLanguages: SupportedLanguage[]
  error?: string
}

export interface CourseReport {
  courseId: string
  totalEntities: number
  translated: number
  pending: number
  failed: number
}

export type SummaryReport = Omit<CourseReport, 'courseId'>

export interface LessonRow {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  transcript_content: string | null
  summary_content: string | null
  course_modules: { course_id: string }
}

export interface ActivityRow {
  activity_id: string
  activity_title: string
  activity_description: string | null
  activity_content: string
  ai_prompts: string | null
}

export interface MaterialRow {
  material_id: string
  material_title: string
  material_description: string | null
  content_data: unknown
}
