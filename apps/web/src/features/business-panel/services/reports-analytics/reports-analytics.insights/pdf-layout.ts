import type { InsightsPdfContext, InsightsPdfHeaderData } from './pdf-context'

export function ensureSpace(ctx: InsightsPdfContext, height: number, header: InsightsPdfHeaderData) {
  if (ctx.y + height <= ctx.page.height - ctx.page.margin) return
  ctx.pdf.addPage()
  addHeader(ctx, false, header)
}

export function addHeader(ctx: InsightsPdfContext, firstPage: boolean, header: InsightsPdfHeaderData) {
  const { pdf, colors, labels, page } = ctx
  ctx.y = page.margin
  pdf.setFillColor(...colors.primary)
  pdf.roundedRect(page.margin, ctx.y, page.width - page.margin * 2, 92, 10, 10, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(firstPage ? 22 : 16)
  pdf.text(labels.title, page.margin + 24, ctx.y + 34)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(labels.generatedAt + ': ' + new Date(header.generatedAt).toLocaleString(header.locale), page.margin + 24, ctx.y + 58)
  pdf.text(header.periodLabel + ': ' + header.periodRange, page.margin + 24, ctx.y + 74)
  ctx.y += 118
}

export function addHeading(ctx: InsightsPdfContext, text: string, size: number, header: InsightsPdfHeaderData) {
  ensureSpace(ctx, size + 24, header)
  ctx.pdf.setTextColor(...ctx.colors.text)
  ctx.pdf.setFont('helvetica', 'bold')
  ctx.pdf.setFontSize(size)
  ctx.pdf.text(text, ctx.page.margin, ctx.y)
  ctx.y += size + 10
}

export function addCallout(ctx: InsightsPdfContext, text: string, header: InsightsPdfHeaderData) {
  const { pdf, colors, page } = ctx
  ensureSpace(ctx, 74, header)
  pdf.setFillColor(...colors.surface)
  pdf.roundedRect(page.margin, ctx.y, page.width - page.margin * 2, 64, 8, 8, 'F')
  pdf.setDrawColor(...colors.accent)
  pdf.setLineWidth(2)
  pdf.line(page.margin + 1, ctx.y + 10, page.margin + 1, ctx.y + 54)
  pdf.setLineWidth(1)
  pdf.setTextColor(...colors.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.splitTextToSize(text, page.width - page.margin * 2 - 28).slice(0, 3).forEach((line: string, index: number) => {
    pdf.text(line, page.margin + 16, ctx.y + 22 + index * 14)
  })
  ctx.y += 78
}
