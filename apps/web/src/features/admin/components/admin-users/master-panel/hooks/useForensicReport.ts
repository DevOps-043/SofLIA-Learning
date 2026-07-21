'use client'

import { useCallback, useState } from 'react'
import type {
  ForensicAnalysis,
  UserForensicSummary,
} from '@/features/admin/services/user-forensics/user-forensics.types'

interface AnalysisResponse {
  analysis: ForensicAnalysis
  summary: UserForensicSummary
}

/**
 * Genera el dictamen pericial forense (análisis con SofLIA) y descarga el PDF.
 * El análisis se pide al servidor (Gemini) y el PDF se renderiza en el cliente con
 * import dinámico de react-pdf para no pesar en el bundle del panel.
 */
export function useForensicReport(
  userId: string,
  userLabel: string,
  userEmail: string | null,
  /** URL del endpoint de análisis. Por defecto el de super-admin; el panel de
   * organización pasa su ruta org-autorizada. */
  analysisUrl = `/api/admin/users/${userId}/forensics/analysis`,
) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch(analysisUrl)
      if (!response.ok) throw new Error('analysis-failed')
      const { analysis, summary } = (await response.json()) as AnalysisResponse

      const { generateForensicReportPdf } = await import(
        '@/features/admin/services/user-forensics/pdf/generate-forensic-report-pdf'
      )
      const blob = await generateForensicReportPdf(analysis, summary, { userLabel, userEmail })

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `dictamen-forense-${userId}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo generar el dictamen')
    } finally {
      setIsGenerating(false)
    }
  }, [analysisUrl, userId, userLabel, userEmail])

  return { isGenerating, error, generate }
}
