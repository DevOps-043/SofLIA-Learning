import { clearTranslationCache } from './content-translation/translation-cache';
import { loadTranslations } from './content-translation/load-translations';
import {
  getTranslation,
  translateArray,
  translateObject,
} from './content-translation/translate-content';
import { saveTranslation } from './content-translation/save-translation';
import type {
  ContentTranslationPayload,
  ContentTranslations,
  EntityType,
  TranslationLanguage,
  TranslationSupabaseClient,
} from './content-translation/types';

export type { ContentTranslations, EntityType } from './content-translation/types';

export class ContentTranslationService {
  static loadTranslations(
    entityType: EntityType,
    entityId: string,
    language: TranslationLanguage,
    supabaseClient?: TranslationSupabaseClient,
  ) {
    return loadTranslations(entityType, entityId, language, supabaseClient);
  }

  static getTranslation(
    entityType: EntityType,
    entityId: string,
    field: string,
    language: TranslationLanguage,
    fallback: string,
  ) {
    return getTranslation(entityType, entityId, field, language, fallback);
  }

  static translateObject<T extends Record<string, unknown>>(
    entityType: EntityType,
    obj: T,
    fields: string[],
    language: TranslationLanguage,
    supabaseClient?: TranslationSupabaseClient,
  ) {
    return translateObject(entityType, obj, fields, language, supabaseClient);
  }

  static translateArray<T extends Record<string, unknown>>(
    entityType: EntityType,
    array: T[],
    fields: string[],
    language: TranslationLanguage,
    supabaseClient?: TranslationSupabaseClient,
  ) {
    return translateArray(entityType, array, fields, language, supabaseClient);
  }

  static saveTranslation(
    entityType: EntityType,
    entityId: string,
    language: TranslationLanguage,
    translations: ContentTranslationPayload,
    userId?: string,
    supabaseClient?: TranslationSupabaseClient,
  ) {
    return saveTranslation(
      entityType,
      entityId,
      language,
      translations,
      userId,
      supabaseClient,
    );
  }

  static clearCache(): void {
    clearTranslationCache();
  }
}
