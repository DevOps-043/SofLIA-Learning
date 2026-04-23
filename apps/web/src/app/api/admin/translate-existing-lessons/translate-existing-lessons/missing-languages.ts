import { LanguageDetectionService } from '@/core/services/languageDetection.service'
import type { SupportedLanguage } from '@/core/i18n/i18n'
import { ALL_LANGUAGES } from './constants'
import { getExistingLanguages } from './existing-languages'
import type { EntityType, TranslationSupabaseClient } from './types'

export async function computeMissingLanguages(
  supabase: TranslationSupabaseClient,
  entityType: EntityType,
  entityId: string,
  textsToDetect: string[],
): Promise<{ missingLanguages: SupportedLanguage[]; sourceLanguage: SupportedLanguage }> {
  const sourceLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(
    textsToDetect.filter((text) => text.trim().length > 0),
  )
  const targetLanguages = ALL_LANGUAGES.filter((lang) => lang !== sourceLanguage)
  const existingLanguages = await getExistingLanguages(supabase, entityType, entityId)

  return {
    sourceLanguage,
    missingLanguages: targetLanguages.filter((lang) => !existingLanguages.includes(lang)),
  }
}
