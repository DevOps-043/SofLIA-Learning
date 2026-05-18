import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '../providers/I18nProvider'
import { ContentTranslationService } from '../services/contentTranslation.service'
import type { ContentTranslationEntityType } from './content-translation.types'

export function useTranslatedObject<T extends Record<string, unknown>>(
  entityType: ContentTranslationEntityType,
  data: T | null | undefined,
  fields: string[],
): T | null {
  const { language } = useLanguage()
  const [translatedData, setTranslatedData] = useState<T | null>(null)

  const dataKey = useMemo(() => data?.id || 'empty', [data?.id])

  useEffect(() => {
    if (!data) {
      setTranslatedData(null)
      return
    }

    let isCancelled = false

    const translateData = async () => {
      try {
        const translated = await ContentTranslationService.translateObject(
          entityType,
          data,
          fields,
          language,
        )

        if (!isCancelled) {
          setTranslatedData(translated)
        }
      } catch (error) {
        techDebtLogger.error('Error translating object:', error)
        if (!isCancelled) {
          setTranslatedData(data)
        }
      }
    }

    translateData()

    return () => {
      isCancelled = true
    }
  }, [dataKey, language, entityType])

  return translatedData
}
