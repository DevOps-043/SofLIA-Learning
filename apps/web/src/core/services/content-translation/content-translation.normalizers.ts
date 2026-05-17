import type { Json } from '@/lib/supabase/types';
import type { ContentTranslations } from './content-translation.types';

function isStringArray(value: Json): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isContentTranslations(value: Json | null): value is ContentTranslations {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every(
    entry => typeof entry === 'string' || isStringArray(entry as Json)
  );
}

export function normalizeContentTranslations(value: Json | null): ContentTranslations {
  return isContentTranslations(value) ? value : {};
}

export function getRecordEntityId(record: Record<string, unknown>): string | null {
  const { id } = record;

  if (typeof id === 'string' || typeof id === 'number') {
    return String(id);
  }

  return null;
}

export function applyTranslations<T extends Record<string, unknown>>(
  item: T,
  fields: string[],
  translations: ContentTranslations | undefined
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
