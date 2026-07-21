import type {
  ForensicAnalysis,
  UserForensicSummary,
} from '../user-forensics.types'

export interface GenerateForensicPdfOptions {
  userLabel: string
  userEmail: string | null
}

/**
 * Genera el PDF del dictamen forense con `@react-pdf/renderer`. La librería y el
 * documento se importan de forma DINÁMICA para no cargar react-pdf hasta que el
 * super-admin exporta (y para mantenerlo fuera del SSR).
 */
export async function generateForensicReportPdf(
  analysis: ForensicAnalysis,
  summary: UserForensicSummary,
  options: GenerateForensicPdfOptions,
): Promise<Blob> {
  const [{ pdf }, { ForensicReportPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ForensicReportPdfDocument'),
  ])

  const generatedAtLabel = `${analysis.generatedAtUtc.slice(0, 16).replace('T', ' ')} UTC`

  return pdf(
    <ForensicReportPdfDocument
      analysis={analysis}
      summary={summary}
      userLabel={options.userLabel}
      userEmail={options.userEmail}
      generatedAtLabel={generatedAtLabel}
    />,
  ).toBlob()
}
