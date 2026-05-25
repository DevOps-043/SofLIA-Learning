import { useCallback } from 'react'
import businessEn from '../../../../../public/locales/en/business.json'
import businessEs from '../../../../../public/locales/es/business.json'
import businessPt from '../../../../../public/locales/pt/business.json'
import type { ReportsAnalyticsBreakdownItem } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsLocale } from './types'

const reportsAnalyticsResources = {
  es: businessEs.reportsAnalytics,
  en: businessEn.reportsAnalytics,
  pt: businessPt.reportsAnalytics,
} as const

export function translateDimension(
  t: (key: string) => string,
  group: string,
  item: ReportsAnalyticsBreakdownItem,
): string {
  return translateKey(t, group, item.key, item.label)
}

export function translateKey(
  t: (key: string) => string,
  group: string,
  key: string,
  fallback?: string,
): string {
  const translationKey = `reportsAnalytics.${group}.${key}`
  const translated = t(translationKey)
  return translated === translationKey ? fallback || key : translated
}

export function useReportsAnalyticsText(
  baseT: (key: string) => string,
  locale: ReportsAnalyticsLocale,
): (key: string) => string {
  return useCallback(
    (key: string) => {
      if (!key.startsWith('reportsAnalytics.')) return baseT(key)

      const value = getNestedTranslation(
        reportsAnalyticsResources[locale],
        key.replace('reportsAnalytics.', ''),
      )

      return typeof value === 'string' ? value : baseT(key)
    },
    [baseT, locale],
  )
}

function getNestedTranslation(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[segment]
  }, source)
}

export function isReportsAnalyticsLocale(language: string): language is ReportsAnalyticsLocale {
  return language === 'es' || language === 'en' || language === 'pt'
}
