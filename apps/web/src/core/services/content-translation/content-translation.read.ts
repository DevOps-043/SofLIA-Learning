import { createClient } from '@/lib/supabase/client';
import {
  getCachedContentTranslations,
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

export async function loadContentTranslations(
  entityType: ContentTranslationEntityType,
  entityId: string,
  language: ContentTranslationLanguage,
  supabaseClient?: ContentTranslationClient
): Promise<ContentTranslations> {
  const cacheKey = getContentTranslationCacheKey(entityType, entityId, language);
  const cachedTranslations = getCachedContentTranslations(cacheKey);

  if (cachedTranslations) {
    return cachedTranslations;
  }

  try {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('content_translations')
      .select('translations')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('language_code', language)
      .single();

    if (error || !data) {
      setCachedContentTranslations(cacheKey, {});
      return {};
    }

    const translations = normalizeContentTranslations(data.translations);
    setCachedContentTranslations(cacheKey, translations);
    return translations;
  } catch (error) {
    console.error(
      `[ContentTranslationService] Error loading translations for ${entityType}:${entityId}:`,
      error
    );
    return {};
  }
}

export async function getContentTranslation(
  entityType: ContentTranslationEntityType,
  entityId: string,
  field: string,
  language: ContentTranslationLanguage,
  fallback: string
): Promise<string> {
  const translations = await loadContentTranslations(entityType, entityId, language);
  const translatedValue = translations[field];

  return typeof translatedValue === 'string' ? translatedValue : fallback;
}

export async function translateContentObject<T extends Record<string, unknown>>(
  entityType: ContentTranslationEntityType,
  obj: T,
  fields: string[],
  language: ContentTranslationLanguage,
  supabaseClient?: ContentTranslationClient
): Promise<T> {
  const entityId = getRecordEntityId(obj);

  if (!entityId) {
    return obj;
  }

  const translations = await loadContentTranslations(
    entityType,
    entityId,
    language,
    supabaseClient
  );

  return applyTranslations(obj, fields, translations);
}
