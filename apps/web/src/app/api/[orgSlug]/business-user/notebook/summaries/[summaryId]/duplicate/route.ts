import { NextResponse } from 'next/server'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { duplicateSofliaSummaryAsNote } from '@/features/notebook/services/notebook.server.service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string; summaryId: string }> },
) {
  try {
    const { orgSlug, summaryId } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })

    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado.' },
        { status: 403 },
      )
    }

    const result = await duplicateSofliaSummaryAsNote(
      auth.userId,
      auth.organizationId,
      summaryId,
    )

    return NextResponse.json(result, { status: result.success ? 201 : 400 })
  } catch (error) {
    logger.error('Notebook summary duplicate POST failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al duplicar el apunte SofLIA.' },
      { status: 500 },
    )
  }
}
