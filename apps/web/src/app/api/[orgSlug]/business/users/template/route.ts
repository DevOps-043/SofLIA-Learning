import { NextRequest, NextResponse } from 'next/server'

import { buildOrganizationUsersCsvExport } from '@/features/business-panel/services/business-users-export.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
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
        'Content-Disposition': `attachment; filename="usuarios-${orgSlug}.csv"`,
      },
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/users/template:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar plantilla' },
      { status: 500 },
    )
  }
}
