
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { getExportCopy } from './export-copy'
import { resolveExportBlueprint } from './export-blueprint'
import { renderPdfMetricGrid, renderPdfProgressBar } from './pdf-metrics'
import { renderPdfTable } from './pdf-table'
import { createPdfLayout } from './pdf-layout'
import { buildSegmentRows } from './rows-segments'

export async function generateReportsAnalyticsPdf(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  blueprint?: ReportsAnalyticsReportBlueprint,
): Promise<Uint8Array> {
  const JsPDF = (await import('jspdf')).default
  const pdf = new JsPDF('p', 'pt', 'a4')
  const copy = getExportCopy(locale)
  const reportBlueprint = resolveExportBlueprint(dataset, locale, blueprint)
  const layout = createPdfLayout(pdf, dataset, copy, locale)

  layout.addHeader(true)
  layout.section(copy.summary)
  layout.paragraph(reportBlueprint.summary)
  renderPdfMetricGrid(layout, [
    { label: copy.metrics.totalUsers, value: dataset.overview.totalUsers, detail: `${copy.metrics.activeLearners}: ${dataset.overview.activeLearners}` },
    { label: copy.metrics.averageProgress, value: `${dataset.overview.averageProgress}%`, detail: `${copy.metrics.completionRate}: ${dataset.overview.completionRate}%` },
    { label: copy.metrics.sofliaAdoptionRate, value: `${dataset.overview.sofliaAdoptionRate}%`, detail: `${dataset.soflia.totalConversations} conversaciones` },
    { label: copy.metrics.qualityScore, value: `${dataset.overview.qualityScore}%`, detail: `${dataset.activities.quizAttempts} evaluaciones` },
  ])

  layout.section(copy.trends)
  renderPdfProgressBar(layout, copy.metrics.averageProgress, dataset.overview.averageProgress)
  renderPdfProgressBar(layout, copy.metrics.completionRate, dataset.overview.completionRate)
  renderPdfProgressBar(layout, copy.metrics.activityCompletionRate, dataset.activities.completionRate)
  renderPdfProgressBar(layout, copy.metrics.plannerAdherenceRate, dataset.overview.plannerAdherenceRate)

  layout.section(copy.activities)
  renderPdfMetricGrid(layout, [
    { label: copy.metrics.totalActivities, value: dataset.activities.totalActivities },
    { label: copy.metrics.completedActivities, value: dataset.activities.completedActivities },
    { label: copy.metrics.totalEvaluations, value: dataset.activities.totalEvaluations },
    { label: copy.metrics.quizAverageScore, value: `${dataset.activities.quizAverageScore}%` },
  ])

  layout.section(copy.courses)
  renderPdfTable(layout, [copy.columns.course, copy.columns.assigned, copy.columns.active, copy.columns.completed, copy.columns.progress, copy.columns.overdue], dataset.courses.slice(0, 10).map((course) => [
    course.courseTitle,
    String(course.assignedUsers),
    String(course.activeLearners),
    String(course.completedUsers),
    `${course.averageProgress}%`,
    String(course.overdueAssignments),
  ]), [190, 58, 52, 64, 64, 58])

  layout.section(copy.segments)
  renderPdfTable(layout, [copy.columns.segmentType, copy.columns.label, copy.columns.user, copy.columns.progress, copy.columns.quality], buildSegmentRows(dataset, copy).slice(0, 12).map((row) => [
    String(row.segmentType),
    String(row.label),
    String(row.users),
    `${row.averageProgress}%`,
    `${row.qualityScore}%`,
  ]), [86, 180, 60, 76, 76])

  layout.section(copy.dataQuality)
  renderPdfMetricGrid(layout, [
    { label: 'Demografia completa', value: `${dataset.dataQuality.demographicsCompletionRate}%` },
    { label: 'Usuarios completos', value: dataset.dataQuality.usersWithCompleteDemographics },
    { label: 'Usuarios incompletos', value: dataset.dataQuality.usersMissingDemographics },
    { label: 'Evidencias analizadas', value: dataset.quality.evidenceCount },
  ])

  return new Uint8Array(pdf.output('arraybuffer'))
}
