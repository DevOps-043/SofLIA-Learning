import { createHash } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  SUGGESTIONS_PER_LESSON,
  SUGGESTION_TEXT_MAX,
  SUGGESTION_TEXT_MIN,
  type LessonContextSnapshot,
  type LessonSuggestionItem,
  type LessonSuggestionsLanguage,
} from './lesson-suggestions.types'

const CACHE_TABLE = 'lesson_chat_suggestions'

export class LessonSuggestionsCacheError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'LessonSuggestionsCacheError'
    this.cause = cause
  }
}

export function computeLessonContentHash(
  snapshot: LessonContextSnapshot,
): string {
  const fingerprint = JSON.stringify({
    lessonId: snapshot.lessonId,
    language: snapshot.language,
    courseTitle: snapshot.courseTitle ?? '',
    lessonTitle: snapshot.lessonTitle ?? '',
    lessonDescription: snapshot.lessonDescription ?? '',
    lessonSummary: snapshot.lessonSummary ?? '',
    activityFocus: snapshot.activityFocus
      ? {
          title: snapshot.activityFocus.title,
          type: snapshot.activityFocus.type,
          description: snapshot.activityFocus.description ?? '',
        }
      : null,
  })

  return createHash('sha256').update(fingerprint).digest('hex')
}

interface CacheRow {
  suggestions: unknown
  content_hash: string
  generated_at: string
}

function isLessonSuggestionItemArray(
  value: unknown,
): value is LessonSuggestionItem[] {
  if (!Array.isArray(value) || value.length !== SUGGESTIONS_PER_LESSON) {
    return false
  }

  return value.every((entry) => {
    if (!entry || typeof entry !== 'object') {
      return false
    }

    const candidate = entry as Partial<LessonSuggestionItem>

    return (
      typeof candidate.id === 'string' &&
      candidate.id.length > 0 &&
      typeof candidate.text === 'string' &&
      candidate.text.length >= SUGGESTION_TEXT_MIN &&
      candidate.text.length <= SUGGESTION_TEXT_MAX
    )
  })
}

export interface CachedLessonSuggestions {
  suggestions: LessonSuggestionItem[]
  generatedAt: string
}

export async function readCachedSuggestions(
  client: SupabaseClient,
  lessonId: string,
  language: LessonSuggestionsLanguage,
  contentHash: string,
): Promise<CachedLessonSuggestions | null> {
  const { data, error } = await client
    .from(CACHE_TABLE)
    .select('suggestions, content_hash, generated_at')
    .eq('lesson_id', lessonId)
    .eq('language', language)
    .maybeSingle<CacheRow>()

  if (error) {
    throw new LessonSuggestionsCacheError(
      'Failed to read lesson suggestions cache',
      error,
    )
  }

  if (!data || data.content_hash !== contentHash) {
    return null
  }

  if (!isLessonSuggestionItemArray(data.suggestions)) {
    return null
  }

  return {
    suggestions: data.suggestions,
    generatedAt: data.generated_at,
  }
}

export async function upsertCachedSuggestions(
  client: SupabaseClient,
  lessonId: string,
  language: LessonSuggestionsLanguage,
  contentHash: string,
  suggestions: LessonSuggestionItem[],
): Promise<string> {
  const generatedAt = new Date().toISOString()

  const { error } = await client.from(CACHE_TABLE).upsert(
    {
      lesson_id: lessonId,
      language,
      content_hash: contentHash,
      suggestions,
      generated_at: generatedAt,
    },
    { onConflict: 'lesson_id,language' },
  )

  if (error) {
    throw new LessonSuggestionsCacheError(
      'Failed to upsert lesson suggestions cache',
      error,
    )
  }

  return generatedAt
}
