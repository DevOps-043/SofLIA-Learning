import { ensureSpace, type PdfReportContext } from './pdf-context'

export function addHeading(ctx: PdfReportContext, text: string, size = 15) {
  const { pdf, colors, page } = ctx
  ensureSpace(ctx, size + 24)
  pdf.setTextColor(...colors.text)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(size)
  pdf.text(text, page.margin, ctx.y)
  ctx.y += size + 10
}

export function addCallout(ctx: PdfReportContext, text: string) {
  const { pdf, colors, page } = ctx
  ensureSpace(ctx, 74)
  pdf.setFillColor(...colors.surface)
  pdf.roundedRect(page.margin, ctx.y, page.width - page.margin * 2, 64, 8, 8, 'F')
  pdf.setDrawColor(...colors.accent)
  pdf.setLineWidth(2)
  pdf.line(page.margin + 1, ctx.y + 10, page.margin + 1, ctx.y + 54)
  pdf.setLineWidth(1)
  pdf.setTextColor(...colors.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.splitTextToSize(text, page.width - page.margin * 2 - 28)
    .slice(0, 3)
    .forEach((line: string, index: number) => {
      pdf.text(line, page.margin + 16, ctx.y + 22 + index * 14)
    })
  ctx.y += 78
}

export function addBulletList(ctx: PdfReportContext, rows: string[]) {
  const { pdf, colors, page } = ctx
  rows.forEach((row) => {
    ensureSpace(ctx, 24)
    pdf.setFillColor(...colors.accent)
    pdf.circle(page.margin + 4, ctx.y - 3, 2, 'F')
    pdf.setTextColor(...colors.muted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.splitTextToSize(row, page.width - page.margin * 2 - 16).forEach((line: string) => {
      pdf.text(line, page.margin + 14, ctx.y)
      ctx.y += 12
    })
    ctx.y += 4
  })
}
