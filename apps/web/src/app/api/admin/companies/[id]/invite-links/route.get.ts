import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { nanoid } from 'nanoid'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = await params

    const supabase = await createClient()

    const { data: links, error } = await supabase
      .from('bulk_invite_links')
      .select(SELECT_COLUMNS.bulk_invite_links)
      .eq('organization_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      techDebtLogger.error('Error fetching bulk invite links:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener enlaces de invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      links: links || []
    })
  } catch (error) {
    techDebtLogger.error('Error in GET /api/admin/companies/[id]/invite-links:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
