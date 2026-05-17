import type { SupportedLanguage } from '../../i18n/i18n';
import type { TranslationResult } from './types';

export const ALL_TRANSLATION_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'pt'];

export function getTargetLanguages(sourceLanguage: SupportedLanguage): SupportedLanguage[] {
  return ALL_TRANSLATION_LANGUAGES.filter((language) => language !== sourceLanguage);
}

export function createFailedTranslationResult(message: string): TranslationResult {
  return {
    success: false,
    languages: [],
    errors: {
      es: message,
      en: message,
      pt: message,
    },
  };
}

export function fieldsWithOptional(baseFields: string[], optionalFields: Record<string, unknown>): string[] {
  const fields = [...baseFields];

  Object.entries(optionalFields).forEach(([field, value]) => {
    if (value) {
      fields.push(field);
    }
  });

  return fields;
}

export function compactTexts(texts: Array<string | null | undefined>): string[] {
  return texts.filter((text): text is string => Boolean(text));
}
