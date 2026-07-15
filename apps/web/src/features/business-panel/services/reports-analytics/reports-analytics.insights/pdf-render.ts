import type { ReportsAnalyticsAiInsights, ReportsAnalyticsDataset, ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'
import { buildInsightHierarchyRows, buildInsightSegmentRows, formatReportsAnalyticsDate } from '../reports-analytics.insights.rows'
import { addBulletList, addCompactTable, addMetricCards } from './pdf-blocks'
import { createInsightsPdfContext } from './pdf-context'
import { INSIGHTS_PDF_LABELS } from './pdf-labels'
import { addCallout, addHeader, addHeading } from './pdf-layout'

export async function generateReportsAnalyticsInsightsPdf(input: {
  dataset: ReportsAnalyticsDataset
  insights: ReportsAnalyticsAiInsights
  locale: ReportsAnalyticsLocale
}): Promise<Uint8Array> {
  const JsPDF = (await import('jspdf')).default
  const pdf = new JsPDF('p', 'pt', 'a4')
  const labels = INSIGHTS_PDF_LABELS[input.locale] || INSIGHTS_PDF_LABELS.es
  const ctx = createInsightsPdfContext(pdf, labels)
  const header = {
    generatedAt: input.insights.generatedAt,
    locale: input.locale,
    periodLabel: labels.period,
    periodRange: formatReportsAnalyticsDate(input.dataset.period.from, input.locale) + ' - ' + formatReportsAnalyticsDate(input.dataset.period.to, input.locale),
  }

  addHeader(ctx, true, header)
  addCallout(ctx, input.insights.summary, header)
  addExecutiveMetrics(ctx, input.dataset, input.insights, labels, header)
  addOperationalSnapshot(ctx, input.dataset, labels, header)
  addFindingSections(ctx, input.insights, labels, header)
  addDatasetTables(ctx, input.dataset, labels, header)
  addHeading(ctx, labels.risks, 14, header)
  addBulletList(ctx, input.insights.risks, header)
  addHeading(ctx, labels.recommendations, 14, header)
  addBulletList(ctx, input.insights.recommendations, header)
  addActionPlan(ctx, input.insights, labels, header)
  return new Uint8Array(pdf.output('arraybuffer'))
}

function addExecutiveMetrics(ctx: ReturnType<typeof createInsightsPdfContext>, dataset: ReportsAnalyticsDataset, insights: ReportsAnalyticsAiInsights, labels: Record<string, string>, header: Parameters<typeof addHeading>[3]) {
  addHeading(ctx, labels.executiveMetrics, 14, header)
  if (insights.executiveMetrics?.length) {
    addMetricCards(ctx, insights.executiveMetrics.slice(0, 6), header)
    return
  }
  addMetricCards(ctx, [
    { label: labels.progress, value: dataset.overview.averageProgress + '%', detail: labels.completion + ': ' + dataset.overview.completionRate + '%' },
    { label: labels.soflia, value: dataset.overview.sofliaAdoptionRate + '%', detail: dataset.soflia.totalConversations + ' ' + labels.conversations },
    { label: labels.quality, value: dataset.quality.overallScore + '%' },
    { label: labels.activities, value: dataset.activities.totalActivities, detail: dataset.activities.quizAttempts + ' evaluaciones' },
  ], header)
}

function addOperationalSnapshot(ctx: ReturnType<typeof createInsightsPdfContext>, dataset: ReportsAnalyticsDataset, labels: Record<string, string>, header: Parameters<typeof addHeading>[3]) {
  addHeading(ctx, labels.operationalSnapshot, 14, header)
  addMetricCards(ctx, [
    { label: labels.users, value: dataset.overview.totalUsers, detail: labels.activeUsers + ': ' + dataset.overview.activeLearners + ' (' + dataset.overview.activeLearnerRate + '%)' },
    { label: labels.learning, value: dataset.learning.completedCourses + '/' + dataset.learning.assignedCourses, detail: labels.averageCompletionDays + ': ' + dataset.learning.averageCompletionDays },
    { label: labels.notes, value: dataset.overview.notesAdoptionRate + '%', detail: dataset.notes.totalNotes + ' ' + labels.notesCreated },
  ], header)
}

function addFindingSections(ctx: ReturnType<typeof createInsightsPdfContext>, insights: ReportsAnalyticsAiInsights, labels: Record<string, string>, header: Parameters<typeof addHeading>[3]) {
  addHeading(ctx, labels.findings, 14, header)
  insights.findings.forEach((section) => { addHeading(ctx, section.title, 12, header); addBulletList(ctx, section.points, header) })
}

function addDatasetTables(ctx: ReturnType<typeof createInsightsPdfContext>, dataset: ReportsAnalyticsDataset, labels: Record<string, string>, header: Parameters<typeof addHeading>[3]) {
  addHeading(ctx, labels.segments, 14, header)
  addCompactTable(ctx, [labels.segment, labels.users, labels.progress, labels.quality], buildInsightSegmentRows(dataset, labels).slice(0, 8).map((segment) => [segment.label, String(segment.users), segment.averageProgress + '%', segment.qualityScore + '%']), [220, 70, 90, 90], header)
  addHeading(ctx, labels.hierarchy, 14, header)
  addCompactTable(ctx, [labels.rank, labels.name, labels.progress, labels.quality, 'Score'], buildInsightHierarchyRows(dataset).slice(0, 8).map((row, index) => [String(index + 1), row.name, row.averageProgress + '%', row.qualityScore + '%', row.rankScore + '%']), [42, 210, 82, 82, 62], header)
  addHeading(ctx, labels.courseRisks, 14, header)
  addCompactTable(ctx, [labels.course, labels.progress, labels.completed, labels.overdue], dataset.courses.slice(0, 8).map((course) => [course.courseTitle, course.averageProgress + '%', course.completedUsers + '/' + course.assignedUsers, String(course.overdueAssignments)]), [260, 82, 82, 62], header)
}

function addActionPlan(ctx: ReturnType<typeof createInsightsPdfContext>, insights: ReportsAnalyticsAiInsights, labels: Record<string, string>, header: Parameters<typeof addHeading>[3]) {
  if (!insights.actionPlan?.length) return
  addHeading(ctx, labels.actionPlan, 14, header)
  insights.actionPlan.forEach((section) => { addHeading(ctx, section.title, 12, header); addBulletList(ctx, section.points, header) })
}
