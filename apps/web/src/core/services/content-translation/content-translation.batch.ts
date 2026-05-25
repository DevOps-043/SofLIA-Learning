import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/client';
import {
  getContentTranslationCacheKey,
  setCachedContentTranslations,
} from './content-translation.cache';
import {
  applyTranslations,
  getRecordEntityId,
  normalizeContentTranslations,
} from './content-translation.normalizers';
import type {
  ContentTranslationClient,
  ContentTranslationEntityType,
  ContentTranslationLanguage,
  ContentTranslations,
} from './content-translation.types';

export async function translateContentArray<T extends Record<string, unknown>>(
  entityType: ContentTranslationEntityType,
  array: T[],
  fields: string[],
  language: ContentTranslationLanguage,
  supabaseClient?: ContentTranslationClient
): Promise<T[]> {
  if (array.length === 0) {
    return array;
  }

  try {
    const entityIds = array
      .map(item => getRecordEntityId(item))
      .filter((entityId): entityId is string => Boolean(entityId));

    if (entityIds.length === 0) {
      return array;
    }

    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('content_translations')
      .select('entity_id, translations')
      .eq('entity_type', entityType)
      .eq('language_code', language)
      .in('entity_id', entityIds);

    if (error || !data) {
      techDebtLogger.warn('[translateArray] No translations found or error:', error);
      return array;
    }

    const translationsMap = new Map<string, ContentTranslations>();
    data.forEach(item => {
      const translations = normalizeContentTranslations(item.translations);
      translationsMap.set(item.entity_id, translations);
      setCachedContentTranslations(
        getContentTranslationCacheKey(entityType, item.entity_id, language),
        translations
      );
    });

    return array.map(item => {
      const entityId = getRecordEntityId(item);
      return applyTranslations(item, fields, entityId ? translationsMap.get(entityId) : undefined);
    });
  } catch (error) {
    techDebtLogger.error('Error translating array:', error);
    return array;
  }
}
