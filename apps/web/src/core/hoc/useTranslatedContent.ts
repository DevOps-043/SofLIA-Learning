import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '../providers/I18nProvider'
import { ContentTranslationService } from '../services/contentTranslation.service'
import type { ContentTranslationEntityType } from './content-translation.types'

export function useTranslatedContent<T extends Record<string, unknown>>(
  entityType: ContentTranslationEntityType,
  data: T[] | null | undefined,
  fields: string[],
): T[] {
  const { language } = useLanguage()
  const [translatedData, setTranslatedData] = useState<T[]>([])

  const dataKey = useMemo(() => {
    if (!data || data.length === 0) {
      return 'empty'
    }

    return data.map(item => item.id).join(',')
  }, [data])

  useEffect(() => {
    if (!data || data.length === 0) {
      setTranslatedData([])
      return
    }

    let isCancelled = false

    const translateData = async () => {
      try {
        const translated = await ContentTranslationService.translateArray(
          entityType,
          data,
          fields,
          language,
        )

        if (!isCancelled) {
          setTranslatedData(translated)
        }
      } catch (error) {
        console.error('Error translating content:', error)
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
