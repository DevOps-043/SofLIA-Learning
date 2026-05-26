import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

interface RouteParams {
  params: Promise<{
    id: string
    linkId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId, linkId } = await params
    const supabase = await createClient()

    const { data: link, error } = await supabase
      .from('bulk_invite_links')
      .select(SELECT_COLUMNS.bulk_invite_links)
      .eq('id', linkId)
      .eq('organization_id', companyId)
      .single()

    if (error || !link) {
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      link
    })
  } catch (error) {
    techDebtLogger.error('Error in GET /api/admin/companies/[id]/invite-links/[linkId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
