import type { InsightsPdfContext, InsightsPdfHeaderData } from './pdf-context'
import { ensureSpace } from './pdf-layout'

export function addMetricCards(ctx: InsightsPdfContext, items: Array<{ label: string; value: string | number; detail?: string }>, header: InsightsPdfHeaderData) {
  const gap = 12
  const cardWidth = (ctx.page.width - ctx.page.margin * 2 - gap) / 2
  const cardHeight = 70
  items.forEach((item, index) => {
    const column = index % 2
    if (column === 0) ensureSpace(ctx, cardHeight + 10, header)
    const x = ctx.page.margin + column * (cardWidth + gap)
    drawMetricCard(ctx, item, x, ctx.y, cardWidth, cardHeight)
    if (column === 1 || index === items.length - 1) ctx.y += cardHeight + 10
  })
}

export function addBulletList(ctx: InsightsPdfContext, rows: string[], header: InsightsPdfHeaderData) {
  rows.forEach((row) => {
    ensureSpace(ctx, 24, header)
    ctx.pdf.setFillColor(...ctx.colors.accent)
    ctx.pdf.circle(ctx.page.margin + 4, ctx.y - 3, 2, 'F')
    ctx.pdf.setTextColor(...ctx.colors.muted)
    ctx.pdf.setFont('helvetica', 'normal')
    ctx.pdf.setFontSize(9)
    ctx.pdf.splitTextToSize(row, ctx.page.width - ctx.page.margin * 2 - 16).forEach((line: string) => {
      ctx.pdf.text(line, ctx.page.margin + 14, ctx.y)
      ctx.y += 12
    })
    ctx.y += 4
  })
}

export function addCompactTable(ctx: InsightsPdfContext, headers: string[], rows: string[][], widths: number[], header: InsightsPdfHeaderData) {
  const rowHeight = 22
  ensureSpace(ctx, (rows.length + 2) * rowHeight, header)
  drawTableHeader(ctx, headers, widths, rowHeight)
  rows.forEach((row, rowIndex) => drawTableRow(ctx, row, rowIndex, widths, rowHeight, header))
  ctx.y += 10
}

function drawMetricCard(ctx: InsightsPdfContext, item: { label: string; value: string | number; detail?: string }, x: number, y: number, width: number, height: number) {
  ctx.pdf.setFillColor(...ctx.colors.surface)
  ctx.pdf.roundedRect(x, y, width, height, 8, 8, 'F')
  ctx.pdf.setDrawColor(...ctx.colors.line)
  ctx.pdf.roundedRect(x, y, width, height, 8, 8, 'S')
  ctx.pdf.setTextColor(...ctx.colors.muted)
  ctx.pdf.setFont('helvetica', 'normal')
  ctx.pdf.setFontSize(8)
  ctx.pdf.text(item.label, x + 12, y + 18)
  ctx.pdf.setTextColor(...ctx.colors.text)
  ctx.pdf.setFont('helvetica', 'bold')
  ctx.pdf.setFontSize(17)
  ctx.pdf.text(String(item.value), x + 12, y + 42)
  if (!item.detail) return
  ctx.pdf.setTextColor(...ctx.colors.muted)
  ctx.pdf.setFont('helvetica', 'normal')
  ctx.pdf.setFontSize(8)
  ctx.pdf.text(ctx.pdf.splitTextToSize(item.detail, width - 24)[0] || '', x + 12, y + 57)
}

function drawTableHeader(ctx: InsightsPdfContext, headers: string[], widths: number[], rowHeight: number) {
  ctx.pdf.setFillColor(...ctx.colors.primary)
  ctx.pdf.rect(ctx.page.margin, ctx.y, ctx.page.width - ctx.page.margin * 2, rowHeight, 'F')
  ctx.pdf.setTextColor(255, 255, 255)
  ctx.pdf.setFont('helvetica', 'bold')
  ctx.pdf.setFontSize(8)
  let x = ctx.page.margin + 8
  headers.forEach((tableHeader, index) => { ctx.pdf.text(tableHeader, x, ctx.y + 14); x += widths[index] })
  ctx.y += rowHeight
}

function drawTableRow(ctx: InsightsPdfContext, row: string[], rowIndex: number, widths: number[], rowHeight: number, header: InsightsPdfHeaderData) {
  ensureSpace(ctx, rowHeight, header)
  if (rowIndex % 2 === 0) { ctx.pdf.setFillColor(...ctx.colors.surface); ctx.pdf.rect(ctx.page.margin, ctx.y, ctx.page.width - ctx.page.margin * 2, rowHeight, 'F') }
  ctx.pdf.setTextColor(...ctx.colors.text)
  ctx.pdf.setFont('helvetica', 'normal')
  ctx.pdf.setFontSize(8)
  let x = ctx.page.margin + 8
  row.forEach((cell, index) => { ctx.pdf.text(ctx.pdf.splitTextToSize(cell, widths[index] - 10)[0] || '', x, ctx.y + 14); x += widths[index] })
  ctx.y += rowHeight
}
