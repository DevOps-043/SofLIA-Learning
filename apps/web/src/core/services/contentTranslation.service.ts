import { clearTranslationCache } from './content-translation/translation-cache';
import { loadTranslations } from './content-translation/load-translations';
import {
  getTranslation,
  translateArray,
  translateObject,
} from './content-translation/translate-content';
import type {
  EntityType,
  TranslationLanguage,
  TranslationSupabaseClient,
} from './content-translation/types';

export type { ContentTranslations, EntityType } from './content-translation/types';

/**
 * Servicio de traduccion de contenido — SOLO LECTURA.
 * Es seguro de importar desde Client Components.
 * Para escritura usar `ContentTranslationWriteService` de
 * `contentTranslation.write.service.ts` (server-only).
 */
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

  static clearCache(): void {
    clearTranslationCache();
  }
}
