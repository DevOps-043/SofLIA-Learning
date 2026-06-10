import type { jsPDF } from 'jspdf'
import { PDF_COLORS } from '@/features/business-panel/services/reports-analytics/export/export.colors'

export interface UserStatsPdfHeader {
  title: string
  subtitle: string
  generatedAtLabel: string
  generatedAtValue: string
  periodLabel: string
  periodValue: string
}

/**
 * Layout branded SofLIA para el PDF de estadísticas por usuario. Replica la forma
 * estructural de `createPdfLayout` (reports-analytics) para poder reutilizar las
 * primitivas `renderPdfMetricGrid` / `renderPdfTable` / `renderPdfProgressBar`,
 * pero con una cabecera propia (nombre de usuario / empresa) y sin acoplarse al
 * dataset de reports-analytics.
 */
export function createUserStatsPdfLayout(pdf: jsPDF, header: UserStatsPdfHeader) {
  const page = {
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    margin: 40,
  }
  let y = 0

  const addHeader = (firstPage: boolean) => {
    y = page.margin
    pdf.setFillColor(...PDF_COLORS.primary)
    pdf.roundedRect(page.margin, y, page.width - page.margin * 2, 96, 10, 10, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(firstPage ? 20 : 15)
    pdf.text(header.title, page.margin + 24, y + 30)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text(header.subtitle, page.margin + 24, y + 50)
    pdf.setFontSize(9)
    pdf.text(`${header.generatedAtLabel}: ${header.generatedAtValue}`, page.margin + 24, y + 70)
    pdf.text(`${header.periodLabel}: ${header.periodValue}`, page.margin + 24, y + 84)
    y += 120
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

  return {
    pdf,
    page,
    addHeader,
    ensureSpace,
    section,
    paragraph,
    getY: () => y,
    setY: (nextY: number) => {
      y = nextY
    },
  }
}
