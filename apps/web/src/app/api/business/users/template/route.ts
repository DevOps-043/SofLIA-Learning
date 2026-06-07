import { NextResponse } from 'next/server'

import { buildOrganizationUsersCsvExport } from '@/features/business-panel/services/business-users-export.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }

    const csvContent = await buildOrganizationUsersCsvExport(auth.organizationId)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="usuarios-organizacion.csv"',
      },
    })
  } catch (error) {
    logger.error('Error in /api/business/users/template:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno al generar el archivo' },
      { status: 500 },
    )
  }
}
