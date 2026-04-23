import type { SupportedLanguage } from '@/core/i18n/i18n'
import { ALL_LANGUAGES } from './constants'
import type { EntityProgress, EntityStatus, EntityType } from './types'

interface EntityIdentity {
  entityType: EntityType
  entityId: string
  title: string
  courseId: string
}

export function createAlreadyTranslatedProgress(identity: EntityIdentity): EntityProgress {
  return {
    ...identity,
    status: 'translated',
    missingLanguages: [],
    translatedLanguages: [],
  }
}

export function createFailedProgress(
  identity: EntityIdentity,
  error: unknown,
): EntityProgress {
  return {
    ...identity,
    status: 'failed',
    missingLanguages: ALL_LANGUAGES,
    translatedLanguages: [],
    error: error instanceof Error ? error.message : String(error),
  }
}

export function createTranslationProgress(
  identity: EntityIdentity,
  missingLanguages: SupportedLanguage[],
  translatedLanguages: SupportedLanguage[],
  errors?: Record<string, unknown>,
): EntityProgress {
  const remainingMissing = missingLanguages.filter(
    (lang) => !translatedLanguages.includes(lang),
  )
  const status = resolveTranslationStatus(remainingMissing, translatedLanguages)

  return {
    ...identity,
    status,
    missingLanguages: remainingMissing,
    translatedLanguages,
    error: status === 'failed' ? readTranslationError(errors) : undefined,
  }
}

function resolveTranslationStatus(
  missingLanguages: SupportedLanguage[],
  translatedLanguages: SupportedLanguage[],
): EntityStatus {
  if (missingLanguages.length === 0) return 'translated'
  return translatedLanguages.length > 0 ? 'pending' : 'failed'
}

function readTranslationError(errors?: Record<string, unknown>) {
  return Object.values(errors || {}).join(', ') || 'Error desconocido'
}
