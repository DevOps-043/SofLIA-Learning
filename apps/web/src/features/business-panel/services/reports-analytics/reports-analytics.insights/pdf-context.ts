import type { jsPDF as JsPdfDocument } from 'jspdf'

type PdfColor = readonly [number, number, number]

export type InsightsPdfHeaderData = {
  generatedAt: string
  locale: string
  periodLabel: string
  periodRange: string
}

export type InsightsPdfContext = {
  pdf: JsPdfDocument
  labels: Record<string, string>
  page: { width: number; height: number; margin: number }
  colors: Record<'accent' | 'danger' | 'line' | 'muted' | 'primary' | 'surface' | 'text', PdfColor>
  y: number
}

export function createInsightsPdfContext(pdf: JsPdfDocument, labels: Record<string, string>): InsightsPdfContext {
  return {
    pdf,
    labels,
    page: { width: pdf.internal.pageSize.getWidth(), height: pdf.internal.pageSize.getHeight(), margin: 40 },
    colors: {
      primary: [10, 37, 64], accent: [0, 180, 150], text: [17, 24, 39], muted: [82, 94, 112],
      line: [220, 226, 235], surface: [247, 249, 252], danger: [239, 68, 68],
    },
    y: 0,
  }
}
