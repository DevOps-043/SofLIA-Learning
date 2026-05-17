import type {
  ContentTranslationEntityType,
  ContentTranslationLanguage,
  ContentTranslations,
} from './content-translation.types';

const translationsCache = new Map<string, ContentTranslations>();

export function getContentTranslationCacheKey(
  entityType: ContentTranslationEntityType,
  entityId: string,
  language: ContentTranslationLanguage
): string {
  return `${entityType}:${entityId}:${language}`;
}

export function getCachedContentTranslations(
  cacheKey: string
): ContentTranslations | undefined {
  return translationsCache.get(cacheKey);
}

export function setCachedContentTranslations(
  cacheKey: string,
  translations: ContentTranslations
): void {
  translationsCache.set(cacheKey, translations);
}

export function deleteCachedContentTranslations(cacheKey: string): void {
  translationsCache.delete(cacheKey);
}

export function clearContentTranslationCache(): void {
  translationsCache.clear();
}
