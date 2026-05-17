import type { SupportedLanguage } from '@/core/i18n/i18n'

import { ALL_LANGUAGES, type EntityProgress, type EntityType } from './types'

export function buildTranslatedProgress(input: {
  courseId: string
  entityId: string
  entityType: EntityType
  title: string
}): EntityProgress {
  return {
    ...input,
    missingLanguages: [],
    status: 'translated',
    translatedLanguages: [],
  }
}

export function buildFailedProgress(input: {
  courseId: string
  entityId: string
  entityType: EntityType
  error: unknown
  title: string
}): EntityProgress {
  return {
    courseId: input.courseId,
    entityId: input.entityId,
    entityType: input.entityType,
    error: input.error instanceof Error ? input.error.message : String(input.error),
    missingLanguages: ALL_LANGUAGES,
    status: 'failed',
    title: input.title,
    translatedLanguages: [],
  }
}

export function buildTranslationProgress(input: {
  courseId: string
  entityId: string
  entityType: EntityType
  missingLanguages: SupportedLanguage[]
  title: string
  translationResult: {
    errors?: Record<string, unknown>
    languages?: SupportedLanguage[]
  }
}): EntityProgress {
  const translatedLanguages = input.translationResult.languages || []
  const remainingMissing = input.missingLanguages.filter(
    (lang) => !translatedLanguages.includes(lang)
  )
  const status =
    remainingMissing.length === 0
      ? 'translated'
      : translatedLanguages.length > 0
        ? 'pending'
        : 'failed'

  return {
    courseId: input.courseId,
    entityId: input.entityId,
    entityType: input.entityType,
    error: status === 'failed' ? getTranslationError(input.translationResult.errors) : undefined,
    missingLanguages: remainingMissing,
    status,
    title: input.title,
    translatedLanguages,
  }
}

function getTranslationError(errors?: Record<string, unknown>): string {
  return Object.values(errors || {}).join(', ') || 'Error desconocido'
}
