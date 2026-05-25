import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'

interface RouteParams {
  params: Promise<{
    id: string
    linkId: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId, linkId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('bulk_invite_links')
      .delete()
      .eq('id', linkId)
      .eq('organization_id', companyId)

    if (error) {
      techDebtLogger.error('Error deleting bulk invite link:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el enlace' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Enlace eliminado correctamente'
    })
  } catch (error) {
    techDebtLogger.error('Error in DELETE /api/admin/companies/[id]/invite-links/[linkId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
