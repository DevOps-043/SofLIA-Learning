import type { ReportsAnalyticsLocale } from '../../../../types/reports-analytics.types'
import type { BlueprintCopy } from '../types'
import { enBlueprintCopy } from './en'
import { esBlueprintCopy } from './es'
import { ptBlueprintCopy } from './pt'

const BLUEPRINT_COPY: Record<ReportsAnalyticsLocale, BlueprintCopy> = {
  es: esBlueprintCopy,
  en: enBlueprintCopy,
  pt: ptBlueprintCopy,
}

export function getBlueprintCopy(locale: ReportsAnalyticsLocale): BlueprintCopy {
  return BLUEPRINT_COPY[locale] || BLUEPRINT_COPY.es
}
