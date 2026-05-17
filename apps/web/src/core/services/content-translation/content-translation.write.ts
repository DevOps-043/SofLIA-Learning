import {
  deleteCachedContentTranslations,
  getContentTranslationCacheKey,
} from './content-translation.cache';
import { createContentTranslationWriteClient } from './content-translation.write-client';
import type {
  ContentTranslationClient,
  ContentTranslationEntityType,
  ContentTranslationLanguage,
  ContentTranslations,
} from './content-translation.types';

const LARGE_TRANSLATION_BYTES = 10 * 1024 * 1024;

function hasTranslations(translations: ContentTranslations): boolean {
  return Object.keys(translations).length > 0;
}

function warnIfTranslationPayloadIsLarge(
  entityType: ContentTranslationEntityType,
  entityId: string,
  language: ContentTranslationLanguage,
  translations: ContentTranslations
): void {
  const payloadSize = new Blob([JSON.stringify(translations)]).size;

  if (payloadSize <= LARGE_TRANSLATION_BYTES) {
    return;
  }

  const payloadSizeMb = (payloadSize / (1024 * 1024)).toFixed(2);
  console.warn(
    `[ContentTranslationService] Large translations (${payloadSizeMb}MB) for ${entityType}:${entityId}:${language}`
  );
}

export async function saveContentTranslation(
  entityType: ContentTranslationEntityType,
  entityId: string,
  language: ContentTranslationLanguage,
  translations: ContentTranslations,
  userId?: string,
  supabaseClient?: ContentTranslationClient
): Promise<boolean> {
  try {
    if (!hasTranslations(translations)) {
      console.warn(
        `[ContentTranslationService] No translations to save for ${entityType}:${entityId}:${language}`
      );
      return false;
    }

    warnIfTranslationPayloadIsLarge(entityType, entityId, language, translations);

    const supabase = createContentTranslationWriteClient(supabaseClient);

    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from('content_translations')
      .upsert(
        {
          created_by: userId || null,
          entity_id: entityId,
          entity_type: entityType,
          language_code: language,
          translations,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'entity_type,entity_id,language_code' }
      )
      .select();

    if (error) {
      console.error(
        `[ContentTranslationService] Error saving translation for ${entityType}:${entityId}:${language}:`,
        error
      );
      return false;
    }

    deleteCachedContentTranslations(getContentTranslationCacheKey(entityType, entityId, language));
    return true;
  } catch (error) {
    console.error(
      `[ContentTranslationService] Exception saving translation for ${entityType}:${entityId}:${language}:`,
      error
    );
    return false;
  }
}
