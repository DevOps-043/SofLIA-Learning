import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { getUserForensicSummary } from '@/features/admin/services/user-forensics/user-forensics.service'
import {
  buildForensicExportFilename,
  buildForensicTimelineCsv,
} from '@/features/admin/services/user-forensics/user-forensics.export'

/**
 * Exporta la línea de tiempo forense del usuario como CSV (timestamps en ISO UTC).
 * Super-admin, solo lectura.
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

    const csv = buildForensicTimelineCsv(summary)
    const filename = buildForensicExportFilename(userId)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('Admin user forensics export failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar la auditoría del usuario' },
      { status: 500 },
    )
  }
}
