
import { PDF_COLORS } from './export.colors'
import type { createPdfLayout } from './pdf-layout'

type PdfLayout = ReturnType<typeof createPdfLayout>

export function renderPdfTable(
  layout: PdfLayout,
  headers: string[],
  rows: string[][],
  widths: number[],
): void {
  const { page, pdf } = layout
  const rowHeight = 22
  layout.ensureSpace(rowHeight * (rows.length + 2))
  let y = layout.getY()
  pdf.setFillColor(...PDF_COLORS.primary)
  pdf.rect(page.margin, y, page.width - page.margin * 2, rowHeight, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  let x = page.margin + 8
  headers.forEach((header, index) => {
    pdf.text(header, x, y + 14)
    x += widths[index]
  })
  y += rowHeight

  rows.forEach((row, rowIndex) => {
    layout.setY(y)
    layout.ensureSpace(rowHeight)
    y = layout.getY()
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(...PDF_COLORS.surface)
      pdf.rect(page.margin, y, page.width - page.margin * 2, rowHeight, 'F')
    }
    pdf.setTextColor(...PDF_COLORS.text)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    x = page.margin + 8
    row.forEach((cell, index) => {
      const text = pdf.splitTextToSize(String(cell), widths[index] - 10)[0] || ''
      pdf.text(text, x, y + 14)
      x += widths[index]
    })
    y += rowHeight
  })
  layout.setY(y + 10)
}
