
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportCopy, ExportRow } from './export.types'

export function buildExecutiveMetricRows(dataset: ReportsAnalyticsDataset, copy: ExportCopy): ExportRow[] {
  return [
    { metric: copy.metrics.totalUsers, value: dataset.overview.totalUsers, rawValue: dataset.overview.totalUsers, detail: `${copy.metrics.activeLearners}: ${dataset.overview.activeLearners} (${dataset.overview.activeLearnerRate}%)` },
    { metric: copy.metrics.averageProgress, value: `${dataset.overview.averageProgress}%`, rawValue: dataset.overview.averageProgress, detail: `${copy.metrics.completionRate}: ${dataset.overview.completionRate}%` },
    { metric: copy.metrics.sofliaAdoptionRate, value: `${dataset.overview.sofliaAdoptionRate}%`, rawValue: dataset.overview.sofliaAdoptionRate, detail: `${dataset.soflia.totalConversations} conversaciones, ${dataset.soflia.totalMessages} mensajes` },
    { metric: copy.metrics.notesAdoptionRate, value: `${dataset.overview.notesAdoptionRate}%`, rawValue: dataset.overview.notesAdoptionRate, detail: `${dataset.notes.totalNotes} notas` },
    { metric: copy.metrics.activityCompletionRate, value: `${dataset.activities.completionRate}%`, rawValue: dataset.activities.completionRate, detail: `${dataset.activities.completedActivities}/${dataset.activities.totalActivities}` },
    { metric: copy.metrics.quizAverageScore, value: `${dataset.activities.quizAverageScore}%`, rawValue: dataset.activities.quizAverageScore, detail: `${dataset.activities.quizAttempts} evaluaciones` },
    { metric: copy.metrics.plannerAdherenceRate, value: `${dataset.overview.plannerAdherenceRate}%`, rawValue: dataset.overview.plannerAdherenceRate, detail: `${dataset.planner.completedSessions}/${dataset.planner.plannedSessions}` },
    { metric: copy.metrics.qualityScore, value: `${dataset.overview.qualityScore}%`, rawValue: dataset.overview.qualityScore, detail: `${dataset.quality.evidenceCount} evidencias` },
  ]
}
