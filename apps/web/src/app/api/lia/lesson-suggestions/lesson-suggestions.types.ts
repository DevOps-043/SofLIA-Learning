import { z } from 'zod'

import type { SupportedLanguage } from '@/core/i18n/i18n'

export const SUGGESTIONS_PER_LESSON = 3

export const SUGGESTION_TEXT_MIN = 8
export const SUGGESTION_TEXT_MAX = 140

export const lessonSuggestionsLanguageSchema = z.enum(['es', 'en', 'pt'])

export const lessonSuggestionsActivityFocusSchema = z.object({
  title: z.string().min(1).max(280),
  type: z.string().min(1).max(64),
  description: z.string().max(2000).optional(),
})

export const lessonSuggestionsRequestSchema = z.object({
  lessonId: z.string().uuid(),
  courseSlug: z.string().min(1).max(160),
  language: lessonSuggestionsLanguageSchema,
  activityFocus: lessonSuggestionsActivityFocusSchema.optional(),
})

export const lessonSuggestionItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(SUGGESTION_TEXT_MIN).max(SUGGESTION_TEXT_MAX),
})

export const lessonSuggestionsResponseSchema = z.object({
  suggestions: z.array(lessonSuggestionItemSchema).length(SUGGESTIONS_PER_LESSON),
  source: z.enum(['cache', 'generated']),
  generatedAt: z.string(),
})

export type LessonSuggestionsRequest = z.infer<typeof lessonSuggestionsRequestSchema>
export type LessonSuggestionItem = z.infer<typeof lessonSuggestionItemSchema>
export type LessonSuggestionsResponse = z.infer<typeof lessonSuggestionsResponseSchema>
export type LessonSuggestionsActivityFocus = z.infer<typeof lessonSuggestionsActivityFocusSchema>
export type LessonSuggestionsLanguage = SupportedLanguage extends 'es' | 'en' | 'pt'
  ? SupportedLanguage
  : 'es' | 'en' | 'pt'

export interface LessonContextSnapshot {
  lessonId: string
  lessonTitle: string
  lessonDescription?: string
  lessonSummary?: string
  courseTitle: string
  courseSlug: string
  language: LessonSuggestionsLanguage
  activityFocus?: LessonSuggestionsActivityFocus
}
