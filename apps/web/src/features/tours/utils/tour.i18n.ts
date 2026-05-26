import type { TFunction, i18n as I18nInstance } from 'i18next'

import { syncI18nResources } from '@/core/i18n/i18n'

const TOURS_NAMESPACE = 'tours'
const TOURS_NAMESPACE_PREFIX = `${TOURS_NAMESPACE}.`

type TourTranslationOptions = Record<string, string | number | boolean | null | undefined>

export function normalizeTourTranslationKey(key: string): string {
  return key.startsWith(TOURS_NAMESPACE_PREFIX) ? key.slice(TOURS_NAMESPACE_PREFIX.length) : key
}

function interpolate(text: string, options?: TourTranslationOptions): string {
  if (!options) {
    return text
  }

  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => {
    const value = options[token]

    return value === undefined || value === null ? '' : String(value)
  })
}

export function translateTourKey(
  t: TFunction,
  i18n: I18nInstance,
  key: string,
  options?: TourTranslationOptions,
): string {
  syncI18nResources()

  const normalizedKey = normalizeTourTranslationKey(key)
  const translated = t(normalizedKey, options)

  if (typeof translated === 'string' && translated !== normalizedKey && translated !== key) {
    return translated
  }

  const fallbackLanguages = Array.from(
    new Set(
      [i18n.resolvedLanguage, i18n.language, 'es'].filter(
        (language): language is string => typeof language === 'string' && language.length > 0,
      ),
    ),
  )

  for (const language of fallbackLanguages) {
    const resource = i18n.getResource(language, TOURS_NAMESPACE, normalizedKey)

    if (typeof resource === 'string') {
      return interpolate(resource, options)
    }
  }

  return typeof translated === 'string' ? translated : normalizedKey
}
