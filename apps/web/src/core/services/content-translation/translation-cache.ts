import type {
  ContentTranslations,
  EntityType,
  TranslationLanguage,
} from './types';

const translationCache = new Map<string, ContentTranslations>();

export function getTranslationCacheKey(
  entityType: EntityType,
  entityId: string,
  language: TranslationLanguage,
): string {
  return `${entityType}:${entityId}:${language}`;
}

export function getCachedTranslations(
  entityType: EntityType,
  entityId: string,
  language: TranslationLanguage,
) {
  return translationCache.get(
    getTranslationCacheKey(entityType, entityId, language),
  );
}

export function setCachedTranslations(
  entityType: EntityType,
  entityId: string,
  language: TranslationLanguage,
  translations: ContentTranslations,
) {
  translationCache.set(
    getTranslationCacheKey(entityType, entityId, language),
    translations,
  );
}

export function clearCachedTranslation(
  entityType: EntityType,
  entityId: string,
  language: TranslationLanguage,
) {
  translationCache.delete(getTranslationCacheKey(entityType, entityId, language));
}

export function clearTranslationCache() {
  translationCache.clear();
}
