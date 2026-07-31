import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { DailyAiReportDocument } from '@/features/business-panel/services/daily-ai-report/daily-ai-report.types'

/** Cuerpo común de las rutas que descargan el PDF de estadísticas de un usuario. */
export const userStatsPdfSchema = z.object({
  range: z.enum(['30d', '90d', '180d', '365d']).optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),
})

export type UserStatsPdfBody = z.infer<typeof userStatsPdfSchema>

/**
 * Respuesta común de los informes diarios: el PDF como adjunto y dos cabeceras
 * que permiten a la interfaz avisar de que se reutilizó el documento del día en
 * lugar de generar uno nuevo.
 */
export function dailyReportPdfResponse(document: DailyAiReportDocument): NextResponse {
  const body = document.bytes.buffer.slice(
    document.bytes.byteOffset,
    document.bytes.byteOffset + document.bytes.byteLength,
  ) as ArrayBuffer

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Daily-Report-Reused': document.reused ? '1' : '0',
      'X-Daily-Report-Date': document.reportDate,
    },
  })
}
