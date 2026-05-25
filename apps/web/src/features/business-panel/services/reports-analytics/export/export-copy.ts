
import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'
import esCopy from './copy/export-copy.es.json'
import enCopy from './copy/export-copy.en.json'
import ptCopy from './copy/export-copy.pt.json'
import type { ExportCopy } from './export.types'

const EXPORT_COPY = {
  es: esCopy,
  en: enCopy,
  pt: ptCopy,
} as Record<ReportsAnalyticsLocale, ExportCopy>

export function getExportCopy(locale: ReportsAnalyticsLocale): ExportCopy {
  const fallback = EXPORT_COPY.es
  const selected = EXPORT_COPY[locale] || fallback
  return {
    ...fallback,
    ...selected,
    files: { ...fallback.files, ...selected.files },
    metrics: { ...fallback.metrics, ...selected.metrics },
    columns: { ...fallback.columns, ...selected.columns },
    dimensions: {
      gender: { ...fallback.dimensions.gender, ...selected.dimensions.gender },
      progress: { ...fallback.dimensions.progress, ...selected.dimensions.progress },
      age: { ...fallback.dimensions.age, ...selected.dimensions.age },
      source: { ...fallback.dimensions.source, ...selected.dimensions.source },
    },
  }
}
