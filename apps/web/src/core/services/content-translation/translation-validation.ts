import type { Json } from '@/lib/supabase/types';
import type { ContentTranslations } from './types';

function isStringArray(value: Json): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function isContentTranslations(
  value: Json | null,
): value is ContentTranslations {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every(
    entry => typeof entry === 'string' || isStringArray(entry as Json),
  );
}

export function normalizeTranslations(
  value: Json | null,
): ContentTranslations {
  return isContentTranslations(value) ? value : {};
}
