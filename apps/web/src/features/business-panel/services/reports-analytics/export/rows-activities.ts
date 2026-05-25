
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportCopy, ExportRow } from './export.types'
import { withCategory } from './rows-segments'

export function buildActivitiesRows(dataset: ReportsAnalyticsDataset, copy: ExportCopy): ExportRow[] {
  return [
    { metric: copy.metrics.totalActivities, value: dataset.activities.totalActivities, detail: '' },
    { metric: copy.metrics.completedActivities, value: dataset.activities.completedActivities, detail: `${dataset.activities.completionRate}%` },
    { metric: copy.metrics.totalEvaluations, value: dataset.activities.totalEvaluations, detail: `${copy.metrics.quizAverageScore}: ${dataset.activities.quizAverageScore}%` },
    { metric: copy.metrics.evaluationCompletionRate, value: `${dataset.activities.evaluationCompletionRate}%`, detail: '' },
    { metric: copy.metrics.averageAttempts, value: dataset.activities.averageAttempts, detail: '' },
    { metric: copy.metrics.averageTimeMinutes, value: dataset.activities.averageTimeMinutes, detail: '' },
    { metric: copy.metrics.usersNeedingHelp, value: dataset.activities.usersNeedingHelp, detail: '' },
    { metric: copy.metrics.redirects, value: dataset.activities.redirects, detail: '' },
    ...withCategory('Tipo de actividad', dataset.activities.byType, copy).map((row) => ({
      metric: row.label,
      value: row.value,
      detail: `${row.percentage}%`,
    })),
  ]
}

export function buildQualityRows(dataset: ReportsAnalyticsDataset, copy: ExportCopy): ExportRow[] {
  return [
    { metric: copy.metrics.qualityScore, value: `${dataset.quality.overallScore}%`, detail: `${dataset.quality.evidenceCount} evidencias` },
    { metric: 'Calidad de evaluaciones', value: `${dataset.quality.quizScore}%`, detail: `${dataset.quality.quizPassRate}% aprobacion` },
    { metric: 'Calidad de actividades', value: `${dataset.quality.activityScore}%`, detail: `${dataset.quality.activityCompletionRate}% completadas` },
    { metric: 'Calidad SofLIA', value: `${dataset.quality.sofliaScore}%`, detail: `${dataset.quality.questionRate}% preguntas` },
    { metric: 'Calidad de notas', value: `${dataset.quality.notesScore}%`, detail: '' },
    { metric: 'Ayuda requerida', value: `${dataset.quality.helpRate}%`, detail: '' },
    { metric: 'Fuera de tema', value: `${dataset.quality.offTopicRate}%`, detail: '' },
    { metric: 'Tiempo promedio de respuesta', value: `${dataset.quality.averageResponseTimeSeconds}s`, detail: '' },
  ]
}
