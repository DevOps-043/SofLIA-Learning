import { createClient } from '@/lib/supabase/client';
import { normalizeTranslations } from './translation-validation';
import { setCachedTranslations } from './translation-cache';
import { loadTranslations } from './load-translations';
import type {
  EntityType,
  ContentTranslations,
  TranslationLanguage,
  TranslationSupabaseClient,
} from './types';

function applyTranslations<T extends Record<string, unknown>>(
  item: T,
  fields: string[],
  translations?: ContentTranslations,
): T {
  if (!translations || Object.keys(translations).length === 0) {
    return item;
  }

  const translated = { ...item } as Record<string, unknown>;
  fields.forEach(field => {
    if (translations[field]) {
      translated[field] = translations[field];
    }
  });
  return translated as T;
}

export async function getTranslation(
  entityType: EntityType,
  entityId: string,
  field: string,
  language: TranslationLanguage,
  fallback: string,
): Promise<string> {
  const translations = await loadTranslations(entityType, entityId, language);
  const translatedValue = translations[field];
  return typeof translatedValue === 'string' ? translatedValue : fallback;
}

export async function translateObject<T extends Record<string, unknown>>(
  entityType: EntityType,
  obj: T,
  fields: string[],
  language: TranslationLanguage,
  supabaseClient?: TranslationSupabaseClient,
): Promise<T> {
  if (!obj.id) {
    return obj;
  }

  const translations = await loadTranslations(
    entityType,
    String(obj.id),
    language,
    supabaseClient,
  );

  return applyTranslations(obj, fields, translations);
}

export async function translateArray<T extends Record<string, unknown>>(
  entityType: EntityType,
  array: T[],
  fields: string[],
  language: TranslationLanguage,
  supabaseClient?: TranslationSupabaseClient,
): Promise<T[]> {
  if (array.length === 0) {
    return array;
  }

  const entityIds = array.map(item => item.id).filter(Boolean).map(String);
  if (entityIds.length === 0) {
    return array;
  }

  try {
    const supabase = supabaseClient ?? createClient();
    const { data, error } = await supabase
      .from('content_translations')
      .select('entity_id, translations')
      .eq('entity_type', entityType)
      .eq('language_code', language)
      .in('entity_id', entityIds);

    if (error || !data) {
      console.warn('[translateArray] No translations found or error:', error);
      return array;
    }

    const translationsMap = new Map<string, ContentTranslations>();
    data.forEach(item => {
      const translations = normalizeTranslations(item.translations);
      translationsMap.set(item.entity_id, translations);
      setCachedTranslations(entityType, item.entity_id, language, translations);
    });

    return array.map(item =>
      applyTranslations(item, fields, translationsMap.get(String(item.id))),
    );
  } catch (error) {
    console.error('Error translating array:', error);
    return array;
  }
}
