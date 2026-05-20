import { logger as techDebtLogger } from '@/lib/utils/logger'
import { clearCachedTranslation } from './translation-cache';
import { createTranslationWriteClient } from './translation-write-client';
import type { Json } from '@/lib/supabase/types';
import type {
  ContentTranslationPayload,
  EntityType,
  TranslationLanguage,
  TranslationSupabaseClient,
} from './types';

const MAX_TRANSLATION_SIZE_BYTES = 10 * 1024 * 1024;

function getTranslationPayloadSize(translations: ContentTranslationPayload) {
  return new Blob([JSON.stringify(translations)]).size;
}

export async function saveTranslation(
  entityType: EntityType,
  entityId: string,
  language: TranslationLanguage,
  translations: ContentTranslationPayload,
  userId?: string,
  supabaseClient?: TranslationSupabaseClient,
): Promise<boolean> {
  if (!translations || Object.keys(translations).length === 0) {
    techDebtLogger.warn(
      `[ContentTranslationService] No translations to save for ${entityType}:${entityId}:${language}`,
    );
    return false;
  }

  const translationsSize = getTranslationPayloadSize(translations);
  if (translationsSize > MAX_TRANSLATION_SIZE_BYTES) {
    techDebtLogger.warn(
      `[ContentTranslationService] Large translations payload (${(
        translationsSize /
        (1024 * 1024)
      ).toFixed(2)}MB) for ${entityType}:${entityId}:${language}`,
    );
  }

  try {
    const supabase = supabaseClient ?? createTranslationWriteClient();
    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from('content_translations')
      .upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          language_code: language,
          translations: translations as Json,
          created_by: userId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'entity_type,entity_id,language_code' },
      )
      .select();

    if (error) {
      techDebtLogger.error(
        `[ContentTranslationService] Error saving ${entityType}:${entityId}:${language}:`,
        {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      );
      return false;
    }

    clearCachedTranslation(entityType, entityId, language);
    return true;
  } catch (error) {
    techDebtLogger.error(
      `[ContentTranslationService] Exception saving ${entityType}:${entityId}:${language}:`,
      error,
    );
    return false;
  }
}
