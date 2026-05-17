
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { getExportCopy } from './export-copy'
import { buildExecutiveMetricRows } from './rows-summary'

export function resolveExportBlueprint(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  blueprint?: ReportsAnalyticsReportBlueprint,
): ReportsAnalyticsReportBlueprint {
  if (blueprint) return blueprint
  return {
    generatedAt: new Date().toISOString(),
    model: 'deterministic:fallback',
    source: 'fallback',
    summary: `${getExportCopy(locale).summary}: ${getExportCopy(locale).metrics.averageProgress} ${dataset.overview.averageProgress}%`,
    sections: [
      { id: 'executive', title: 'Resumen SofLIA', purpose: 'Resumen ejecutivo', priority: 1 },
      { id: 'dashboard', title: getExportCopy(locale).dashboard, purpose: 'Indicadores clave', priority: 2 },
      { id: 'trends', title: getExportCopy(locale).trends, purpose: 'Tendencias', priority: 3 },
      { id: 'courses', title: getExportCopy(locale).courses, purpose: 'Cursos', priority: 4 },
      { id: 'users', title: getExportCopy(locale).users, purpose: 'Usuarios', priority: 5 },
      { id: 'segments', title: getExportCopy(locale).segments, purpose: 'Segmentos', priority: 6 },
      { id: 'quality', title: getExportCopy(locale).quality, purpose: 'Calidad', priority: 7 },
      { id: 'rawData', title: 'Datos crudos', purpose: 'Datos base', priority: 8 },
    ],
    featuredMetrics: buildExecutiveMetricRows(dataset, getExportCopy(locale)).slice(0, 4).map((row) => ({
      label: String(row.metric || ''),
      value: String(row.value || ''),
      detail: String(row.detail || ''),
    })),
    findings: [],
    risks: [],
    recommendations: [],
    artifactPlan: [],
  }
}
