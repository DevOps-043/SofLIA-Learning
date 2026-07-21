import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { getUserForensicSummary } from '@/features/admin/services/user-forensics/user-forensics.service'
import { generateForensicAnalysis } from '@/features/admin/services/user-forensics/user-forensics.analysis.server'

/**
 * Genera el dictamen pericial forense (análisis con SofLIA/Gemini) sobre la auditoría
 * del usuario. Super-admin, solo lectura. Devuelve el análisis estructurado que el
 * cliente usa para renderizar el PDF.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId } = await params
    const summary = await getUserForensicSummary(userId)
    if (!summary) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const analysis = await generateForensicAnalysis(summary)

    return NextResponse.json(
      { analysis, summary },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } },
    )
  } catch (error) {
    logger.error('Admin user forensics analysis GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar el dictamen forense' },
      { status: 500 },
    )
  }
}
