import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'
import { addHeader, createPdfReportContext } from './pdf-context'
import { INSIGHTS_PDF_LABELS } from './pdf-labels'
import { addMetricCards, addCompactTable } from './pdf-tables'
import { addBulletList, addCallout, addHeading } from './pdf-text'
import { addRiskSections } from './pdf-risk-sections'
import { buildInsightHierarchyRows, buildInsightSegmentRows } from './rows'

export async function generateReportsAnalyticsInsightsPdf({
  dataset,
  insights,
  locale,
}: {
  dataset: ReportsAnalyticsDataset
  insights: ReportsAnalyticsAiInsights
  locale: ReportsAnalyticsLocale
}): Promise<Uint8Array> {
  const JsPDF = (await import('jspdf')).default
  const pdf = new JsPDF('p', 'pt', 'a4')
  const labels = INSIGHTS_PDF_LABELS[locale] || INSIGHTS_PDF_LABELS.es
  const ctx = createPdfReportContext(pdf, dataset, insights, labels, locale)

  addHeader(ctx, true)
  addCallout(ctx, insights.summary)
  addExecutiveMetrics(ctx, dataset, insights, labels)
  addOperationalSnapshot(ctx, dataset, labels)
  addFindingSections(ctx, insights, labels)
  addSegmentTables(ctx, dataset, labels)
  addRiskSections(ctx, insights, labels)

  return new Uint8Array(pdf.output('arraybuffer'))
}

function addExecutiveMetrics(
  ctx: ReturnType<typeof createPdfReportContext>,
  dataset: ReportsAnalyticsDataset,
  insights: ReportsAnalyticsAiInsights,
  labels: Record<string, string>,
) {
  addHeading(ctx, labels.executiveMetrics, 14)
  if (insights.executiveMetrics?.length) {
    addMetricCards(ctx, insights.executiveMetrics.slice(0, 6).map((metric) => ({
      label: metric.label,
      value: metric.value,
      detail: metric.detail,
    })))
    return
  }

  addMetricCards(ctx, [
    { label: labels.progress, value: `${dataset.overview.averageProgress}%`, detail: `${labels.completion}: ${dataset.overview.completionRate}%` },
    { label: labels.soflia, value: `${dataset.overview.sofliaAdoptionRate}%`, detail: `${dataset.soflia.totalConversations} ${labels.conversations}` },
    { label: labels.quality, value: `${dataset.quality.overallScore}%` },
    { label: labels.activities, value: dataset.activities.totalActivities, detail: `${dataset.activities.quizAttempts} evaluaciones` },
  ])
}

function addOperationalSnapshot(
  ctx: ReturnType<typeof createPdfReportContext>,
  dataset: ReportsAnalyticsDataset,
  labels: Record<string, string>,
) {
  addHeading(ctx, labels.operationalSnapshot, 14)
  addMetricCards(ctx, [
    { label: labels.users, value: dataset.overview.totalUsers, detail: `${labels.activeUsers}: ${dataset.overview.activeLearners} (${dataset.overview.activeLearnerRate}%)` },
    { label: labels.learning, value: `${dataset.learning.completedCourses}/${dataset.learning.assignedCourses}`, detail: `${labels.averageCompletionDays}: ${dataset.learning.averageCompletionDays}` },
    { label: labels.notes, value: `${dataset.overview.notesAdoptionRate}%`, detail: `${dataset.notes.totalNotes} ${labels.notesCreated}` },
    { label: labels.planner, value: `${dataset.overview.plannerAdherenceRate}%`, detail: `${dataset.planner.completedSessions}/${dataset.planner.plannedSessions}` },
  ])
}

function addFindingSections(
  ctx: ReturnType<typeof createPdfReportContext>,
  insights: ReportsAnalyticsAiInsights,
  labels: Record<string, string>,
) {
  addHeading(ctx, labels.findings, 14)
  insights.findings.forEach((section) => {
    addHeading(ctx, section.title, 12)
    addBulletList(ctx, section.points)
  })
}

function addSegmentTables(
  ctx: ReturnType<typeof createPdfReportContext>,
  dataset: ReportsAnalyticsDataset,
  labels: Record<string, string>,
) {
  addHeading(ctx, labels.segments, 14)
  addCompactTable(ctx, [labels.segment, labels.users, labels.progress, labels.quality], buildInsightSegmentRows(dataset, labels).slice(0, 8).map((segment) => [segment.label, String(segment.users), `${segment.averageProgress}%`, `${segment.qualityScore}%`]), [220, 70, 90, 90])
  addHeading(ctx, labels.hierarchy, 14)
  addCompactTable(ctx, [labels.rank, labels.name, labels.progress, labels.quality, 'Score'], buildInsightHierarchyRows(dataset).slice(0, 8).map((row, index) => [String(index + 1), row.name, `${row.averageProgress}%`, `${row.qualityScore}%`, `${row.rankScore}%`]), [42, 210, 82, 82, 62])
  addHeading(ctx, labels.courseRisks, 14)
  addCompactTable(ctx, [labels.course, labels.progress, labels.completed, labels.overdue], dataset.courses.slice(0, 8).map((course) => [course.courseTitle, `${course.averageProgress}%`, `${course.completedUsers}/${course.assignedUsers}`, String(course.overdueAssignments)]), [260, 82, 82, 62])
}
