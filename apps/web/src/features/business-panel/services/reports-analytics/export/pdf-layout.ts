
import type { jsPDF } from 'jspdf'
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'
import { PDF_COLORS } from './export.colors'
import type { ExportCopy } from './export.types'
import { formatDate } from './export-utils'

export function createPdfLayout(
  pdf: jsPDF,
  dataset: ReportsAnalyticsDataset,
  copy: ExportCopy,
  locale: ReportsAnalyticsLocale,
) {
  const page = {
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    margin: 40,
  }
  let y = 0

  const addHeader = (firstPage: boolean) => {
    y = page.margin
    pdf.setFillColor(...PDF_COLORS.primary)
    pdf.roundedRect(page.margin, y, page.width - page.margin * 2, 86, 10, 10, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(firstPage ? 22 : 16)
    pdf.text(copy.title, page.margin + 24, y + 34)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(
      `${copy.generatedAt}: ${new Date(dataset.generatedAt).toLocaleString(locale)}`,
      page.margin + 24,
      y + 56,
    )
    pdf.text(
      `${copy.period}: ${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`,
      page.margin + 24,
      y + 72,
    )
    y += 112
  }

  const ensureSpace = (height: number) => {
    if (y + height <= page.height - page.margin) return
    pdf.addPage()
    addHeader(false)
  }

  const section = (title: string) => {
    ensureSpace(34)
    pdf.setTextColor(...PDF_COLORS.text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.text(title, page.margin, y)
    y += 22
  }

  const paragraph = (text: string) => {
    pdf.setTextColor(...PDF_COLORS.muted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.splitTextToSize(text, page.width - page.margin * 2).forEach((line: string) => {
      ensureSpace(15)
      pdf.text(line, page.margin, y)
      y += 14
    })
    y += 8
  }

  return { pdf, page, addHeader, ensureSpace, section, paragraph, getY: () => y, setY: (nextY: number) => { y = nextY } }
}
