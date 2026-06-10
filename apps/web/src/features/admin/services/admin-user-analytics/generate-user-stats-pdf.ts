import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'
import {
  renderPdfMetricGrid,
  renderPdfProgressBar,
} from '@/features/business-panel/services/reports-analytics/export/pdf-metrics'
import { renderPdfTable } from '@/features/business-panel/services/reports-analytics/export/pdf-table'
import { createUserStatsPdfLayout } from './user-stats-pdf-layout'
import { getUserStatsPdfCopy } from './user-stats-pdf-copy'

export interface GenerateUserStatsPdfOptions {
  userLabel: string
  organizationLabel?: string | null
  locale: BusinessUserAnalyticsLocale
  insights?: BusinessUserAnalyticsInsights | null
}

const COURSE_TABLE_WIDTHS = [230, 70, 70, 80, 65]
const MAX_COURSE_ROWS = 12
const MAX_INSIGHT_ITEMS = 6

function roundNumber(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 10) / 10
}

function localeTag(locale: BusinessUserAnalyticsLocale): string {
  return locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES'
}

/**
 * Genera un PDF branded SofLIA con las estadísticas completas de un usuario,
 * reutilizando las primitivas de render jsPDF de reports-analytics.
 */
export async function generateUserStatsPdf(
  response: BusinessUserAnalyticsResponse,
  options: GenerateUserStatsPdfOptions,
): Promise<Blob> {
  const { locale } = options
  const copy = getUserStatsPdfCopy(locale)
  const tag = localeTag(locale)
  const JsPDF = (await import('jspdf')).default
  const pdf = new JsPDF('p', 'pt', 'a4')

  const subtitleParts = [options.userLabel]
  if (options.organizationLabel) {
    subtitleParts.push(`${copy.organization}: ${options.organizationLabel}`)
  }

  const layout = createUserStatsPdfLayout(pdf, {
    title: copy.title,
    subtitle: subtitleParts.join('   ·   '),
    generatedAtLabel: copy.generatedAt,
    generatedAtValue: new Date(response.generatedAt).toLocaleString(tag),
    periodLabel: copy.period,
    periodValue: `${new Date(response.period.from).toLocaleDateString(tag)} - ${new Date(
      response.period.to,
    ).toLocaleDateString(tag)}`,
  })

  layout.addHeader(true)

  // ----- Resumen general -----
  layout.section(copy.sections.overview)
  renderPdfMetricGrid(layout, [
    {
      label: copy.metrics.averageProgress,
      value: `${roundNumber(response.overview.averageProgress)}%`,
      detail: copy.values.coursesAssigned(
        response.overview.completedCourses,
        response.overview.totalAssigned,
      ),
    },
    {
      label: copy.metrics.aiAdoption,
      value: `${roundNumber(response.aiAdoption.adoptionScore)}%`,
      detail: copy.values.conversations(
        response.aiAdoption.totalConversations,
        response.aiAdoption.totalMessages,
      ),
    },
    {
      label: copy.metrics.quality,
      value: `${roundNumber(response.quality.overallScore)}%`,
      detail: copy.values.signals(response.quality.evidenceCount),
    },
    {
      label: copy.metrics.lessonsCompleted,
      value: response.overview.lessonsCompleted,
      detail: `${copy.metrics.timeSpent}: ${copy.values.minutes(
        Math.round(response.overview.timeSpentMinutes),
      )}`,
    },
    {
      label: copy.metrics.certificates,
      value: response.overview.certificates,
    },
    {
      label: copy.metrics.currentStreak,
      value: copy.values.days(response.overview.currentStreak),
    },
  ])

  // ----- Indicadores de progreso -----
  layout.section(copy.sections.progress)
  renderPdfProgressBar(layout, copy.metrics.averageProgress, roundNumber(response.overview.averageProgress))
  renderPdfProgressBar(layout, copy.metrics.completionRate, roundNumber(response.overview.completionRate))
  renderPdfProgressBar(layout, copy.metrics.aiAdoption, roundNumber(response.aiAdoption.adoptionScore))
  renderPdfProgressBar(layout, copy.metrics.quality, roundNumber(response.quality.overallScore))

  // ----- Avance por curso -----
  if (response.learning.courses.length > 0) {
    layout.section(copy.sections.courses)
    const rows = response.learning.courses
      .slice()
      .sort((a, b) => b.progress - a.progress)
      .slice(0, MAX_COURSE_ROWS)
      .map((course) => [
        course.courseTitle,
        `${roundNumber(course.progress)}%`,
        String(course.lessonsCompleted),
        String(Math.round(course.timeSpentMinutes)),
        course.status,
      ])
    renderPdfTable(
      layout,
      [copy.columns.course, copy.columns.progress, copy.columns.lessons, copy.columns.time, copy.columns.status],
      rows,
      COURSE_TABLE_WIDTHS,
    )
  }

  // ----- Adopción de SofLIA -----
  layout.section(copy.sections.ai)
  renderPdfMetricGrid(layout, [
    { label: copy.metrics.questionRate, value: `${roundNumber(response.aiAdoption.questionRate)}%` },
    { label: copy.metrics.questionQuality, value: `${roundNumber(response.aiAdoption.questionQualityScore)}%` },
    { label: copy.metrics.offTopic, value: `${roundNumber(response.aiAdoption.offTopicRate)}%` },
    {
      label: copy.metrics.responseTime,
      value: copy.values.seconds(roundNumber(response.aiAdoption.averageResponseTimeSeconds)),
    },
  ])

  // ----- Calidad del aprendizaje (radar) -----
  if (response.quality.radar.length > 0) {
    layout.section(copy.sections.quality)
    response.quality.radar.forEach((item) => {
      renderPdfProgressBar(layout, item.label, roundNumber(item.value))
    })
  }

  // ----- Notas, actividades y evaluaciones -----
  layout.section(copy.sections.engagement)
  renderPdfMetricGrid(layout, [
    { label: copy.metrics.notes, value: response.notes.totalNotes },
    { label: copy.metrics.notesAdoption, value: `${roundNumber(response.notes.adoptionRate)}%` },
    { label: copy.metrics.activities, value: response.activities.totalSubmissions },
    { label: copy.metrics.activitiesPassRate, value: `${roundNumber(response.activities.passRate)}%` },
    { label: copy.metrics.quizzes, value: response.quizzes.attempts },
    { label: copy.metrics.quizzesAverage, value: `${roundNumber(response.quizzes.averageScore)}%` },
  ])

  // ----- Feedback de SofLIA (opcional) -----
  if (options.insights && !options.insights.unavailable) {
    const insights = options.insights
    layout.section(copy.sections.insights)
    if (insights.summary) {
      layout.paragraph(insights.summary)
    }
    renderInsightList(layout, copy.insights.strengths, insights.strengths)
    renderInsightList(layout, copy.insights.opportunities, insights.opportunities)
    renderInsightList(layout, copy.insights.recommendations, insights.recommendations)
  }

  return pdf.output('blob')
}

function renderInsightList(
  layout: ReturnType<typeof createUserStatsPdfLayout>,
  title: string,
  items: string[],
): void {
  if (!items || items.length === 0) return
  layout.section(title)
  items.slice(0, MAX_INSIGHT_ITEMS).forEach((item) => {
    layout.paragraph(`•  ${item}`)
  })
}
