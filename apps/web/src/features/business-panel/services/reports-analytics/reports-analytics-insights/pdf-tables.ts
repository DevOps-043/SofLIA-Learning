import { ensureSpace, type PdfReportContext } from './pdf-context'

export function addMetricCards(
  ctx: PdfReportContext,
  items: Array<{ label: string; value: string | number; detail?: string }>,
) {
  const { pdf, colors, page } = ctx
  const gap = 12
  const cardWidth = (page.width - page.margin * 2 - gap) / 2
  const cardHeight = 70
  items.forEach((item, index) => {
    const column = index % 2
    if (column === 0) ensureSpace(ctx, cardHeight + 10)
    const x = page.margin + column * (cardWidth + gap)
    const cardY = ctx.y
    pdf.setFillColor(...colors.surface)
    pdf.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, 'F')
    pdf.setDrawColor(...colors.line)
    pdf.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, 'S')
    pdf.setTextColor(...colors.muted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(item.label, x + 12, cardY + 18)
    pdf.setTextColor(...colors.text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(17)
    pdf.text(String(item.value), x + 12, cardY + 42)
    if (item.detail) addMetricCardDetail(ctx, item.detail, x, cardY, cardWidth)
    if (column === 1 || index === items.length - 1) ctx.y += cardHeight + 10
  })
}

function addMetricCardDetail(ctx: PdfReportContext, detail: string, x: number, cardY: number, cardWidth: number) {
  ctx.pdf.setTextColor(...ctx.colors.muted)
  ctx.pdf.setFont('helvetica', 'normal')
  ctx.pdf.setFontSize(8)
  ctx.pdf.text(ctx.pdf.splitTextToSize(detail, cardWidth - 24)[0] || '', x + 12, cardY + 57)
}

export function addCompactTable(
  ctx: PdfReportContext,
  headers: string[],
  rows: string[][],
  widths: number[],
) {
  const { pdf, colors, page } = ctx
  const rowHeight = 22
  ensureSpace(ctx, (rows.length + 2) * rowHeight)
  pdf.setFillColor(...colors.primary)
  pdf.rect(page.margin, ctx.y, page.width - page.margin * 2, rowHeight, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  let x = page.margin + 8
  headers.forEach((header, index) => {
    pdf.text(header, x, ctx.y + 14)
    x += widths[index]
  })
  ctx.y += rowHeight
  rows.forEach((row, rowIndex) => addCompactTableRow(ctx, row, rowIndex, widths, rowHeight))
  ctx.y += 10
}

function addCompactTableRow(
  ctx: PdfReportContext,
  row: string[],
  rowIndex: number,
  widths: number[],
  rowHeight: number,
) {
  const { pdf, colors, page } = ctx
  ensureSpace(ctx, rowHeight)
  if (rowIndex % 2 === 0) {
    pdf.setFillColor(...colors.surface)
    pdf.rect(page.margin, ctx.y, page.width - page.margin * 2, rowHeight, 'F')
  }
  pdf.setTextColor(...colors.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  let x = page.margin + 8
  row.forEach((cell, index) => {
    pdf.text(pdf.splitTextToSize(cell, widths[index] - 10)[0] || '', x, ctx.y + 14)
    x += widths[index]
  })
  ctx.y += rowHeight
}
