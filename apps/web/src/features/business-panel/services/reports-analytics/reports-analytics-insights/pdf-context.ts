import type { jsPDF as JsPdfDocument } from 'jspdf'
import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'
import { formatDate } from './rows'

export type PdfReportContext = {
  colors: Record<'accent' | 'danger' | 'line' | 'muted' | 'primary' | 'surface' | 'text', readonly [number, number, number]>
  dataset: ReportsAnalyticsDataset
  insights: ReportsAnalyticsAiInsights
  labels: Record<string, string>
  locale: ReportsAnalyticsLocale
  page: { width: number; height: number; margin: number }
  pdf: JsPdfDocument
  y: number
}

export function createPdfReportContext(
  pdf: JsPdfDocument,
  dataset: ReportsAnalyticsDataset,
  insights: ReportsAnalyticsAiInsights,
  labels: Record<string, string>,
  locale: ReportsAnalyticsLocale,
): PdfReportContext {
  return {
    pdf,
    dataset,
    insights,
    labels,
    locale,
    page: { width: pdf.internal.pageSize.getWidth(), height: pdf.internal.pageSize.getHeight(), margin: 40 },
    colors: {
      primary: [10, 37, 64],
      accent: [0, 180, 150],
      text: [17, 24, 39],
      muted: [82, 94, 112],
      line: [220, 226, 235],
      surface: [247, 249, 252],
      danger: [239, 68, 68],
    },
    y: 0,
  }
}

export function addHeader(ctx: PdfReportContext, firstPage: boolean) {
  const { pdf, page, colors, labels, dataset, insights, locale } = ctx
  ctx.y = page.margin
  pdf.setFillColor(...colors.primary)
  pdf.roundedRect(page.margin, ctx.y, page.width - page.margin * 2, 92, 10, 10, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(firstPage ? 22 : 16)
  pdf.text(labels.title, page.margin + 24, ctx.y + 34)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`${labels.generatedAt}: ${new Date(insights.generatedAt).toLocaleString(locale)}`, page.margin + 24, ctx.y + 58)
  pdf.text(`${labels.period}: ${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`, page.margin + 24, ctx.y + 74)
  ctx.y += 118
}

export function ensureSpace(ctx: PdfReportContext, height: number) {
  if (ctx.y + height <= ctx.page.height - ctx.page.margin) return
  ctx.pdf.addPage()
  addHeader(ctx, false)
}
