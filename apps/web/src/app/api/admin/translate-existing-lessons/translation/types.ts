import type { SupportedLanguage } from '@/core/i18n/i18n'
import type { createClient } from '@/lib/supabase/server'

export const ALL_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'pt']

export type TranslationSupabaseClient = Awaited<ReturnType<typeof createClient>>
export type EntityType = 'lesson' | 'activity' | 'material'
export type EntityStatus = 'translated' | 'pending' | 'failed'

export interface TranslationRequestOptions {
  courseId?: string
  includeActivities: boolean
  includeMaterials: boolean
  lessonIds?: string[]
}

export interface EntityProgress {
  courseId: string
  entityId: string
  entityType: EntityType
  error?: string
  missingLanguages: SupportedLanguage[]
  status: EntityStatus
  title: string
  translatedLanguages: SupportedLanguage[]
}

export interface CourseReport {
  courseId: string
  failed: number
  pending: number
  totalEntities: number
  translated: number
}

export interface LessonTranslationRow {
  course_modules: { course_id: string }
  lesson_description: string | null
  lesson_id: string
  lesson_title: string
  summary_content: string | null
  transcript_content: string | null
}

export interface ActivityTranslationRow {
  activity_content: string
  activity_description: string | null
  activity_id: string
  activity_title: string
  ai_prompts: string | null
}

export interface MaterialTranslationRow {
  content_data: unknown
  material_description: string | null
  material_id: string
  material_title: string
}

export interface TranslationRunContext {
  details: EntityProgress[]
  reports: Map<string, CourseReport>
  supabase: TranslationSupabaseClient
  userId: string
}
