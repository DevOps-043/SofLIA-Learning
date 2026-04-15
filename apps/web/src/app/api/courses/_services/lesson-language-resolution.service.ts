import type { createClient as createSupabaseClient } from '@/lib/supabase/server'

export type LearnLanguage = 'es' | 'en' | 'pt'

export type TranslationMissingPiece =
  | 'lesson_text'
  | 'transcript'
  | 'summary'
  | 'materials'
  | 'activities'

export interface TranslationContext {
  requestedLanguage: LearnLanguage
  resolvedLanguage: LearnLanguage
  usedFallback: boolean
  missingPieces: TranslationMissingPiece[]
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>

type LessonBaseRow = {
  lesson_id: string
  module_id: string
  lesson_title?: string | null
  lesson_description?: string | null
  transcript_content?: string | null
  summary_content?: string | null
}

const EMPTY_TRANSLATION_CONTEXT: TranslationContext = {
  requestedLanguage: 'es',
  resolvedLanguage: 'es',
  usedFallback: false,
  missingPieces: [],
}

export function normalizeLearnLanguage(value?: string | null): LearnLanguage {
  if (value === 'en' || value === 'pt') {
    return value
  }
  return 'es'
}

export function getLessonsTableNameForLanguage(language: LearnLanguage): string {
  switch (language) {
    case 'en':
      return 'course_lessons_en'
    case 'pt':
      return 'course_lessons_pt'
    case 'es':
    default:
      return 'course_lessons'
  }
}

function isMissingTextValue(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function cloneContext(context?: TranslationContext): TranslationContext {
  if (!context) {
    return { ...EMPTY_TRANSLATION_CONTEXT }
  }

  return {
    requestedLanguage: context.requestedLanguage,
    resolvedLanguage: context.resolvedLanguage,
    usedFallback: context.usedFallback,
    missingPieces: [...context.missingPieces],
  }
}

export function mergeTranslationContexts(
  contexts: Array<TranslationContext | undefined>,
  requestedLanguage: LearnLanguage,
): TranslationContext {
  const merged = contexts.reduce<TranslationContext>(
    (acc, context) => {
      if (!context) {
        return acc
      }

      acc.usedFallback = acc.usedFallback || context.usedFallback
      if (context.resolvedLanguage === 'es') {
        acc.resolvedLanguage = 'es'
      }

      for (const piece of context.missingPieces) {
        if (!acc.missingPieces.includes(piece)) {
          acc.missingPieces.push(piece)
        }
      }

      return acc
    },
    {
      requestedLanguage,
      resolvedLanguage: requestedLanguage,
      usedFallback: false,
      missingPieces: [],
    },
  )

  return merged
}

export function ensureTranslationContext(
  context: TranslationContext | undefined,
  requestedLanguage: LearnLanguage,
): TranslationContext {
  if (!context) {
    return {
      requestedLanguage,
      resolvedLanguage: requestedLanguage,
      usedFallback: false,
      missingPieces: [],
    }
  }

  return cloneContext(context)
}

export function resolveLessonContentWithFallback(params: {
  requestedLanguage: LearnLanguage
  baseLesson: LessonBaseRow
  translatedLesson?: LessonBaseRow | null
}): { lesson: LessonBaseRow; translationContext: TranslationContext } {
  const { requestedLanguage, baseLesson, translatedLesson } = params

  if (requestedLanguage === 'es') {
    return {
      lesson: baseLesson,
      translationContext: {
        requestedLanguage,
        resolvedLanguage: 'es',
        usedFallback: false,
        missingPieces: [],
      },
    }
  }

  const missingPieces = new Set<TranslationMissingPiece>()
  const mergedLesson: LessonBaseRow = {
    ...baseLesson,
  }

  if (!translatedLesson) {
    missingPieces.add('lesson_text')
    if (!isMissingTextValue(baseLesson.transcript_content)) {
      missingPieces.add('transcript')
    }
    if (!isMissingTextValue(baseLesson.summary_content)) {
      missingPieces.add('summary')
    }
  } else {
    if (!isMissingTextValue(translatedLesson.lesson_title)) {
      mergedLesson.lesson_title = translatedLesson.lesson_title
    } else if (!isMissingTextValue(baseLesson.lesson_title)) {
      missingPieces.add('lesson_text')
    }

    if (!isMissingTextValue(translatedLesson.lesson_description)) {
      mergedLesson.lesson_description = translatedLesson.lesson_description
    } else if (!isMissingTextValue(baseLesson.lesson_description)) {
      missingPieces.add('lesson_text')
    }

    if (!isMissingTextValue(translatedLesson.transcript_content)) {
      mergedLesson.transcript_content = translatedLesson.transcript_content
    } else if (!isMissingTextValue(baseLesson.transcript_content)) {
      missingPieces.add('transcript')
    }

    if (!isMissingTextValue(translatedLesson.summary_content)) {
      mergedLesson.summary_content = translatedLesson.summary_content
    } else if (!isMissingTextValue(baseLesson.summary_content)) {
      missingPieces.add('summary')
    }
  }

  const usedFallback = missingPieces.size > 0

  return {
    lesson: mergedLesson,
    translationContext: {
      requestedLanguage,
      resolvedLanguage: translatedLesson ? requestedLanguage : 'es',
      usedFallback,
      missingPieces: [...missingPieces],
    },
  }
}

export async function resolveCourseLessonByLanguage(params: {
  supabase: SupabaseServerClient
  courseId: string
  lessonId: string
  requestedLanguage: string
}): Promise<{
  lesson: LessonBaseRow | null
  baseLessonId: string | null
  translationContext: TranslationContext
}> {
  const { supabase, courseId, lessonId } = params
  const requestedLanguage = normalizeLearnLanguage(params.requestedLanguage)
  const baseLessonQuery = await supabase
    .from('course_lessons')
    .select(
      `
      lesson_id,
      module_id,
      lesson_title,
      lesson_description,
      transcript_content,
      summary_content,
      course_modules!inner (module_id, course_id)
    `,
    )
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()

  if (baseLessonQuery.error || !baseLessonQuery.data) {
    return {
      lesson: null,
      baseLessonId: null,
      translationContext: {
        requestedLanguage,
        resolvedLanguage: requestedLanguage,
        usedFallback: false,
        missingPieces: [],
      },
    }
  }

  const baseLesson = baseLessonQuery.data as LessonBaseRow

  if (requestedLanguage === 'es') {
    return {
      lesson: baseLesson,
      baseLessonId: baseLesson.lesson_id,
      translationContext: {
        requestedLanguage,
        resolvedLanguage: 'es',
        usedFallback: false,
        missingPieces: [],
      },
    }
  }

  const translatedLessonQuery = await supabase
    .from(getLessonsTableNameForLanguage(requestedLanguage))
    .select(
      `
      lesson_id,
      module_id,
      lesson_title,
      lesson_description,
      transcript_content,
      summary_content,
      course_modules!inner (module_id, course_id)
    `,
    )
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()

  const translatedLesson = translatedLessonQuery.error
    ? null
    : ((translatedLessonQuery.data as LessonBaseRow | null) ?? null)

  const resolved = resolveLessonContentWithFallback({
    requestedLanguage,
    baseLesson,
    translatedLesson,
  })

  return {
    lesson: resolved.lesson,
    baseLessonId: baseLesson.lesson_id,
    translationContext: resolved.translationContext,
  }
}
