import { normalizeTranslations } from './translation-validation';
import { getCachedTranslations, setCachedTranslations } from './translation-cache';
import { resolveReadClient } from './translation-client';
import type {
  ContentTranslations,
  EntityType,
  TranslationLanguage,
  TranslationSupabaseClient,
} from './types';

export async function loadTranslations(
  entityType: EntityType,
  entityId: string,
  language: TranslationLanguage,
  supabaseClient?: TranslationSupabaseClient,
): Promise<ContentTranslations> {
  const cachedTranslations = getCachedTranslations(
    entityType,
    entityId,
    language,
  );

  if (cachedTranslations) {
    return cachedTranslations;
  }

  try {
    const supabase = resolveReadClient(supabaseClient);
    const { data, error } = await supabase
      .from('content_translations')
      .select('translations')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('language_code', language)
      .single();

    if (error || !data) {
      setCachedTranslations(entityType, entityId, language, {});
      return {};
    }

    const translations = normalizeTranslations(data.translations);
    setCachedTranslations(entityType, entityId, language, translations);
    return translations;
  } catch (error) {
    console.error(
      `[ContentTranslationService] Error loading ${entityType}:${entityId}:`,
      error,
    );
    return {};
  }
}
