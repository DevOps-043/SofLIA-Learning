import type { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { CourseImportPayloadSchema } from './schemas'
import type { z } from 'zod'

export type ServiceSupabaseClient = ReturnType<typeof createSupabaseClient>
export type CourseImportPayload = z.infer<typeof CourseImportPayloadSchema>
export type ImportedModule = CourseImportPayload['modules'][number]
export type ImportedLesson = ImportedModule['lessons'][number]
export type ImportedMaterial = ImportedLesson['materials'][number]
export type ImportedActivity = ImportedLesson['activities'][number]

export interface QuizQuestionLike {
  id?: string
  question?: string
  questionText?: string
  questionType?: string
  type?: string
  options?: unknown
  correctAnswer?: string | number
  correct_answer?: string | number
  explanation?: string
  points?: number | string
}

export interface QuizSourceData extends Record<string, unknown> {
  questions?: QuizQuestionLike[]
  items?: QuizQuestionLike[]
  passing_score?: number | string
}
