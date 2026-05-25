
import { PDF_COLORS } from './export.colors'
import { clampRatio } from './export-utils'
import type { createPdfLayout } from './pdf-layout'

type PdfLayout = ReturnType<typeof createPdfLayout>
type PdfMetric = { label: string; value: string | number; detail?: string }

export function renderPdfMetricGrid(layout: PdfLayout, items: PdfMetric[]): void {
  const { page, pdf } = layout
  const gap = 12
  const columns = 2
  const cardWidth = (page.width - page.margin * 2 - gap) / columns
  const cardHeight = 66
  let y = layout.getY()

  items.forEach((item, index) => {
    const column = index % columns
    if (column === 0) {
      layout.ensureSpace(cardHeight + 10)
      y = layout.getY()
    }
    const x = page.margin + column * (cardWidth + gap)
    pdf.setFillColor(...PDF_COLORS.surface)
    pdf.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'F')
    pdf.setDrawColor(...PDF_COLORS.line)
    pdf.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'S')
    pdf.setTextColor(...PDF_COLORS.muted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(item.label, x + 12, y + 18)
    pdf.setTextColor(...PDF_COLORS.text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text(String(item.value), x + 12, y + 42)
    if (item.detail) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(...PDF_COLORS.muted)
      pdf.text(item.detail, x + 12, y + 56)
    }
    if (column === columns - 1 || index === items.length - 1) y += cardHeight + 10
  })
  layout.setY(y)
}

export function renderPdfProgressBar(layout: PdfLayout, label: string, value: number): void {
  const { page, pdf } = layout
  layout.ensureSpace(30)
  let y = layout.getY()
  const width = page.width - page.margin * 2
  pdf.setTextColor(...PDF_COLORS.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`${label}: ${value}%`, page.margin, y)
  y += 8
  pdf.setFillColor(...PDF_COLORS.line)
  pdf.roundedRect(page.margin, y, width, 7, 3, 3, 'F')
  pdf.setFillColor(...PDF_COLORS.accent)
  pdf.roundedRect(page.margin, y, width * clampRatio(value), 7, 3, 3, 'F')
  layout.setY(y + 18)
}
