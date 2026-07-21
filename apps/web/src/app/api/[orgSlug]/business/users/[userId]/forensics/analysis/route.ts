import { NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { getUserForensicSummary } from '@/features/admin/services/user-forensics/user-forensics.service'
import { generateForensicAnalysis } from '@/features/admin/services/user-forensics/user-forensics.analysis.server'

/**
 * Dictamen pericial forense (auditoría con SofLIA) para el ADMIN DE ORGANIZACIÓN.
 * Autorizado por organización: el usuario objetivo debe pertenecer a la organización
 * del solicitante (rol Business). Solo lectura.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string; userId: string }> },
) {
  try {
    const { orgSlug, userId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 },
      )
    }

    const supabase = createBusinessUsersAdminClient()
    const { data: membership } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', auth.organizationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o no pertenece a tu organización' },
        { status: 403 },
      )
    }

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
    logger.error('Business user forensics analysis GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar el dictamen forense' },
      { status: 500 },
    )
  }
}
