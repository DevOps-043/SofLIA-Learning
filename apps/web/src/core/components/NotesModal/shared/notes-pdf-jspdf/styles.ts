import type { jsPDF as JsPdfDocument } from 'jspdf'
import { BODY_STYLE, PDF_TEXT_STYLES } from './constants'
import type { ParsedHtmlItem, PdfColorMethod, PdfRgbColor, PdfTextStyle } from './types'

export function resolvePdfTextStyle(item: ParsedHtmlItem): PdfTextStyle {
  if (item.type === 'link' && item.url) return PDF_TEXT_STYLES.link
  if (!item.style) return PDF_TEXT_STYLES.body

  const styles = item.style.split(',')
  const hasBold =
    styles.includes('bold') ||
    styles.includes('h1') ||
    styles.includes('h2') ||
    styles.includes('h3')
  const hasItalic = styles.includes('italic')

  if (item.style === 'h1') return PDF_TEXT_STYLES.h1
  if (item.style === 'h2') return PDF_TEXT_STYLES.h2
  if (item.style === 'h3') return PDF_TEXT_STYLES.h3
  if (hasBold && hasItalic) return { ...BODY_STYLE, fontStyle: 'bolditalic' }
  if (hasBold) return { ...BODY_STYLE, fontStyle: 'bold' }
  if (hasItalic) return { ...BODY_STYLE, fontStyle: 'italic' }
  return PDF_TEXT_STYLES.body
}

export function setPdfColor(pdf: JsPdfDocument, method: PdfColorMethod, color: PdfRgbColor) {
  if (method === 'draw') {
    pdf.setDrawColor(color[0], color[1], color[2])
    return
  }
  if (method === 'fill') {
    pdf.setFillColor(color[0], color[1], color[2])
    return
  }
  pdf.setTextColor(color[0], color[1], color[2])
}

export function applyTextStyle(pdf: JsPdfDocument, style: PdfTextStyle) {
  pdf.setFontSize(style.fontSize)
  pdf.setFont('helvetica', style.fontStyle)
  setPdfColor(pdf, 'text', style.color)
}
