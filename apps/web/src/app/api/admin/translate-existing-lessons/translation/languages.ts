import { LanguageDetectionService } from '@/core/services/languageDetection.service'
import type { SupportedLanguage } from '@/core/i18n/i18n'

import {
  ALL_LANGUAGES,
  type EntityType,
  type TranslationSupabaseClient,
} from './types'

export async function getExistingLanguages(
  supabase: TranslationSupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<SupportedLanguage[]> {
  const { data } = await supabase
    .from('content_translations')
    .select('language_code')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  return (data || [])
    .map((item) => item.language_code)
    .filter((language): language is SupportedLanguage =>
      language === 'es' || language === 'en' || language === 'pt'
    )
}

export async function computeMissingLanguages(
  supabase: TranslationSupabaseClient,
  entityType: EntityType,
  entityId: string,
  textsToDetect: string[]
): Promise<{ missingLanguages: SupportedLanguage[]; sourceLanguage: SupportedLanguage }> {
  const sourceLanguage = await LanguageDetectionService.detectLanguageFromMultipleTexts(
    textsToDetect.filter((text) => text.trim().length > 0)
  )

  const targetLanguages = ALL_LANGUAGES.filter((lang) => lang !== sourceLanguage)
  const existingLanguages = await getExistingLanguages(supabase, entityType, entityId)

  return {
    missingLanguages: targetLanguages.filter((lang) => !existingLanguages.includes(lang)),
    sourceLanguage,
  }
}
