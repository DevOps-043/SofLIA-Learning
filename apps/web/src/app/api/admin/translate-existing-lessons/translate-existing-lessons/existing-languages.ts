import type { SupportedLanguage } from '@/core/i18n/i18n'
import type { EntityType, TranslationSupabaseClient } from './types'

export async function getExistingLanguages(
  supabase: TranslationSupabaseClient,
  entityType: EntityType,
  entityId: string,
): Promise<SupportedLanguage[]> {
  const { data } = await supabase
    .from('content_translations')
    .select('language_code')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  return (data || [])
    .map((item) => item.language_code)
    .filter(
      (language): language is SupportedLanguage =>
        language === 'es' || language === 'en' || language === 'pt',
    )
}
